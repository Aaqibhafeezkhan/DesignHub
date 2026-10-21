import { describe, expect, test } from "vitest";

import { hasReducedMotionRule, motionIn, motionRow, motionSection } from "@/lib/a11y/motion";
import { effectStylesheet } from "@/lib/effects/css";
import { effectDefaults } from "@/lib/effects/defaults";
import { effectDefinitions, generateEffect } from "@/lib/effects/registry";
import type { EffectKind, EffectSettingsMap } from "@/types/effects";

/** Every effect that has an animation switch, turned on. */
const animated: EffectSettingsMap = {
  ...effectDefaults,
  border: { ...effectDefaults.border, animated: true },
  "gradient-text": { ...effectDefaults["gradient-text"], animated: true },
};

const css = (kind: EffectKind, settings: EffectSettingsMap) =>
  effectStylesheet(generateEffect(kind, settings[kind])!, `.fx-${kind}`);

describe("reading a stylesheet", () => {
  test("finds keyframe animations and transform transitions, and ignores colors that fade", () => {
    expect(motionIn(".a { animation: spin 1s infinite; }")).toBe("Animation");
    expect(motionIn("@keyframes spin { to { transform: rotate(1turn); } }")).toBe("Animation");
    expect(motionIn(".a { transition: transform 150ms ease; }")).toBe("Transform transition");
    expect(motionIn(".a { animation: spin 1s; transition: transform 1s, box-shadow 1s; }")).toBe(
      "Animation and transform transition",
    );
    expect(motionIn(".a { transition: color 150ms ease, background-color 150ms ease; }")).toBeNull();
    expect(motionIn(".a { color: red; }")).toBeNull();
  });

  test("finds a prefers-reduced-motion media query", () => {
    expect(hasReducedMotionRule("@media (prefers-reduced-motion: reduce) { .a { animation: none; } }")).toBe(true);
    expect(hasReducedMotionRule("@media (prefers-reduced-motion: no-preference) { .a { animation: x 1s; } }")).toBe(
      true,
    );
    expect(hasReducedMotionRule("@media screen and (prefers-reduced-motion: reduce) { .a { } }")).toBe(true);
    expect(hasReducedMotionRule(".a { animation: none; }")).toBe(false);
    expect(hasReducedMotionRule("/* prefers-reduced-motion */ .a { animation: x 1s; }")).toBe(false);
    expect(hasReducedMotionRule("@media (prefers-color-scheme: dark) { .a { } }")).toBe(false);
  });
});

describe("a row for one effect", () => {
  test("fails when the CSS has an animation and no reduced-motion rule", () => {
    expect(motionRow("Spinner", ".fx-spin { animation: spin 1s linear infinite; }")).toEqual({
      check: "Spinner",
      motion: "Animation",
      reducedMotionRule: false,
      pass: false,
    });
  });

  test("passes when the same animation has a reduced-motion rule", () => {
    const row = motionRow(
      "Spinner",
      ".fx-spin { animation: spin 1s linear infinite; }\n@media (prefers-reduced-motion: reduce) { .fx-spin { animation: none; } }",
    );
    expect(row).toMatchObject({ reducedMotionRule: true, pass: true });
  });

  test("has no row for CSS that doesn't move", () => {
    expect(motionRow("Shadow", ".fx-shadow { box-shadow: 0 1px 2px #000; }")).toBeNull();
  });

  test("fails a real animated effect once its reduced-motion rule is taken out", () => {
    for (const kind of ["border", "gradient-text", "skeleton", "button-press"] as const) {
      const real = css(kind, animated);
      expect(motionRow(kind, real)?.pass, kind).toBe(true);
      const stripped = real.replaceAll("@media (prefers-reduced-motion", "@media (print");
      expect(motionRow(kind, stripped), kind).toMatchObject({ reducedMotionRule: false, pass: false });
    }
  });
});

describe("the section for the Effects Lab settings", () => {
  test("lists the effects that move with the defaults, and they all pass", () => {
    const section = motionSection(effectDefaults);
    const names = section.checks.map((row) => row.check);
    expect(names).toContain("Skeleton");
    expect(names).toContain("Button press");
    // Static effects at their defaults aren't listed.
    expect(names).not.toContain("Shadow");
    expect(names).not.toContain("Border");
    expect(section.checks.every((row) => row.pass)).toBe(true);
    expect(section.pass).toBe(true);
  });

  test("lists an animated border and a gradient text shift once they are switched on", () => {
    const names = motionSection(animated).checks.map((row) => row.check);
    expect(names).toContain("Border");
    expect(names).toContain("Gradient text");
  });

  test("every effect in the registry that animates has a reduced-motion rule", () => {
    const section = motionSection(animated);
    expect(section.pass).toBe(true);
    for (const row of section.checks) expect(row.reducedMotionRule, row.check).toBe(true);
    // Each listed effect really does move: the row comes from the CSS, never from the effect's name.
    for (const definition of effectDefinitions) {
      const row = section.checks.find((item) => item.check === definition.label);
      expect(row !== undefined, definition.label).toBe(motionIn(css(definition.kind, animated)) !== null);
    }
  });
});

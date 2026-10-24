import { contrastRatio, oklch } from "@/lib/color/color";
import type { Oklch } from "@/types/color";
import type { DesignTokens } from "@/types/tokens";
import { header, px } from "@/lib/tokens/formats/shared";
import { roleColor } from "@/lib/tokens/formats/shared-native";
import { defineFormat } from "@/lib/tokens/formats/define";

/** shadcn/ui's own destructive reds: the brand has no role for errors, so they stay as shipped. */
const shadcnDestructive = { light: oklch(0.577, 0.245, 27.325), dark: oklch(0.704, 0.191, 22.216) };

/** `oklch(0.205 0.012 264.5)` in the unitless spelling shadcn/ui themes use. */
function shadcnColor(value: Oklch): string {
  const n = (v: number) => String(Math.round(v * 1000) / 1000);
  const alpha = value.alpha < 1 ? ` / ${Math.round(value.alpha * 100)}%` : "";
  return `oklch(${n(value.l)} ${n(value.c)} ${n(value.c < 0.0005 ? 0 : value.h)}${alpha})`;
}

/** A palette color in light or dark mode: dark mode lifts it to its 300 (or 200) shade, like `roleColor()`. */
function modeColor(color: DesignTokens["colors"][number], dark: boolean): Oklch {
  const shade = dark
    ? (color.shades.find((s) => s.step === 300) ?? color.shades.find((s) => s.step === 200))
    : undefined;
  return shade?.value ?? color.value;
}

/**
 * shadcn/ui (globals.css): the CSS variables shadcn components read, for `:root` and `.dark`,
 * in OKLCH. Background, foreground, primary and accent come from the semantic roles through
 * `roleColor()` (so dark mode swaps background and foreground and lifts the brand colors), and
 * the quieter surfaces (muted, secondary, accent, border) are tints of them on the background.
 */
export function toShadcnTheme(tokens: DesignTokens): string {
  const block = (dark: boolean): [string, Oklch][] => {
    const role = (name: string) => roleColor(tokens, name, dark)?.value;
    const background = role("background") ?? (dark ? oklch(0.145, 0, 0) : oklch(1, 0, 0));
    const foreground = role("foreground") ?? (dark ? oklch(0.985, 0, 0) : oklch(0.145, 0, 0));
    const primary = role("primary") ?? foreground;
    const accent = role("accent") ?? primary;
    // Moves lightness and chroma from the background towards `to` but keeps the more colorful
    // hue, so a tint of amber on navy stays amber instead of passing through gray or magenta.
    const mix = (to: Oklch, amount: number) =>
      oklch(
        background.l + (to.l - background.l) * amount,
        background.c + (to.c - background.c) * amount,
        to.c >= background.c ? to.h : background.h,
      );
    // Text on a brand color: whichever of the theme's background or foreground reads better.
    const on = (fill: Oklch) =>
      contrastRatio(fill, background) >= contrastRatio(fill, foreground) ? background : foreground;
    // Secondary text: the lightest mix of the foreground that still passes WCAG AA on `surface`.
    const subtle = (surface: Oklch) => {
      let amount = 0.55;
      let color = mix(foreground, amount);
      while (contrastRatio(color, surface) < 4.5 && amount < 1) {
        amount = Math.min(1, amount + 0.05);
        color = mix(foreground, amount);
      }
      return color;
    };
    const muted = mix(foreground, dark ? 0.1 : 0.05);
    const secondary = mix(primary, dark ? 0.2 : 0.1);
    const tint = mix(accent, dark ? 0.2 : 0.12);
    const border = mix(foreground, dark ? 0.18 : 0.12);
    const sidebar = mix(foreground, dark ? 0.05 : 0.02);
    // Charts use the brand colors; the background and foreground colors would vanish or look like text.
    const surfaces = new Set(
      tokens.semantic.filter((item) => item.name === "background" || item.name === "foreground").map((r) => r.ref),
    );
    const brand = tokens.colors.filter((color) => !surfaces.has(color.name)).map((color) => modeColor(color, dark));
    const palette = brand.length ? brand : [primary, accent];
    return [
      ["background", background],
      ["foreground", foreground],
      ["card", background],
      ["card-foreground", foreground],
      ["popover", background],
      ["popover-foreground", foreground],
      ["primary", primary],
      ["primary-foreground", on(primary)],
      ["secondary", secondary],
      ["secondary-foreground", foreground],
      ["muted", muted],
      ["muted-foreground", subtle(muted)],
      ["accent", tint],
      ["accent-foreground", foreground],
      ["destructive", dark ? shadcnDestructive.dark : shadcnDestructive.light],
      ["border", border],
      ["input", border],
      ["ring", primary],
      ...[1, 2, 3, 4, 5].map((n): [string, Oklch] => [`chart-${n}`, palette[(n - 1) % palette.length]!]),
      ["sidebar", sidebar],
      ["sidebar-foreground", foreground],
      ["sidebar-primary", primary],
      ["sidebar-primary-foreground", on(primary)],
      ["sidebar-accent", tint],
      ["sidebar-accent-foreground", foreground],
      ["sidebar-border", border],
      ["sidebar-ring", primary],
    ];
  };
  // shadcn/ui derives its sm, md, lg and xl corners from --radius, which is rounded-lg.
  const radius = tokens.radius.find((step) => step.name === "lg") ?? tokens.radius.find((step) => step.name === "md");
  const lines = (dark: boolean) => block(dark).map(([name, value]) => `  --${name}: ${shadcnColor(value)};`);
  return `${header(tokens, (text) => `/* ${text} */`)}
/* shadcn/ui theme: replace the :root and .dark blocks in your globals.css with these. */
:root {
${radius ? `  --radius: ${px(radius.px)};\n` : ""}${lines(false).join("\n")}
}

.dark {
${lines(true).join("\n")}
}
`;
}

export const shadcnFormat = defineFormat({
  id: "shadcn",
  label: "shadcn/ui",
  filename: "globals.css",
  language: "css",
  generate: toShadcnTheme,
});

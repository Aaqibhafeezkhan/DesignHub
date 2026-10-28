import { afterEach, describe, expect, test, vi } from "vitest";

import { fromHex } from "@/lib/color/color";
import { tokenFormat, tokenFormatDefinitions, tokenFormatList, tokenFormats } from "@/lib/tokens/formats";
import type { DesignTokens } from "@/types/tokens";

const tokens: DesignTokens = {
  meta: { name: "Acme", prefix: "", generatedAt: "2026-01-01", colorFormat: "hex" },
  colors: [{ name: "indigo", value: fromHex("#6366f1"), shades: [] }],
  semantic: [{ name: "primary", ref: "indigo", value: fromHex("#6366f1") }],
  gradient: null,
  typography: null,
  effects: [],
  spacing: [{ name: "4", px: 16 }],
  radius: [{ name: "lg", px: 12 }],
};

afterEach(() => vi.restoreAllMocks());

describe("lazy token formats", () => {
  test("listing the formats runs no generator", () => {
    const spies = tokenFormatDefinitions.map((definition) => vi.spyOn(definition, "generate"));
    const list = tokenFormatList(tokens);
    expect(list.length).toBeGreaterThanOrEqual(tokenFormatDefinitions.length);
    expect(list.every((format) => !("code" in format))).toBe(true);
    expect(spies.every((spy) => spy.mock.calls.length === 0)).toBe(true);
  });

  test("opening one format runs only that generator", () => {
    const spies = tokenFormatDefinitions.map((definition) => vi.spyOn(definition, "generate"));
    const css = tokenFormat(tokens, "css");
    expect(css?.code).toContain("--color-indigo");
    expect(spies.filter((spy) => spy.mock.calls.length > 0)).toHaveLength(1);
  });

  test("an unknown id gives nothing", () => {
    expect(tokenFormat(tokens, "nope")).toBeUndefined();
  });

  test("the list matches the full export and each format matches its code", () => {
    const all = tokenFormats(tokens);
    const list = tokenFormatList(tokens);
    expect(list.map(({ id, tier, deprecated, filename }) => ({ id, tier, deprecated, filename }))).toEqual(
      all.map(({ id, tier, deprecated, filename }) => ({ id, tier, deprecated, filename })),
    );
    for (const format of all) expect(tokenFormat(tokens, format.id)).toEqual(format);
  });
});

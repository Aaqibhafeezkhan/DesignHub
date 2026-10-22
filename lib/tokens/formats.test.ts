import { describe, expect, test } from "vitest";

import { contrastRatio, fromHex, parseColor, toHex } from "@/lib/color/color";
import { generateShades } from "@/lib/color/shades";
import {
  tokenFormats,
  toAndroidColors,
  toAndroidTheme,
  toAntTheme,
  toBootstrapVariables,
  toChakraTheme,
  toMantineTheme,
  toMaterialTheme,
  toCss,
  toCssLightDark,
  toCssProperties,
  toFigmaVariables,
  toGtkCss,
  toShadcnTheme,
  type FigmaVariablesRequest,
  toJsModule,
  toNuxtUiConfig,
  toNuxtUiColorsCss,
  toPandaPreset,
  toRadixThemeCss,
  toSassMap,
  toScss,
  toStyledTheme,
  toTamaguiConfig,
  toStylus,
  toUnoConfig,
  toVuetifyTheme,
  toXcodeColorSets,
  toYaml,
  yamlString,
} from "@/lib/tokens/formats";
import { roleColor, toMauiColors, toQtQuickTheme, toWinUiTheme } from "@/lib/tokens/native";
import { xmlError } from "@/lib/test/xml";
import type { DesignTokens } from "@/types/tokens";

const tokens = (prefix = ""): DesignTokens => ({
  meta: { name: "Acme Labs", prefix, generatedAt: "2026-01-01", colorFormat: "hex" },
  colors: [
    { name: "indigo", value: fromHex("#6366f1"), shades: [{ step: 250, value: fromHex("#cdd9f3") }] },
    { name: "indigo-2", value: fromHex("#0f172a"), shades: [{ step: 50, value: fromHex("#f1f6ff") }] },
  ],
  semantic: [{ name: "primary", ref: "indigo", value: fromHex("#6366f1") }],
  gradient: null,
  typography: null,
  effects: [{ name: "shadow-md", value: "0 1px 2px rgb(0 0 0 / 0.1)" }],
  spacing: [
    { name: "0.5", px: 2 },
    { name: "4", px: 16 },
  ],
  radius: [{ name: "lg", px: 12 }],
});

/** Evaluates the generated ES module the way Node would import tokens.mjs. */
async function importModule(code: string) {
  const url = `data:text/javascript;base64,${Buffer.from(code).toString("base64")}`;
  return (await import(/* @vite-ignore */ url)) as { tokens: Record<string, Record<string, string>>; default: unknown };
}

describe("JavaScript module", () => {
  test("exports a frozen object with colors and spacing", async () => {
    const mod = await importModule(toJsModule(tokens()));
    expect(mod.default).toBe(mod.tokens);
    expect(Object.isFrozen(mod.tokens)).toBe(true);
    expect(Object.isFrozen(mod.tokens.color)).toBe(true);
    expect(mod.tokens.color!.primary).toBe("#6366f1");
    // "indigo" shade 250 and "indigo-2" shade 50 stay separate keys.
    expect(mod.tokens.color!["indigo-250"]).toBe("#cdd9f3");
    expect(mod.tokens.color!["indigo-2-50"]).toBe("#f1f6ff");
    expect(mod.tokens.spacing!["0.5"]).toBe("0.125rem");
  });

  test("prepends the prefix to every key", async () => {
    const mod = await importModule(toJsModule(tokens("acme")));
    expect(mod.tokens.color!["acme-indigo"]).toBe("#6366f1");
    expect(mod.tokens.spacing!["acme-4"]).toBe("1rem");
    expect(Object.keys(mod.tokens.radius!)).toEqual(["acme-lg"]);
  });
});

describe("Stylus", () => {
  test("uses the SCSS variable names with Stylus assignments", () => {
    const stylus = toStylus(tokens("acme"));
    const scssNames = [...toScss(tokens("acme")).matchAll(/^(\$[\w-]+):/gm)].map((match) => match[1]);
    const stylusNames = [...stylus.matchAll(/^(\$[\w-]+) = /gm)].map((match) => match[1]);
    expect(stylusNames.slice(0, scssNames.length)).toEqual(scssNames);
    expect(stylus).toContain("$acme-color-indigo = #6366f1\n");
    expect(stylus).toContain("$acme-spacing-0_5 = 0.125rem\n");
    expect(stylus).toContain('$spacing = {\n  "0.5": $acme-spacing-0_5\n  "4": $acme-spacing-4\n}');
  });

  test("passes functions through unquote() so Stylus doesn't evaluate them", () => {
    expect(toStylus(tokens())).toContain('$shadow-md = unquote("0 1px 2px rgb(0 0 0 / 0.1)")');
  });
});

test("the new formats are registered for the Export Engine and the ZIP", () => {
  const formats = tokenFormats(tokens());
  expect(formats.map((format) => format.filename)).toEqual(
    expect.arrayContaining([
      "tokens.mjs",
      "tokens.styl",
      "Theme.kt",
      "tokens.yaml",
      "_tokens-map.scss",
      "uno.config.ts",
      "panda.preset.ts",
      "_bootstrap-variables.scss",
      "app.config.ts",
      "nuxt-ui-colors.css",
      "vuetify.ts",
      "Theme.qml",
    ]),
  );
  expect(formats.map((format) => format.id)).toEqual(
    expect.arrayContaining([
      "chakra",
      "mantine",
      "antd",
      "mui",
      "vuetify",
      "bootstrap",
      "shadcn",
      "figma-variables",
      "nuxt-ui",
      "nuxt-ui-colors",
      "qml",
    ]),
  );
  expect(formats.find((format) => format.id === "shadcn")?.filename).toBe("globals.css");
  expect(formats.find((format) => format.id === "figma-variables")?.filename).toBe("figma-variables.json");
  // Chakra shares theme.ts with React and Vue, which the ZIP puts in a folder per format.
  expect(formats.find((format) => format.id === "chakra")?.filename).toBe("theme.ts");
});

describe("styled-components theme", () => {
  test("keeps shades of similarly named colors apart", () => {
    const theme = toStyledTheme(tokens());
    expect(theme).toContain('indigo250: "#cdd9f3"');
    expect(theme).toContain('indigo2_50: "#f1f6ff"');
  });
});

describe("YAML", () => {
  test("writes colors, spacing and the prefix with # values quoted", () => {
    const yaml = toYaml(tokens("acme"));
    expect(yaml).toMatch(/^# Acme Labs - design tokens/);
    expect(yaml).toContain('color:\n  acme-indigo: "#6366f1"\n');
    expect(yaml).toContain('  acme-indigo-2-50: "#f1f6ff"\n');
    expect(yaml).toContain('semantic:\n  acme-primary: "#6366f1"\n');
    expect(yaml).toContain("spacing:\n  acme-0.5: 0.125rem\n  acme-4: 1rem\n");
    expect(yaml).toContain('  acme-shadow-md: "0 1px 2px rgb(0 0 0 / 0.1)"\n');
  });

  test("quotes keys and values YAML would read as numbers, booleans or comments", () => {
    const yaml = toYaml(tokens());
    expect(yaml).toContain('spacing:\n  "0.5": 0.125rem\n  "4": 1rem\n');
    expect(["yes", "No", "null", "~", "0", "1e3", "0x1f", ".inf", "#fff", "a: b"].map(yamlString)).toEqual([
      '"yes"',
      '"No"',
      '"null"',
      '"~"',
      '"0"',
      '"1e3"',
      '"0x1f"',
      '".inf"',
      '"#fff"',
      '"a: b"',
    ]);
    expect(yamlString("0.125rem")).toBe("0.125rem");
  });
});

describe("Sass map", () => {
  test("nests every group in $tokens and adds a token() lookup", () => {
    const sass = toSassMap(tokens("acme"));
    expect(sass).toContain('@use "sass:map";');
    expect(sass).toContain('$tokens: (\n  "color": (\n    "indigo": #6366f1,\n    "indigo-250": #cdd9f3,');
    expect(sass).toContain('  "spacing": (\n    "0.5": 0.125rem,\n    "4": 1rem,\n  ),');
    expect(sass).toContain('"shadow-md": 0 1px 2px rgb(0 0 0 / 0.1),');
    expect(sass).toContain("@function token($group, $name) {");
    expect(sass).toContain("@return map.get($tokens, $group, $name);");
  });

  test("wraps values with commas so they stay one map entry", () => {
    const layered = { ...tokens(), effects: [{ name: "shadow-lg", value: "0 1px 2px #000, 0 4px 8px #000" }] };
    expect(toSassMap(layered)).toContain('"shadow-lg": (0 1px 2px #000, 0 4px 8px #000),');
  });
});

describe("UnoCSS", () => {
  test("nests shades under each color and prepends the prefix to theme keys", () => {
    const uno = toUnoConfig(tokens("acme"));
    expect(uno).toContain('import { defineConfig, presetWind3, type PresetWind3Theme } from "unocss";');
    expect(uno).toContain("presets: [presetWind3()],");
    expect(uno).toContain('"acme-indigo": { 250: "#cdd9f3", DEFAULT: "#6366f1" },');
    expect(uno).toContain('"acme-indigo-2": { 50: "#f1f6ff", DEFAULT: "#0f172a" },');
    expect(uno).toContain('"acme-primary": "#6366f1",');
    expect(uno).toContain('spacing: { "acme-0.5": "0.125rem", "acme-4": "1rem" },');
    expect(uno).toContain('borderRadius: { "acme-lg": "0.75rem" },');
    expect(uno).toContain('boxShadow: { "acme-md": "0 1px 2px rgb(0 0 0 / 0.1)" },');
  });

  test("leaves keys bare without a prefix", () => {
    expect(toUnoConfig(tokens())).toContain('indigo: { 250: "#cdd9f3", DEFAULT: "#6366f1" },');
  });
});

const withRoles: DesignTokens = {
  ...tokens(),
  colors: [
    {
      name: "indigo",
      value: fromHex("#6366f1"),
      shades: [
        { step: 200, value: fromHex("#c7d2fe") },
        { step: 300, value: fromHex("#a5b4fc") },
      ],
    },
    { name: "slate", value: fromHex("#0f172a"), shades: [] },
  ],
  semantic: [
    { name: "primary", ref: "indigo", value: fromHex("#6366f1") },
    { name: "foreground", ref: "slate", value: fromHex("#0f172a") },
    { name: "background", ref: "white", value: fromHex("#ffffff") },
  ],
};

describe("Panda CSS", () => {
  test("writes base tokens for every scale", () => {
    const panda = toPandaPreset(withRoles);
    expect(panda).toContain('import { definePreset } from "@pandacss/dev";');
    expect(panda).toContain('name: "acme-labs",');
    expect(panda).toContain('200: { value: "#c7d2fe" },');
    expect(panda).toContain('DEFAULT: { value: "#6366f1" },');
    expect(panda).toContain('slate: { value: "#0f172a" },');
    expect(panda).toContain('spacing: { 4: { value: "1rem" }, "0.5": { value: "0.125rem" } },');
    expect(panda).toContain('radii: { lg: { value: "0.75rem" } },');
    expect(panda).toContain('shadows: { md: { value: "0 1px 2px rgb(0 0 0 / 0.1)" } },');
  });

  test("semantic tokens reference the base tokens, with lifted and swapped _dark values", () => {
    const panda = toPandaPreset(withRoles);
    expect(panda).toContain('primary: { value: { base: "{colors.indigo}", _dark: "{colors.indigo.300}" } },');
    // Dark mode swaps background and foreground; white has no base token, so it keeps its value.
    expect(panda).toContain('foreground: { value: { base: "{colors.slate}", _dark: "#ffffff" } },');
    expect(panda).toContain('background: { value: { base: "#ffffff", _dark: "{colors.slate}" } },');
  });

  test("prefixes token keys and the references to them", () => {
    const panda = toPandaPreset({ ...withRoles, meta: { ...withRoles.meta, prefix: "acme" } });
    expect(panda).toContain('"acme-slate": { value: "#0f172a" },');
    expect(panda).toContain('_dark: "{colors.acme-indigo.300}"');
  });
});

describe("Chakra UI", () => {
  test("builds a system from defineConfig with base tokens", () => {
    const chakra = toChakraTheme(withRoles);
    expect(chakra).toContain('import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";');
    expect(chakra).toContain("export const system = createSystem(defaultConfig, config);");
    expect(chakra).toContain('300: { value: "#a5b4fc" },');
    expect(chakra).toContain('DEFAULT: { value: "#6366f1" },');
    expect(chakra).toContain('spacing: { 4: { value: "1rem" }, "0.5": { value: "0.125rem" } },');
    expect(chakra).toContain('radii: { lg: { value: "0.75rem" } },');
    expect(chakra).toContain('shadows: { md: { value: "0 1px 2px rgb(0 0 0 / 0.1)" } },');
  });

  test("semantic colors reference base tokens with _dark values", () => {
    const chakra = toChakraTheme({ ...withRoles, meta: { ...withRoles.meta, prefix: "acme" } });
    expect(chakra).toContain('"acme-primary": {');
    expect(chakra).toContain('value: { base: "{colors.acme-indigo}", _dark: "{colors.acme-indigo.300}" },');
    expect(chakra).toContain('"acme-background": { value: { base: "#ffffff", _dark: "{colors.acme-slate}" } },');
  });
});

describe("Mantine", () => {
  const steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
  const hexes = [
    "#eef2ff",
    "#e0e7ff",
    "#c7d2fe",
    "#a5b4fc",
    "#818cf8",
    "#6366f1",
    "#4f46e5",
    "#4338ca",
    "#3730a3",
    "#312e81",
    "#1e1b4b",
  ];
  const shaded: DesignTokens = {
    ...tokens(),
    colors: [
      {
        name: "indigo",
        value: fromHex("#6366f1"),
        shades: steps.map((step, i) => ({ step, value: fromHex(hexes[i]) })),
      },
    ],
  };

  test("maps one color's 50 to 900 shades onto Mantine's ten slots and sets the radius scale", () => {
    const mantine = toMantineTheme(shaded);
    expect(mantine).toContain('import { createTheme } from "@mantine/core";');
    expect(mantine).toContain(
      `indigo: [\n${hexes
        .slice(0, 10)
        .map((hex) => `      "${hex}",`)
        .join("\n")}\n    ],`,
    );
    expect(mantine).not.toContain("#1e1b4b");
    expect(mantine).toContain('primaryColor: "indigo",');
    expect(mantine).toContain('radius: { lg: "0.75rem" },');
    expect(mantine).toContain('spacing: { 4: "1rem", "0.5": "0.125rem" },');
    expect(mantine).toContain('shadows: { md: "0 1px 2px rgb(0 0 0 / 0.1)" },');
  });

  test("fills missing shades from the base color so every tuple has ten hex entries", () => {
    const mantine = toMantineTheme({
      ...tokens("acme"),
      meta: { ...tokens().meta, prefix: "acme", colorFormat: "oklch" },
    });
    const tuple = mantine.match(/"acme-indigo": \[([^\]]*)\]/)?.[1].match(/"#[0-9a-f]{6}"/g);
    expect(tuple).toHaveLength(10);
    expect(mantine).toContain('primaryColor: "acme-indigo",');
    expect(mantine).not.toContain("oklch(");
  });
});

describe("Ant Design", () => {
  /** The `token` block of one config, so light and dark assertions can't see each other. */
  const tokenOf = (code: string, name: "lightTheme" | "darkTheme") => {
    const start = code.indexOf(`export const ${name}: ThemeConfig = {`);
    return code.slice(start, code.indexOf("};", start));
  };

  test("maps the semantic roles onto the seed tokens", () => {
    const antd = toAntTheme(withRoles);
    expect(antd).toContain('import { theme as antdTheme, type ThemeConfig } from "antd";');
    const light = tokenOf(antd, "lightTheme");
    expect(light).toContain(`colorPrimary: "${toHex(roleColor(withRoles, "primary", false)!.value)}",`);
    expect(light).toContain(`colorBgBase: "${toHex(roleColor(withRoles, "background", false)!.value)}",`);
    expect(light).toContain(`colorTextBase: "${toHex(roleColor(withRoles, "foreground", false)!.value)}",`);
    expect(antd).not.toContain("oklch(");
  });

  test("the dark config asks Ant Design for the dark algorithm and reads roleColor in dark mode", () => {
    const antd = toAntTheme(withRoles);
    const dark = tokenOf(antd, "darkTheme");
    expect(dark).toContain("algorithm: antdTheme.darkAlgorithm,");
    expect(dark).toContain(`colorPrimary: "${toHex(roleColor(withRoles, "primary", true)!.value)}",`);
    expect(dark).toContain(`colorBgBase: "${toHex(roleColor(withRoles, "background", true)!.value)}",`);
    expect(tokenOf(antd, "lightTheme")).not.toContain("algorithm:");
  });

  test("keeps the radius and the body font, and still emits a valid config without them", () => {
    const typedConfig = toAntTheme(typed());
    expect(typedConfig).toContain("borderRadius: 12,");
    expect(typedConfig).toContain('fontFamily: "\\"Lora\\", ui-serif, Georgia, serif",');
    const bare = toAntTheme({ ...tokens(), colors: [], semantic: [], radius: [], typography: null });
    expect(bare).toContain("export const lightTheme: ThemeConfig = { token: {} };");
    expect(bare).toContain("algorithm: antdTheme.darkAlgorithm,");
  });
});

describe("Material UI", () => {
  /** The `palette` block of one color scheme, so light and dark assertions can't see each other. */
  const scheme = (code: string, name: "light" | "dark") => {
    const start = code.indexOf(`${name}: {`);
    return code.slice(start, code.indexOf("},\n  },", start));
  };

  test("builds a createTheme with a light and a dark color scheme from the semantic roles", () => {
    const mui = toMaterialTheme(withRoles);
    expect(mui).toContain('import { createTheme } from "@mui/material/styles";');
    expect(mui).toContain("colorSchemes: {");
    const light = scheme(mui, "light");
    expect(light).toContain('main: "#6366f1",');
    // The lighter and darker stops come from the palette's own shades, not from a fixed percentage.
    expect(light).toContain('light: "#a5b4fc",');
    expect(light).toContain('default: "#ffffff",');
    expect(light).toContain('text: { primary: "#0f172a" }');
    // Indigo 500 takes black label text more legibly than white, so contrastText follows the contrast.
    expect(light).toContain('contrastText: "#000000",');
    expect(mui).not.toContain("oklch(");
  });

  test("the dark scheme reads roleColor in dark mode and lifts paper off the page", () => {
    const mui = toMaterialTheme(withRoles);
    const dark = scheme(mui, "dark");
    expect(dark).toContain(`main: "${toHex(roleColor(withRoles, "primary", true)!.value)}",`);
    expect(dark).not.toContain('main: "#6366f1",');
    const value = (block: string, key: string) => block.match(new RegExp(`${key}: "(#[0-9a-f]{6})"`))?.[1];
    expect(value(dark, "paper")).toBeDefined();
    expect(value(dark, "paper")).not.toBe(value(dark, "default"));
  });

  test("puts the heading font on the headings and the body font everywhere else", () => {
    const mui = toMaterialTheme(typed());
    expect(mui).toContain('fontFamily: "\\"Lora\\", ui-serif, Georgia, serif",');
    expect(mui).toContain('fontFamily: "\\"Inter\\", ui-sans-serif, system-ui, sans-serif",');
    expect(mui).toContain("fontWeight: 700,");
    expect(mui).toContain("body1: { fontWeight: 400 },");
    expect(mui).toContain("shape: { borderRadius: 12 },");
  });

  test("still returns a valid createTheme call without typography, radius or a palette", () => {
    const bare = toMaterialTheme({ ...tokens(), colors: [], semantic: [], radius: [] });
    expect(bare).toContain("createTheme({});");
    expect(bare).not.toContain("colorSchemes");
    expect(bare).not.toContain("typography");
    expect(bare).not.toContain("shape");
  });
});

describe("Vuetify", () => {
  /** The color block of one theme set, so light and dark assertions can't see each other. */
  const setOf = (code: string, theme: "light" | "dark") => {
    const start = code.indexOf(`const ${theme}: ThemeDefinition`);
    return code.slice(start, code.indexOf("};", start));
  };

  test("builds a createVuetify theme with a light and a dark set from the semantic roles", () => {
    const vuetify = toVuetifyTheme(withRoles);
    expect(vuetify).toContain('import { createVuetify, type ThemeDefinition } from "vuetify";');
    expect(vuetify).toContain('defaultTheme: "light",');
    expect(vuetify).toContain("themes: { light, dark },");
    const light = setOf(vuetify, "light");
    expect(light).toContain("dark: false,");
    expect(light).toContain('background: "#ffffff",');
    expect(light).toContain('primary: "#6366f1",');
    expect(light).toContain('secondary: "#6366f1",');
    // Indigo 500 takes black label text more legibly than white, so the slot follows the contrast.
    expect(light).toContain('"on-primary": "#000000",');
    expect(vuetify).not.toContain("oklch(");
  });

  test("the dark set matches roleColor in both modes and lifts surface off the page", () => {
    const vuetify = toVuetifyTheme(withRoles);
    const light = setOf(vuetify, "light");
    const dark = setOf(vuetify, "dark");
    expect(dark).toContain("dark: true,");
    expect(dark).toContain(`primary: "${toHex(roleColor(withRoles, "primary", true)!.value)}",`);
    expect(dark).toContain(`background: "${toHex(roleColor(withRoles, "background", true)!.value)}",`);
    expect(dark).not.toContain('background: "#ffffff",');
    const value = (block: string, slot: string) => block.match(new RegExp(`${slot}: "(#[0-9a-f]{6})"`))?.[1];
    expect(value(light, "surface")).toBe(value(light, "background"));
    expect(value(dark, "surface")).toBeDefined();
    expect(value(dark, "surface")).not.toBe(value(dark, "background"));
  });

  test("prefixes palette colors and leaves the slots Vuetify reads unprefixed", () => {
    const vuetify = toVuetifyTheme({ ...withRoles, meta: { ...withRoles.meta, prefix: "acme" } });
    expect(vuetify).toContain('"acme-indigo": "#6366f1",');
    expect(vuetify).toContain('"acme-slate": "#0f172a",');
    expect(vuetify).not.toContain('"acme-primary"');
    expect(vuetify).toContain('primary: "#6366f1",');
  });
});

describe("Bootstrap", () => {
  test("overrides Bootstrap's variables with hex colors whatever the color format", () => {
    const bootstrap = toBootstrapVariables({
      ...withRoles,
      meta: { ...withRoles.meta, colorFormat: "oklch" },
      semantic: [...withRoles.semantic, { name: "accent", ref: "indigo", value: fromHex("#a5b4fc") }],
      radius: [
        { name: "sm", px: 4 },
        { name: "md", px: 8 },
      ],
    });
    expect(bootstrap).toContain("$primary: #6366f1;\n");
    expect(bootstrap).toContain("$secondary: #a5b4fc;\n");
    expect(bootstrap).toContain("$body-color: #0f172a;\n");
    expect(bootstrap).toContain("$body-bg: #ffffff;\n");
    expect(bootstrap).toContain("$spacer: 1rem;\n");
    expect(bootstrap).toContain("$border-radius: 0.5rem;\n$border-radius-sm: 0.25rem;\n");
    expect(bootstrap).toContain("$box-shadow: 0 1px 2px rgb(0 0 0 / 0.1);\n");
    expect(bootstrap).not.toContain("oklch");
  });

  test("writes font variables from the typography and skips what's missing", () => {
    const bootstrap = toBootstrapVariables({
      ...tokens(),
      typography: {
        heading: { family: "Space Grotesk", category: "sans-serif", weights: [600], italic: false, rank: 1 },
        body: { family: "Inter", category: "sans-serif", weights: [400], italic: false, rank: 1 },
        steps: [],
        rhythm: {
          headingWeight: 600,
          bodyWeight: 400,
          headingLineHeight: 1.1,
          bodyLineHeight: 1.6,
          headingTracking: 0,
          bodyTracking: 0,
        },
      },
    });
    expect(bootstrap).toContain('$font-family-sans-serif: "Inter", ');
    expect(bootstrap).toContain('$headings-font-family: "Space Grotesk", ');
    expect(bootstrap).toContain("$headings-font-weight: 600;\n");
    expect(bootstrap).toContain("$line-height-base: 1.6;\n");
    expect(bootstrap).not.toContain("$body-bg");
  });
});

/** The `--name: value` declarations inside one CSS block. */
function cssBlock(css: string, selector: string): Map<string, string> {
  const body = css.split(`\n${selector} {\n`)[1]?.split("\n}")[0] ?? "";
  return new Map([...body.matchAll(/^ {2}--([\w-]+): (.+);$/gm)].map((match) => [match[1]!, match[2]!]));
}

const hexOf = (value: string | undefined) => toHex(parseColor(value ?? "") ?? fromHex("#000"));

describe("shadcn/ui", () => {
  const css = toShadcnTheme({
    ...withRoles,
    semantic: [...withRoles.semantic, { name: "accent", ref: "indigo", value: fromHex("#6366f1") }],
  });
  const variables = [
    "background",
    "foreground",
    "card",
    "card-foreground",
    "popover",
    "popover-foreground",
    "primary",
    "primary-foreground",
    "secondary",
    "secondary-foreground",
    "muted",
    "muted-foreground",
    "accent",
    "accent-foreground",
    "destructive",
    "border",
    "input",
    "ring",
    "chart-1",
    "sidebar",
    "sidebar-primary",
  ];

  test(":root carries the light roles in OKLCH", () => {
    const root = cssBlock(css, ":root");
    expect([...root.keys()]).toEqual(expect.arrayContaining(["radius", ...variables]));
    expect(root.get("radius")).toBe("0.75rem");
    const colors = [...root.entries()].filter(([name]) => name !== "radius");
    expect(colors.every(([, value]) => value.startsWith("oklch("))).toBe(true);
    expect(root.get("background")).toBe("oklch(1 0 0)");
    expect(hexOf(root.get("foreground"))).toBe("#0f172a");
    expect(hexOf(root.get("primary"))).toBe("#6366f1");
    expect(hexOf(root.get("primary-foreground"))).toBe("#ffffff");
    expect(root.get("ring")).toBe(root.get("primary"));
    expect(root.get("card")).toBe(root.get("background"));
  });

  test(".dark swaps background and foreground and lifts the brand colors", () => {
    const dark = cssBlock(css, ".dark");
    expect([...dark.keys()]).toEqual(expect.arrayContaining(variables));
    expect(dark.has("radius")).toBe(false);
    expect(hexOf(dark.get("background"))).toBe("#0f172a");
    expect(dark.get("foreground")).toBe("oklch(1 0 0)");
    expect(hexOf(dark.get("primary"))).toBe("#a5b4fc");
    expect(hexOf(dark.get("primary-foreground"))).toBe("#0f172a");
  });

  test("muted text passes WCAG AA on the muted surface in both modes", () => {
    [":root", ".dark"].forEach((selector) => {
      const block = cssBlock(css, selector);
      const text = parseColor(block.get("muted-foreground") ?? "")!;
      const surface = parseColor(block.get("muted") ?? "")!;
      expect(contrastRatio(text, surface)).toBeGreaterThanOrEqual(4.5);
    });
  });
});

/**
 * A small schema check against the documented request body of Figma's
 * `POST /v1/files/:file_key/variables`: the allowed keys and enums on each object, temporary ids
 * that resolve within the request, a value for every mode of a variable's collection and
 * colors as 0-1 floats.
 */
function figmaSchemaErrors(body: unknown): string[] {
  const errors: string[] = [];
  const isObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value);
  const keys = (value: Record<string, unknown>, required: string[], optional: string[], at: string) => {
    required.forEach((key) => {
      if (!(key in value)) errors.push(`${at}: missing ${key}`);
    });
    Object.keys(value).forEach((key) => {
      if (!required.includes(key) && !optional.includes(key)) errors.push(`${at}: unknown ${key}`);
    });
  };
  const list = (value: unknown, at: string): Record<string, unknown>[] => {
    if (!Array.isArray(value)) {
      errors.push(`${at}: not an array`);
      return [];
    }
    return value.filter((item, i): item is Record<string, unknown> => {
      if (!isObject(item)) errors.push(`${at}[${i}]: not an object`);
      return isObject(item);
    });
  };
  if (!isObject(body)) return ["body: not an object"];
  keys(body, [], ["variableCollections", "variableModes", "variables", "variableModeValues"], "body");

  const collections = list(body.variableCollections, "variableCollections");
  collections.forEach((item, i) => {
    keys(item, ["action", "id"], ["name", "initialModeId", "hiddenFromPublishing"], `variableCollections[${i}]`);
    if (item.action !== "CREATE" || typeof item.name !== "string") errors.push(`variableCollections[${i}]: create`);
  });
  const collectionIds = new Set(collections.map((item) => item.id));

  const modes = list(body.variableModes, "variableModes");
  const modesByCollection = new Map<unknown, unknown[]>();
  modes.forEach((item, i) => {
    keys(item, ["action", "id"], ["name", "variableCollectionId"], `variableModes[${i}]`);
    if (!["CREATE", "UPDATE", "DELETE"].includes(String(item.action))) errors.push(`variableModes[${i}]: action`);
    if (!collectionIds.has(item.variableCollectionId)) errors.push(`variableModes[${i}]: unknown collection`);
    const siblings = modesByCollection.get(item.variableCollectionId) ?? [];
    modesByCollection.set(item.variableCollectionId, [...siblings, item.id]);
  });
  collections.forEach((item, i) => {
    // The initial mode already exists once the collection is created, so it can only be updated.
    const initial = modes.find((mode) => mode.id === item.initialModeId);
    if (initial?.action !== "UPDATE") errors.push(`variableCollections[${i}]: initial mode is not updated`);
  });

  const variables = list(body.variables, "variables");
  variables.forEach((item, i) => {
    const at = `variables[${i}]`;
    const optional = ["name", "variableCollectionId", "resolvedType", "description", "hiddenFromPublishing"];
    keys(item, ["action", "id"], [...optional, "scopes", "codeSyntax"], at);
    if (item.action !== "CREATE") errors.push(`${at}: action`);
    if (typeof item.name !== "string" || /[.{}]/.test(item.name)) errors.push(`${at}: name`);
    if (!["BOOLEAN", "FLOAT", "STRING", "COLOR"].includes(String(item.resolvedType))) errors.push(`${at}: type`);
    if (!collectionIds.has(item.variableCollectionId)) errors.push(`${at}: unknown collection`);
    if (!Array.isArray(item.scopes) || item.scopes.length === 0) errors.push(`${at}: scopes`);
    if (isObject(item.codeSyntax)) keys(item.codeSyntax, [], ["WEB", "ANDROID", "iOS"], `${at}.codeSyntax`);
  });
  const variablesById = new Map(variables.map((item) => [item.id, item]));
  const ids = [...collections, ...modes, ...variables].map((item) => item.id);
  if (ids.some((id) => typeof id !== "string") || new Set(ids).size !== ids.length) errors.push("ids: not unique");

  const values = list(body.variableModeValues, "variableModeValues");
  const unit = (value: unknown) => typeof value === "number" && value >= 0 && value <= 1;
  values.forEach((item, i) => {
    const at = `variableModeValues[${i}]`;
    keys(item, ["variableId", "modeId", "value"], [], at);
    const owner = variablesById.get(item.variableId);
    if (!owner) {
      errors.push(`${at}: unknown variable`);
      return;
    }
    if (!modesByCollection.get(owner.variableCollectionId)?.includes(item.modeId)) errors.push(`${at}: mode`);
    const value = item.value;
    if (isObject(value) && value.type === "VARIABLE_ALIAS") {
      keys(value, ["type", "id"], [], `${at}.value`);
      if (variablesById.get(value.id)?.resolvedType !== owner.resolvedType) errors.push(`${at}: alias target`);
    } else if (owner.resolvedType === "COLOR") {
      if (!isObject(value) || !["r", "g", "b"].every((channel) => unit(value[channel]))) errors.push(`${at}: color`);
      else keys(value, ["r", "g", "b"], ["a"], `${at}.value`);
    } else if (owner.resolvedType === "FLOAT" && typeof value !== "number") {
      errors.push(`${at}: float`);
    }
  });
  variables.forEach((item, i) => {
    const expected = modesByCollection.get(item.variableCollectionId) ?? [];
    const set = values.filter((value) => value.variableId === item.id).map((value) => value.modeId);
    if (expected.some((mode) => !set.includes(mode))) errors.push(`variables[${i}]: a mode has no value`);
  });
  return errors;
}

describe("Figma Variables", () => {
  const request = JSON.parse(toFigmaVariables(withRoles)) as FigmaVariablesRequest;
  const variableId = (name: string) => request.variables.find((item) => item.name === name)?.id;
  const modeId = (name: string) => request.variableModes.find((mode) => mode.name === name)?.id;
  const valueOf = (variable: string, mode: string) =>
    request.variableModeValues.find((item) => item.variableId === variableId(variable) && item.modeId === modeId(mode))
      ?.value;

  test("validates against the documented request shape", () => {
    expect(figmaSchemaErrors(request)).toEqual([]);
    expect(figmaSchemaErrors(JSON.parse(toFigmaVariables(tokens())))).toEqual([]);
    // The check itself catches a broken request.
    const broken = { ...request, variableModeValues: request.variableModeValues.slice(1) };
    expect(figmaSchemaErrors(broken)).not.toEqual([]);
  });

  test("writes colors as 0-1 floats and spacing and radius in pixels", () => {
    expect(request.variableCollections.map((item) => item.name)).toEqual(["Primitives", "Semantic"]);
    expect(valueOf("color/indigo/base", "Value")).toEqual({ r: 0.3882, g: 0.4, b: 0.9451, a: 1 });
    expect(valueOf("spacing/0_5", "Value")).toBe(2);
    expect(valueOf("radius/lg", "Value")).toBe(12);
    expect(request.variables.find((item) => item.name === "radius/lg")?.scopes).toEqual(["CORNER_RADIUS"]);
    expect(request.variables.find((item) => item.name === "color/primary")?.codeSyntax.WEB).toBe(
      "var(--color-primary)",
    );
  });

  test("Light and Dark modes alias the right role colors", () => {
    const semanticModes = request.variableModes.filter((mode) => mode.variableCollectionId === "semantic");
    expect(semanticModes.map((mode) => mode.name)).toEqual(["Light", "Dark"]);
    const alias = (id: string | undefined) => ({ type: "VARIABLE_ALIAS", id });
    expect(valueOf("color/primary", "Light")).toEqual(alias(variableId("color/indigo/base")));
    expect(valueOf("color/primary", "Dark")).toEqual(alias(variableId("color/indigo/300")));
    // Dark mode swaps background and foreground; white has no primitive, so it keeps its value.
    expect(valueOf("color/background", "Light")).toEqual({ r: 1, g: 1, b: 1, a: 1 });
    expect(valueOf("color/background", "Dark")).toEqual(alias(variableId("color/slate")));
    expect(valueOf("color/foreground", "Light")).toEqual(alias(variableId("color/slate")));
    expect(valueOf("color/foreground", "Dark")).toEqual({ r: 1, g: 1, b: 1, a: 1 });
  });
});

const typed = (prefix = ""): DesignTokens => ({
  ...tokens(prefix),
  semantic: [
    { name: "primary", ref: "indigo", value: fromHex("#6366f1") },
    { name: "foreground", ref: "indigo-2", value: fromHex("#0f172a") },
    { name: "background", ref: "white", value: fromHex("#ffffff") },
  ],
  typography: {
    heading: { family: "Inter", category: "sans-serif", weights: [700], italic: false, rank: 1 },
    body: { family: "Lora", category: "serif", weights: [400], italic: false, rank: 2 },
    steps: [
      { name: "base", step: 0, minPx: 15, maxPx: 16, clamp: "clamp(0.9375rem, 1rem, 1rem)" },
      { name: "2xl", step: 5, minPx: 28, maxPx: 32, clamp: "clamp(1.75rem, 2rem, 2rem)" },
    ],
    rhythm: {
      headingWeight: 700,
      bodyWeight: 400,
      headingLineHeight: 1.25,
      bodyLineHeight: 1.5,
      headingTracking: -0.02,
      bodyTracking: 0,
    },
  },
});

type SdNode = { $value?: unknown; $type?: string; [key: string]: unknown };

describe("Style Dictionary", () => {
  const formatCode = (id: string, prefix = "") => tokenFormats(typed(prefix)).find((format) => format.id === id)!.code;
  const doc = JSON.parse(formatCode("style-dictionary")) as Record<string, SdNode>;

  test("writes DTCG tokens with $value and $type", () => {
    const color = doc.color as Record<string, SdNode>;
    expect((color.indigo as SdNode).base).toEqual({ $value: "#6366f1", $type: "color" });
    expect((color.indigo as SdNode)["250"]).toEqual({ $value: "#cdd9f3", $type: "color" });
    expect((doc.spacing as Record<string, SdNode>)["0_5"]).toEqual({ $value: "0.125rem", $type: "dimension" });
    expect((doc.font as Record<string, SdNode>)["weight-heading"]).toEqual({ $value: 700, $type: "fontWeight" });
    expect((doc.text as Record<string, SdNode>).base!.$value).toBe("clamp(0.9375rem, 1rem, 1rem)");
    expect((doc.shadow as Record<string, SdNode>).md).toEqual({
      $value: "0 1px 2px rgb(0 0 0 / 0.1)",
      $type: "shadow",
    });
  });

  test("semantic colors reference palette tokens and keep unmatched colors as values", () => {
    const color = doc.color as Record<string, SdNode>;
    expect(color.primary).toEqual({ $value: "{color.indigo.base}", $type: "color" });
    expect(color.foreground!.$value).toBe("{color.indigo-2.base}");
    expect(color.background!.$value).toBe("#ffffff");
  });

  test("every reference points at a token that exists", () => {
    const lookup = (path: string) =>
      path.split(".").reduce<SdNode | undefined>((node, key) => node?.[key] as SdNode | undefined, doc as SdNode);
    const refs = [...JSON.stringify(doc).matchAll(/"\{([^}]+)\}"/g)].map((match) => match[1]!);
    expect(refs.length).toBeGreaterThan(0);
    refs.forEach((ref) => expect(lookup(ref)?.$value, ref).toBeDefined());
  });

  test("config.json builds CSS, SCSS and JS from the tokens file, with the prefix", () => {
    type Config = {
      source: string[];
      platforms: Record<string, { prefix?: string; files: { destination: string }[] }>;
    };
    const config = JSON.parse(formatCode("style-dictionary-config", "acme")) as Config;
    expect(config.source).toEqual(["style-dictionary.tokens.json"]);
    expect(tokenFormats(typed()).map((format) => format.filename)).toContain(config.source[0]);
    expect(Object.keys(config.platforms)).toEqual(["css", "scss", "js"]);
    expect(config.platforms.css!.files[0]!.destination).toBe("tokens.css");
    expect(config.platforms.js!.prefix).toBe("acme");
    expect((JSON.parse(formatCode("style-dictionary-config")) as Config).platforms.css).not.toHaveProperty("prefix");
  });
});

describe("React Native theme", () => {
  const code = tokenFormats(typed()).find((format) => format.id === "react-native")!.code;
  const section = (start: string) => code.split(start)[1]!.split("}")[0]!;

  test("exports light and dark colors from roleColor()", () => {
    expect(section("export const lightColors = {")).toContain('primary: "#6366f1"');
    expect(section("export const lightColors = {")).toContain('background: "#ffffff"');
    // Dark mode swaps the background and foreground roles.
    expect(section("export const darkColors: Colors = {")).toContain('background: "#0f172a"');
    expect(section("export const darkColors: Colors = {")).toContain('foreground: "#ffffff"');
  });

  test("spacing and radius are numbers", () => {
    expect(code).toContain('"0.5": 2,');
    expect(code).toContain("4: 16,");
    expect(code).toContain("lg: 12,");
  });

  test("includes fonts, a TextStyle type scale and a useTheme hook", () => {
    expect(code).toContain('heading: "Inter",');
    expect(code).toContain('fontWeight: "700",');
    expect(code).toContain("lineHeight: 40,");
    expect(code).toContain("as const satisfies Record<string, TextStyle>");
    expect(code).toContain('from "react-native"');
    expect(code).toContain("export function useTheme(): Theme");
  });

  test("is registered with the other native themes", () => {
    expect(tokenFormats(typed()).find((format) => format.id === "react-native")?.filename).toBe("theme.ts");
  });
});

describe("CSS @property", () => {
  const css = toCssProperties(typed("acme"));

  test("registers a color, a length and a number", () => {
    expect(css).toContain(
      '@property --acme-color-primary {\n  syntax: "<color>";\n  inherits: true;\n  initial-value: #6366f1;\n}',
    );
    expect(css).toContain(
      '@property --acme-spacing-4 {\n  syntax: "<length>";\n  inherits: true;\n  initial-value: 1rem;',
    );
    expect(css).toContain(
      '@property --acme-leading-body {\n  syntax: "<number>";\n  inherits: true;\n  initial-value: 1.5;',
    );
    expect(css).toContain("@property --acme-spacing-0\\.5 {");
  });

  test("uses exactly the names of the CSS variables export", () => {
    const declared = [...toCss(typed("acme")).matchAll(/^ {2}(--[^:]+):/gm)].map((match) => match[1]);
    const registered = [...css.matchAll(/@property (--\S+) \{/g)].map((match) => match[1]);
    expect(registered.length).toBeGreaterThan(0);
    registered.forEach((name) => expect(declared).toContain(name));
    expect(registered).not.toContain("--acme-font-heading");
  });

  test("is registered in the Export Engine", () => {
    expect(tokenFormats(typed()).find((format) => format.id === "css-properties")?.filename).toBe("properties.css");
  });
});

describe("Xcode asset catalog", () => {
  type ColorSet = {
    colors: {
      idiom: string;
      appearances?: { appearance: string; value: string }[];
      color: { "color-space": string; components: Record<string, number> };
    }[];
    info: { author: string; version: number };
  };

  test("writes light and dark appearances for a color", () => {
    const set = toXcodeColorSets(typed()).find((item) => item.role === "primary")!;
    expect(set.name).toBe("Primary");
    const json = JSON.parse(set.code) as ColorSet;
    expect(json.info).toEqual({ author: "xcode", version: 1 });
    const [light, dark] = json.colors;
    expect(light!.appearances).toBeUndefined();
    expect(light!.color).toEqual({
      "color-space": "srgb",
      components: { red: 0.388, green: 0.4, blue: 0.945, alpha: 1 },
    });
    expect(dark!.appearances).toEqual([{ appearance: "luminosity", value: "dark" }]);
    expect(dark!.idiom).toBe("universal");
    expect(dark!.color["color-space"]).toBe("srgb");
  });

  test("swaps background and foreground in dark mode", () => {
    const sets = toXcodeColorSets(typed());
    const background = JSON.parse(sets.find((item) => item.role === "background")!.code) as ColorSet;
    expect(background.colors[0]!.color.components.red).toBe(1);
    expect(background.colors[1]!.color.components.red).toBe(0.059);
  });

  test("each color set is its own ExportFormat file", () => {
    const formats = tokenFormats(typed()).filter((format) => format.id.startsWith("xcode-"));
    expect(formats.map((format) => format.filename)).toEqual([
      "Primary.colorset/Contents.json",
      "Foreground.colorset/Contents.json",
      "Background.colorset/Contents.json",
    ]);
  });
});

/** Typed tokens whose primary has a 300 shade, so dark mode lifts it. */
const themed = (prefix = ""): DesignTokens => ({
  ...typed(prefix),
  colors: [
    { name: "indigo", value: fromHex("#6366f1"), shades: [{ step: 300, value: fromHex("#a5b4fc") }] },
    { name: "slate", value: fromHex("#0f172a"), shades: [{ step: 300, value: fromHex("#cbd5e1") }] },
  ],
  semantic: [
    { name: "primary", ref: "indigo", value: fromHex("#6366f1") },
    { name: "accent", ref: "indigo", value: fromHex("#6366f1") },
    { name: "foreground", ref: "slate", value: fromHex("#0f172a") },
    { name: "background", ref: "white", value: fromHex("#ffffff") },
  ],
});

describe("CSS light-dark()", () => {
  test("writes a role as light-dark() with color-scheme on :root", () => {
    const css = toCssLightDark(themed());
    expect(css).toContain(":root {\n  color-scheme: light dark;");
    expect(css).toContain("--color-primary: light-dark(#6366f1, #a5b4fc);");
    // Background and foreground swap in dark mode.
    expect(css).toContain("--color-background: light-dark(#ffffff, #0f172a);");
  });

  test("uses the same names and prefix as the CSS variables export", () => {
    const names = (css: string) => css.match(/--[\w-]+(?=:)/g) ?? [];
    const dark = names(toCssLightDark(themed("brand")));
    expect(dark).toContain("--brand-color-primary");
    const plain = names(toCss(themed("brand")));
    dark.forEach((name) => expect(plain).toContain(name));
  });

  test("is registered in the Export Engine", () => {
    expect(tokenFormats(themed()).find((format) => format.id === "css-light-dark")?.filename).toBe("light-dark.css");
  });
});

describe("Android Material 3 theme", () => {
  const item = (xml: string, name: string) => new RegExp(`<item name="${name}">([^<]*)</item>`).exec(xml)?.[1];

  test("maps primary, surface and outline for light and dark", () => {
    const light = toAndroidTheme(themed());
    const dark = toAndroidTheme(themed(), true);
    expect(light).toContain('parent="Theme.Material3.DayNight.NoActionBar"');
    expect(item(light, "colorPrimary")).toBe("@color/primary");
    expect(item(dark, "colorPrimary")).toBe("@color/indigo_300");
    expect(item(light, "colorSurface")).toBe("@color/background");
    expect(item(dark, "colorSurface")).toBe("@color/foreground");
    expect(item(light, "colorOnSurface")).toBe("@color/foreground");
    // Same pick as Compose: whichever of white and black contrasts more with #6366f1.
    expect(item(light, "colorOnPrimary")).toBe("@android:color/black");
    expect(item(light, "android:colorBackground")).toBe("@color/background");
    expect(item(light, "colorOutline")).toMatch(/^#FF[0-9A-F]{6}$/);
    expect(item(light, "colorOutline")).not.toBe(item(dark, "colorOutline"));
    expect(item(light, "colorPrimaryContainer")).toMatch(/^#FF[0-9A-F]{6}$/);
  });

  test("only references colors that colors.xml defines", () => {
    const colors = toAndroidColors(themed("brand"));
    for (const dark of [false, true]) {
      const xml = toAndroidTheme(themed("brand"), dark);
      for (const [, id] of xml.matchAll(/@color\/(\w+)/g)) expect(colors).toContain(`<color name="${id}">`);
    }
  });

  test("is well-formed XML", () => {
    expect(xmlError(toAndroidTheme(themed()))).toBeNull();
    expect(xmlError(toAndroidTheme(themed(), true))).toBeNull();
    expect(xmlError(toAndroidTheme({ ...themed(), meta: { ...themed().meta, name: "A -- B & <C>" } }))).toBeNull();
  });

  test("both files are separate ExportFormat entries", () => {
    const files = tokenFormats(themed()).filter((format) => format.id.startsWith("android-theme"));
    expect(files.map((format) => format.filename)).toEqual(["themes.xml", "values-night/themes.xml"]);
  });
});

describe("WinUI / WPF", () => {
  const themed = (): DesignTokens => ({
    ...tokens(),
    colors: [
      {
        name: "indigo",
        value: fromHex("#6366f1"),
        shades: [
          { step: 250, value: fromHex("#cdd9f3") },
          { step: 300, value: fromHex("#a5b4fc") },
        ],
      },
    ],
    semantic: [
      { name: "primary", ref: "indigo", value: fromHex("#6366f1") },
      { name: "background", ref: "white", value: fromHex("#ffffff") },
      { name: "foreground", ref: "black", value: fromHex("#0f172a") },
    ],
  });
  const dictionary = (xaml: string, theme: string) =>
    xaml.match(new RegExp(`<ResourceDictionary x:Key="${theme}">([\\s\\S]*?)</ResourceDictionary>`))?.[1] ?? "";

  test("writes the palette as Color and SolidColorBrush pairs in ARGB hex", () => {
    const xaml = toWinUiTheme(themed());
    expect(xaml).toContain('<Color x:Key="AcmeLabsIndigoColor">#FF6366F1</Color>');
    expect(xaml).toContain('<SolidColorBrush x:Key="AcmeLabsIndigo_250Brush" Color="#FFCDD9F3" />');
  });

  test("puts a role in both the Light and Dark theme dictionaries, lifted to shade 300 in dark", () => {
    const xaml = toWinUiTheme(themed());
    expect(dictionary(xaml, "Light")).toContain('<Color x:Key="AcmeLabsPrimaryRoleColor">#FF6366F1</Color>');
    expect(dictionary(xaml, "Dark")).toContain('<Color x:Key="AcmeLabsPrimaryRoleColor">#FFA5B4FC</Color>');
    expect(dictionary(xaml, "Dark")).toContain('<Color x:Key="AcmeLabsBackgroundRoleColor">#FF0F172A</Color>');
  });

  test("never repeats an x:Key and is well-formed XML", () => {
    const xaml = toWinUiTheme({
      ...themed(),
      meta: { ...themed().meta, name: "A -- B & <C>" },
      colors: [
        ...themed().colors,
        { name: "indigo-2", value: fromHex("#0f172a"), shades: [{ step: 50, value: fromHex("#f1f6ff") }] },
      ],
    });
    expect(xmlError(xaml)).toBeNull();
    const keysIn = (text: string) => [...text.matchAll(/x:Key="(\w+)"/g)].map((match) => match[1]);
    const root = xaml.replace(
      /<ResourceDictionary\.ThemeDictionaries>[\s\S]*<\/ResourceDictionary\.ThemeDictionaries>/,
      "",
    );
    for (const scope of [root, dictionary(xaml, "Light"), dictionary(xaml, "Dark")]) {
      expect(new Set(keysIn(scope)).size).toBe(keysIn(scope).length);
    }
  });

  test("is registered in the Export Engine", () => {
    expect(tokenFormats(themed()).find((format) => format.id === "winui")?.filename).toBe("Theme.xaml");
  });
});

describe(".NET MAUI", () => {
  const maui = (): DesignTokens => ({
    ...tokens(),
    colors: [
      {
        name: "indigo",
        value: fromHex("#6366f1"),
        shades: [{ step: 300, value: fromHex("#a5b4fc") }],
      },
      { name: "indigo-2", value: fromHex("#0f172a"), shades: [{ step: 50, value: fromHex("#f1f6ff") }] },
    ],
    semantic: [
      { name: "primary", ref: "indigo", value: fromHex("#6366f1") },
      { name: "background", ref: "white", value: fromHex("#ffffff") },
    ],
  });

  test("uses the MAUI namespace and writes ARGB colors with matching brushes", () => {
    const xaml = toMauiColors(maui());
    expect(xaml).toContain('xmlns="http://schemas.microsoft.com/dotnet/2021/maui"');
    expect(xaml).toContain('<Color x:Key="AcmeLabsIndigoColor">#FF6366F1</Color>');
    expect(xaml).toContain('<SolidColorBrush x:Key="AcmeLabsIndigo_300Brush" Color="#FFA5B4FC" />');
  });

  test("writes each role for light and dark, the dark one lifted to shade 300", () => {
    const xaml = toMauiColors(maui());
    expect(xaml).toContain('<Color x:Key="AcmeLabsPrimaryRoleColor">#FF6366F1</Color>');
    expect(xaml).toContain('<Color x:Key="AcmeLabsPrimaryRoleDarkColor">#FFA5B4FC</Color>');
  });

  test("keys are unique and the XML is well-formed, even for an awkward brand name", () => {
    const xaml = toMauiColors({ ...maui(), meta: { ...maui().meta, name: "A -- B & <C>" } });
    expect(xmlError(xaml)).toBeNull();
    const keys = [...xaml.matchAll(/x:Key="(\w+)"/g)].map((match) => match[1]);
    expect(new Set(keys).size).toBe(keys.length);
  });

  test("is registered in the Export Engine", () => {
    expect(tokenFormats(maui()).find((format) => format.id === "maui")?.filename).toBe("Colors.xaml");
  });
});

describe("Qt Quick", () => {
  test("is registered in the Export Engine", () => {
    const format = tokenFormats(tokens()).find((item) => item.id === "qml");
    expect(format?.filename).toBe("Theme.qml");
    expect(format?.language).toBe("qml");
  });

  test("writes light and dark roles and spacing as QML properties", () => {
    const code = toQtQuickTheme(tokens());
    expect(code).toContain("pragma Singleton");
    expect(code).toContain('readonly property color lightPrimary: "#FF6366F1"');
    expect(code).toContain("readonly property color darkPrimary:");
    expect(code).toContain("readonly property real spacing4: 16");
  });
});

describe("Nuxt UI v3", () => {
  const nuxtTokens = (): DesignTokens => ({
    ...tokens(),
    colors: [
      {
        name: "indigo",
        value: fromHex("#6366f1"),
        shades: [
          { step: 50, value: fromHex("#eef2ff") },
          { step: 950, value: fromHex("#1e1b4b") },
        ],
      },
      {
        name: "violet",
        value: fromHex("#8b5cf6"),
        shades: [
          { step: 50, value: fromHex("#f5f3ff") },
          { step: 950, value: fromHex("#2e1065") },
        ],
      },
      {
        name: "slate",
        value: fromHex("#64748b"),
        shades: [
          { step: 50, value: fromHex("#f8fafc") },
          { step: 950, value: fromHex("#020617") },
        ],
      },
    ],
    semantic: [
      { name: "primary", ref: "indigo", value: fromHex("#6366f1") },
      { name: "secondary", ref: "violet", value: fromHex("#8b5cf6") },
      { name: "neutral", ref: "slate", value: fromHex("#64748b") },
    ],
  });

  test("maps primary, secondary and neutral roles in app.config.ts", () => {
    const config = toNuxtUiConfig(nuxtTokens());
    expect(config).toContain("defineAppConfig(");
    expect(config).toContain('"primary": "indigo"');
    expect(config).toContain('"secondary": "violet"');
    expect(config).toContain('"neutral": "slate"');
    expect(tokenFormats(nuxtTokens()).find((format) => format.id === "nuxt-ui")?.filename).toBe("app.config.ts");
  });

  test("exports shade variables from the role palettes, including 50 and 950", () => {
    const css = toNuxtUiColorsCss(nuxtTokens());
    expect(css).toContain("--ui-color-primary-50: #eef2ff;");
    expect(css).toContain("--ui-color-primary-950: #1e1b4b;");
    expect(css).toContain("--ui-color-secondary-50: #f5f3ff;");
    expect(css).toContain("--ui-color-neutral-950: #020617;");
    expect(css).toContain("--ui-color-primary-500: #6366f1;");
    expect(tokenFormats(nuxtTokens()).find((format) => format.id === "nuxt-ui-colors")?.filename).toBe(
      "nuxt-ui-colors.css",
    );
  });
});

describe("GTK, Tamagui and Radix Themes exports", () => {
  const brandTokens = (prefix = ""): DesignTokens => {
    const color = (name: string, hex: string) => {
      const value = fromHex(hex);
      return { name, value, shades: generateShades(value).map((shade) => ({ step: shade.step, value: shade.color })) };
    };
    return {
      meta: { name: "Acme Labs", prefix, generatedAt: "2026-01-01", colorFormat: "hex" },
      colors: [color("indigo", "#6366f1"), color("slate", "#64748b")],
      semantic: [
        { name: "primary", ref: "indigo", value: fromHex("#6366f1") },
        { name: "background", ref: "slate", value: fromHex("#ffffff") },
        { name: "foreground", ref: "slate", value: fromHex("#0f172a") },
      ],
      gradient: null,
      typography: null,
      effects: [],
      spacing: [
        { name: "0.5", px: 2 },
        { name: "4", px: 16 },
      ],
      radius: [
        { name: "md", px: 9 },
        { name: "full", px: 9999 },
      ],
    };
  };

  test("registers all three formats for the Export Engine and the ZIP", () => {
    const formats = tokenFormats(brandTokens());
    expect(formats.find((format) => format.id === "gtk")?.filename).toBe("gtk.css");
    expect(formats.find((format) => format.id === "tamagui")?.filename).toBe("tamagui.config.ts");
    expect(formats.find((format) => format.id === "radix-themes")?.filename).toBe("radix-theme.css");
  });

  describe("GTK 4 CSS", () => {
    test("writes accent_bg_color in light and dark", () => {
      const css = toGtkCss(brandTokens());
      const [light, dark] = css.split("@media (prefers-color-scheme: dark)");
      expect(light).toContain("@define-color accent_bg_color #6366f1;");
      expect(dark).toContain("@define-color accent_bg_color #b1bdff;");
    });

    test("every @define-color is well-formed", () => {
      const css = toGtkCss(brandTokens());
      const lines = css.split("\n").filter((line) => line.includes("@define-color"));
      expect(lines).toHaveLength(14);
      lines.forEach((line) => expect(line).toMatch(/^\s*@define-color [a-z_]+ #[0-9a-f]{6};$/));
      ["accent_bg_color", "window_bg_color", "view_bg_color", "window_fg_color"].forEach((name) =>
        expect(css).toContain(`@define-color ${name} `),
      );
    });
  });

  describe("Tamagui", () => {
    test("exports color, space, size and radius tokens with valid keys", () => {
      const config = toTamaguiConfig(brandTokens());
      expect(config).toContain('import { createTokens } from "tamagui";');
      expect(config).toContain('indigo500: "#757bff"');
      expect(config).toContain("space: {");
      expect(config).toContain('"0_5": 2');
      expect(config).toContain("4: 16");
      expect(config).toContain("size: {");
      expect(config).toContain("full: 9999");
    });

    test("light and dark themes carry the semantic roles", () => {
      const config = toTamaguiConfig(brandTokens());
      expect(config).toContain('export const light = { primary: "#6366f1", background: "#ffffff"');
      expect(config).toContain('export const dark = { primary: "#b1bdff", background: "#0f172a"');
    });

    test("prefixes token keys with the token prefix", () => {
      const config = toTamaguiConfig(brandTokens("acme"));
      expect(config).toContain("acmeIndigo500:");
      expect(config).toContain("acme4: 16");
    });
  });

  describe("Radix Themes", () => {
    const blocks = (css: string) => {
      const [light, dark] = [".light, .light-theme {", ".dark, .dark-theme {"].map((selector) => {
        const start = css.indexOf(selector);
        return css.slice(start, css.indexOf("}", start));
      });
      return { light, dark };
    };

    test("has a light and a dark block", () => {
      const css = toRadixThemeCss(brandTokens());
      expect(css).toContain(".light, .light-theme {");
      expect(css).toContain(".dark, .dark-theme {");
    });

    test("the accent and gray scales have 12 steps in each block", () => {
      const { light, dark } = blocks(toRadixThemeCss(brandTokens()));
      [light, dark].forEach((block) => {
        ["accent", "gray"].forEach((scale) => {
          const steps = [...block.matchAll(new RegExp(`--${scale}-([0-9]+): #[0-9a-f]{6};`, "g"))].map((m) => m[1]);
          expect(steps).toEqual(Array.from({ length: 12 }, (_, index) => String(index + 1)));
        });
      });
    });

    test("step 9 is the primary color and the steps run from background to text", () => {
      const css = toRadixThemeCss(brandTokens());
      const { light, dark } = blocks(css);
      expect(light).toContain("--accent-9: #6366f1;");
      expect(dark).toContain("--accent-9: #6366f1;");
      const lightness = (block: string, step: number) => {
        const hex = new RegExp(`--accent-${step}: (#[0-9a-f]{6});`).exec(block)?.[1] ?? "";
        return parseColor(hex)?.l ?? NaN;
      };
      expect(lightness(light, 1)).toBeGreaterThan(lightness(light, 9));
      expect(lightness(light, 12)).toBeLessThan(lightness(light, 9));
      expect(lightness(dark, 1)).toBeLessThan(lightness(dark, 9));
      expect(lightness(dark, 12)).toBeGreaterThan(lightness(dark, 9));
    });

    test("derives --radius-factor from the medium radius", () => {
      expect(toRadixThemeCss(brandTokens())).toContain("--radius-factor: 1.5;");
    });
  });
});

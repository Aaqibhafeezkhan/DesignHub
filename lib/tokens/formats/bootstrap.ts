import { toHex } from "@/lib/color/color";
import { fontStack } from "@/lib/typography/css";
import type { DesignTokens } from "@/types/tokens";
import { header, px } from "@/lib/tokens/formats/shared";
import { defineFormat } from "@/lib/tokens/formats/define";

/**
 * Bootstrap 5 (_bootstrap-variables.scss): overrides for Bootstrap's `!default` variables, to
 * import before Bootstrap. Colors are always hex because Bootstrap runs them through Sass color
 * functions (tint-color, shade-color) that can't read oklch().
 */
export function toBootstrapVariables(tokens: DesignTokens): string {
  const hex = (name: string) => {
    const role = tokens.semantic.find((item) => item.name === name);
    return role ? toHex(role.value) : undefined;
  };
  const radius = (name: string) => {
    const step = tokens.radius.find((item) => item.name === name);
    return step ? px(step.px) : undefined;
  };
  // Bootstrap's $spacer is 1rem, the same as spacing-4 at the default base.
  const spacer = tokens.spacing.find((item) => item.name === "4");
  const t = tokens.typography;
  const vars: [string, string | number | undefined][] = [
    ["primary", hex("primary")],
    ["secondary", hex("accent")],
    ["body-color", hex("foreground")],
    ["body-bg", hex("background")],
    ["font-family-sans-serif", t ? fontStack(t.body.family, t.body.category) : undefined],
    ["headings-font-family", t ? fontStack(t.heading.family, t.heading.category) : undefined],
    ["font-weight-normal", t?.rhythm.bodyWeight],
    ["headings-font-weight", t?.rhythm.headingWeight],
    ["line-height-base", t?.rhythm.bodyLineHeight],
    ["headings-line-height", t?.rhythm.headingLineHeight],
    ["spacer", spacer && spacer.px > 0 ? px(spacer.px) : undefined],
    ["border-radius", radius("md")],
    ["border-radius-sm", radius("sm")],
    ["border-radius-lg", radius("lg")],
    ["border-radius-xl", radius("xl")],
    ["border-radius-xxl", radius("2xl")],
    ["box-shadow", tokens.effects.find((effect) => effect.name.startsWith("shadow-"))?.value],
  ];
  const lines = vars.flatMap(([name, value]) => (value === undefined ? [] : [`$${name}: ${value};`]));
  return `${header(tokens, (text) => `// ${text}`)}
// Bootstrap 5 variable overrides. Import this file before Bootstrap:
//   @import "bootstrap-variables";
//   @import "bootstrap/scss/bootstrap";
${lines.join("\n")}
`;
}

export const bootstrapFormat = defineFormat({
  id: "bootstrap",
  label: "Bootstrap",
  filename: "_bootstrap-variables.scss",
  language: "scss",
  generate: toBootstrapVariables,
});

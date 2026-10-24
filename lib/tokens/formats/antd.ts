import { toHex } from "@/lib/color/color";
import { fontStack } from "@/lib/typography/css";
import type { DesignTokens } from "@/types/tokens";
import type { Literal } from "@/lib/tokens/formats/shared";
import { header, tsLiteral } from "@/lib/tokens/formats/shared";
import { roleColor } from "@/lib/tokens/formats/shared-native";
import { defineFormat } from "@/lib/tokens/formats/define";

/** Stands in for `antdTheme.darkAlgorithm` inside the literal, which is an expression, not a value. */
const ANT_DARK_ALGORITHM = "__antd-dark-algorithm__";

/**
 * Ant Design 5 (antd-theme.ts): seed tokens only, so Ant Design keeps deriving the rest of its
 * token set (hover, active, the container backgrounds, the disabled states) exactly as it does for
 * a hand-written config. Exporting the derived values instead would pin the theme to one version's
 * derivation rules. Colors are always hex because Ant Design's color functions can't read oklch().
 * Pass either theme to `<ConfigProvider theme={...}>`.
 */
export function toAntTheme(tokens: DesignTokens): string {
  const t = tokens.typography;
  const radius = tokens.radius.find((step) => step.name === "md") ?? tokens.radius.find((step) => step.name === "lg");

  const seed = (dark: boolean): { [key: string]: Literal } => {
    const primary = roleColor(tokens, "primary", dark);
    const background = roleColor(tokens, "background", dark);
    const foreground = roleColor(tokens, "foreground", dark);
    return {
      ...(primary ? { colorPrimary: toHex(primary.value) } : {}),
      ...(background ? { colorBgBase: toHex(background.value) } : {}),
      ...(foreground ? { colorTextBase: toHex(foreground.value) } : {}),
      ...(radius ? { borderRadius: radius.px } : {}),
      ...(t ? { fontFamily: fontStack(t.body.family, t.body.category) } : {}),
    };
  };

  const config = (dark: boolean): string => {
    const body: { [key: string]: Literal } = {
      ...(dark ? { algorithm: ANT_DARK_ALGORITHM } : {}),
      token: seed(dark),
    };
    return tsLiteral(body).replace(`"${ANT_DARK_ALGORITHM}"`, "antdTheme.darkAlgorithm");
  };

  return `${header(tokens, (text) => `// ${text}`)}
import { theme as antdTheme, type ThemeConfig } from "antd";

export const lightTheme: ThemeConfig = ${config(false)};

export const darkTheme: ThemeConfig = ${config(true)};

export default lightTheme;
`;
}

export const antdFormat = defineFormat({
  id: "antd",
  label: "Ant Design",
  filename: "antd-theme.ts",
  language: "ts",
  generate: toAntTheme,
});

import type { TokenFormatDefinition } from "@/lib/tokens/formats/define";
import { androidFormat } from "@/lib/tokens/formats/android";
import { androidThemeFormat, androidThemeNightFormat } from "@/lib/tokens/formats/android-theme";
import { angularMaterialFormat } from "@/lib/tokens/formats/angular-material";
import { antdFormat } from "@/lib/tokens/formats/antd";
import { bootstrapFormat } from "@/lib/tokens/formats/bootstrap";
import { chakraFormat } from "@/lib/tokens/formats/chakra";
import { composeFormat } from "@/lib/tokens/formats/compose";
import { cssFormat } from "@/lib/tokens/formats/css";
import { cssLightDarkFormat } from "@/lib/tokens/formats/css-light-dark";
import { cssPropertiesFormat } from "@/lib/tokens/formats/css-properties";
import { figmaVariablesFormat } from "@/lib/tokens/formats/figma-variables";
import { flutterFormat } from "@/lib/tokens/formats/flutter";
import { godotFormat } from "@/lib/tokens/formats/godot";
import { gtkFormat } from "@/lib/tokens/formats/gtk";
import { jsFormat } from "@/lib/tokens/formats/js";
import { jsonFormat } from "@/lib/tokens/formats/json";
import { lessFormat } from "@/lib/tokens/formats/less";
import { mantineFormat } from "@/lib/tokens/formats/mantine";
import { mauiFormat } from "@/lib/tokens/formats/maui";
import { muiFormat } from "@/lib/tokens/formats/mui";
import { nuxtUiColorsFormat } from "@/lib/tokens/formats/nuxt-ui-colors";
import { nuxtUiFormat } from "@/lib/tokens/formats/nuxt-ui";
import { pandaFormat } from "@/lib/tokens/formats/panda";
import { qmlFormat } from "@/lib/tokens/formats/qml";
import { radixThemesFormat } from "@/lib/tokens/formats/radix-themes";
import { reactFormat } from "@/lib/tokens/formats/react";
import { reactNativeFormat } from "@/lib/tokens/formats/react-native";
import { sassMapFormat } from "@/lib/tokens/formats/sass-map";
import { scssFormat } from "@/lib/tokens/formats/scss";
import { shadcnFormat } from "@/lib/tokens/formats/shadcn";
import { styleDictionaryFormat, styleDictionaryConfigFormat } from "@/lib/tokens/formats/style-dictionary";
import { styledFormat } from "@/lib/tokens/formats/styled";
import { stylusFormat } from "@/lib/tokens/formats/stylus";
import { swiftuiFormat } from "@/lib/tokens/formats/swiftui";
import { tailwindConfigFormat } from "@/lib/tokens/formats/tailwind-config";
import { tailwindV4Format } from "@/lib/tokens/formats/tailwind-v4";
import { tamaguiFormat } from "@/lib/tokens/formats/tamagui";
import { tokensStudioFormat } from "@/lib/tokens/formats/tokens-studio";
import { unocssFormat } from "@/lib/tokens/formats/unocss";
import { ussFormat } from "@/lib/tokens/formats/uss";
import { vscodeFormat } from "@/lib/tokens/formats/vscode";
import { vueFormat } from "@/lib/tokens/formats/vue";
import { vuetifyFormat } from "@/lib/tokens/formats/vuetify";
import { windowsTerminalFormat } from "@/lib/tokens/formats/windows-terminal";
import { winuiFormat } from "@/lib/tokens/formats/winui";
import { yamlFormat } from "@/lib/tokens/formats/yaml";
import { toXcodeColorSets } from "@/lib/tokens/formats/xcode";
import { deprecationOf, tierOf } from "@/lib/tokens/tiers";
import type { ExportFormat } from "@/types/export";
import type { DesignTokens } from "@/types/tokens";

/**
 * The token formats, in the Export Engine's order. Each is one module under `lib/tokens/formats/`: a
 * generator and one `defineFormat` entry. A new format is a new module and one line here.
 */
export const tokenFormatDefinitions: TokenFormatDefinition[] = [
  angularMaterialFormat,
  nuxtUiFormat,
  nuxtUiColorsFormat,
  gtkFormat,
  tamaguiFormat,
  radixThemesFormat,
  cssFormat,
  cssPropertiesFormat,
  cssLightDarkFormat,
  scssFormat,
  sassMapFormat,
  lessFormat,
  stylusFormat,
  androidFormat,
  androidThemeFormat,
  androidThemeNightFormat,
  tailwindV4Format,
  tailwindConfigFormat,
  unocssFormat,
  pandaFormat,
  chakraFormat,
  mantineFormat,
  muiFormat,
  vuetifyFormat,
  antdFormat,
  bootstrapFormat,
  shadcnFormat,
  jsFormat,
  reactFormat,
  styledFormat,
  vueFormat,
  flutterFormat,
  reactNativeFormat,
  swiftuiFormat,
  composeFormat,
  mauiFormat,
  winuiFormat,
  qmlFormat,
  godotFormat,
  ussFormat,
  windowsTerminalFormat,
  vscodeFormat,
  jsonFormat,
  yamlFormat,
  tokensStudioFormat,
  styleDictionaryFormat,
  styleDictionaryConfigFormat,
  figmaVariablesFormat,
];

/** A token format as it is listed: everything about it except its code, which is written only when it is needed. */
export type TokenFormatInfo = Omit<ExportFormat, "code">;

const withTier = <T extends Omit<ExportFormat, "code">>(format: T): T & Pick<ExportFormat, "tier" | "deprecated"> => {
  const deprecated = deprecationOf(format.id);
  return { ...format, tier: tierOf(format.id), ...(deprecated ? { deprecated } : {}) };
};

/** The Xcode color sets, one per semantic role: small, and the only formats whose ids depend on the tokens. */
function xcodeFormats(tokens: DesignTokens): ExportFormat[] {
  return toXcodeColorSets(tokens).map((set) => ({
    id: `xcode-${set.role}`,
    label: `Xcode color set: ${set.name}`,
    filename: `${set.name}.colorset/Contents.json`,
    language: "json" as const,
    code: set.code,
  }));
}

/**
 * Every token format as a list, in the Export Engine's order, each with its tier and its deprecation note when
 * it has one, and no code. Nothing is generated except the few Xcode sets, so it is cheap to rebuild on every edit.
 */
export function tokenFormatList(tokens: DesignTokens): TokenFormatInfo[] {
  const info = ({ id, label, filename, language }: TokenFormatInfo): TokenFormatInfo => ({
    id,
    label,
    filename,
    language,
  });
  return [...tokenFormatDefinitions, ...xcodeFormats(tokens)].map(info).map(withTier);
}

/** One format with its code, written for these tokens. Only that format's generator runs. */
export function tokenFormat(tokens: DesignTokens, id: string): ExportFormat | undefined {
  const definition = tokenFormatDefinitions.find((item) => item.id === id);
  if (definition) {
    const { label, filename, language, generate } = definition;
    return withTier({ id, label, filename, language, code: generate(tokens) });
  }
  const xcode = xcodeFormats(tokens).find((format) => format.id === id);
  return xcode && withTier(xcode);
}

/** Every token format with its code, in the Export Engine's order. For the ZIP and the command line. */
export function tokenFormats(tokens: DesignTokens): ExportFormat[] {
  return [
    ...tokenFormatDefinitions.map(({ id, label, filename, language, generate }) => ({
      id,
      label,
      filename,
      language,
      code: generate(tokens),
    })),
    ...xcodeFormats(tokens),
  ].map(withTier);
}

export { flatten, variable } from "@/lib/tokens/formats/shared";
export type { FlatToken } from "@/lib/tokens/formats/shared";
export { toAndroidColors } from "@/lib/tokens/formats/android";
export { toAndroidTheme } from "@/lib/tokens/formats/android-theme";
export { toAntTheme } from "@/lib/tokens/formats/antd";
export { toBootstrapVariables } from "@/lib/tokens/formats/bootstrap";
export { toChakraTheme } from "@/lib/tokens/formats/chakra";
export { toCss } from "@/lib/tokens/formats/css";
export { toCssLightDark } from "@/lib/tokens/formats/css-light-dark";
export { toCssProperties } from "@/lib/tokens/formats/css-properties";
export { toFigmaVariables } from "@/lib/tokens/formats/figma-variables";
export type { FigmaVariablesRequest } from "@/lib/tokens/formats/figma-variables";
export { toGtkCss } from "@/lib/tokens/formats/gtk";
export { toJsModule } from "@/lib/tokens/formats/js";
export { toJsonTokens } from "@/lib/tokens/formats/json";
export { toMantineTheme } from "@/lib/tokens/formats/mantine";
export { toMaterialTheme } from "@/lib/tokens/formats/mui";
export { toNuxtUiColorsCss } from "@/lib/tokens/formats/nuxt-ui-colors";
export { toNuxtUiConfig } from "@/lib/tokens/formats/nuxt-ui";
export { toPandaPreset } from "@/lib/tokens/formats/panda";
export { toRadixThemeCss } from "@/lib/tokens/formats/radix-themes";
export { toSassMap } from "@/lib/tokens/formats/sass-map";
export { toScss } from "@/lib/tokens/formats/scss";
export { toShadcnTheme } from "@/lib/tokens/formats/shadcn";
export { toStyledTheme } from "@/lib/tokens/formats/styled";
export { toStylus } from "@/lib/tokens/formats/stylus";
export { toTamaguiConfig } from "@/lib/tokens/formats/tamagui";
export { toUnityUss } from "@/lib/tokens/formats/uss";
export { toUnoConfig } from "@/lib/tokens/formats/unocss";
export { toVuetifyTheme } from "@/lib/tokens/formats/vuetify";
export { toXcodeColorSets } from "@/lib/tokens/formats/xcode";
export { toYaml, yamlString } from "@/lib/tokens/formats/yaml";

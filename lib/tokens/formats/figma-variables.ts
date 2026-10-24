import { toRgb } from "@/lib/color/color";
import type { Oklch } from "@/types/color";
import type { DesignTokens } from "@/types/tokens";
import { variable } from "@/lib/tokens/formats/shared";
import type { RoleColor } from "@/lib/tokens/formats/shared-native";
import { roleColor } from "@/lib/tokens/formats/shared-native";
import { defineFormat } from "@/lib/tokens/formats/define";

type FigmaColor = { r: number; g: number; b: number; a: number };

type FigmaAlias = { type: "VARIABLE_ALIAS"; id: string };

export type FigmaVariablesRequest = {
  variableCollections: { action: "CREATE"; id: string; name: string; initialModeId: string }[];
  variableModes: { action: "CREATE" | "UPDATE"; id: string; name: string; variableCollectionId: string }[];
  variables: {
    action: "CREATE";
    id: string;
    name: string;
    variableCollectionId: string;
    resolvedType: "COLOR" | "FLOAT";
    scopes: string[];
    codeSyntax: { WEB: string };
  }[];
  variableModeValues: { variableId: string; modeId: string; value: FigmaColor | number | FigmaAlias }[];
};

/**
 * Figma Variables (figma-variables.json): the body of Figma's `POST /v1/files/:file_key/variables`
 * REST call. A "Primitives" collection holds the palette, shades, spacing and radius; a
 * "Semantic" collection has Light and Dark modes whose role colors are aliases to the
 * primitives (from `roleColor()`, so dark mode swaps and lifts like the other themed exports).
 * The ids are temporary ids that only link the objects within this one request.
 */
export function toFigmaVariables(tokens: DesignTokens): string {
  const request: FigmaVariablesRequest = {
    variableCollections: [],
    variableModes: [],
    variables: [],
    variableModeValues: [],
  };
  const unit = (value: number) => Math.round(value * 10000) / 10000;
  const rgba = (value: Oklch): FigmaColor => {
    const { r, g, b, alpha } = toRgb(value);
    return { r: unit(r / 255), g: unit(g / 255), b: unit(b / 255), a: unit(alpha) };
  };
  // Figma variable names can't contain ".", "{" or "}"; "/" nests them in groups.
  const figmaName = (name: string) => name.replace(/[.{}]/g, "_");
  const collection = (id: string, name: string, modes: string[]) => {
    const [initial, ...rest] = modes.map((mode) => ({ id: `${id}:${mode.toLowerCase()}`, name: mode }));
    request.variableCollections.push({ action: "CREATE", id, name, initialModeId: initial!.id });
    // The initial mode is created with the collection, so it is renamed rather than created.
    request.variableModes.push({ action: "UPDATE", ...initial!, variableCollectionId: id });
    rest.forEach((mode) => request.variableModes.push({ action: "CREATE", ...mode, variableCollectionId: id }));
    return [initial!, ...rest].map((mode) => mode.id);
  };
  const add = (
    collectionId: string,
    name: string,
    resolvedType: "COLOR" | "FLOAT",
    scopes: string[],
    css: string,
    values: [modeId: string, value: FigmaColor | number | FigmaAlias][],
  ) => {
    const id = `${collectionId}/${name}`;
    if (request.variables.some((item) => item.id === id)) return undefined;
    request.variables.push({
      action: "CREATE",
      id,
      name,
      variableCollectionId: collectionId,
      resolvedType,
      scopes,
      codeSyntax: { WEB: `var(${variable(tokens, css)})` },
    });
    values.forEach(([modeId, value]) => request.variableModeValues.push({ variableId: id, modeId, value }));
    return id;
  };

  const primitives = "primitives";
  const [valueMode] = collection(primitives, "Primitives", ["Value"]);
  const primitiveIds = new Map<string, string>();
  tokens.colors.forEach((color) => {
    const base = figmaName(`color/${color.name}${color.shades.length ? "/base" : ""}`);
    const id = add(primitives, base, "COLOR", ["ALL_SCOPES"], `color-${color.name}`, [[valueMode!, rgba(color.value)]]);
    if (id) primitiveIds.set(color.name, id);
    color.shades.forEach((shade) => {
      const shadeId = add(
        primitives,
        figmaName(`color/${color.name}/${shade.step}`),
        "COLOR",
        ["ALL_SCOPES"],
        `color-${color.name}-${shade.step}`,
        [[valueMode!, rgba(shade.value)]],
      );
      if (shadeId) primitiveIds.set(`${color.name}/${shade.step}`, shadeId);
    });
  });
  const pixels = (value: number) => (value >= 9999 ? 9999 : value);
  tokens.spacing.forEach((step) =>
    add(primitives, figmaName(`spacing/${step.name}`), "FLOAT", ["GAP", "WIDTH_HEIGHT"], `spacing-${step.name}`, [
      [valueMode!, pixels(step.px)],
    ]),
  );
  tokens.radius.forEach((step) =>
    add(primitives, figmaName(`radius/${step.name}`), "FLOAT", ["CORNER_RADIUS"], `radius-${step.name}`, [
      [valueMode!, pixels(step.px)],
    ]),
  );

  if (tokens.semantic.length) {
    const semantic = "semantic";
    const [light, dark] = collection(semantic, "Semantic", ["Light", "Dark"]);
    // A role points at its primitive; the synthesized white or black has none, so it keeps its value.
    const value = (entry: RoleColor): FigmaColor | FigmaAlias => {
      const target = entry.color
        ? primitiveIds.get(entry.step !== undefined ? `${entry.color}/${entry.step}` : entry.color)
        : undefined;
      return target ? { type: "VARIABLE_ALIAS", id: target } : rgba(entry.value);
    };
    tokens.semantic.forEach((role) => {
      const lightColor = roleColor(tokens, role.name);
      const darkColor = roleColor(tokens, role.name, true);
      if (!lightColor || !darkColor) return;
      add(semantic, figmaName(`color/${role.name}`), "COLOR", ["ALL_SCOPES"], `color-${role.name}`, [
        [light!, value(lightColor)],
        [dark!, value(darkColor)],
      ]);
    });
  }
  return `${JSON.stringify(request, null, 2)}\n`;
}

export const figmaVariablesFormat = defineFormat({
  id: "figma-variables",
  label: "Figma Variables",
  filename: "figma-variables.json",
  language: "json",
  generate: toFigmaVariables,
});

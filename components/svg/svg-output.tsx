"use client";

import { useMemo } from "react";

import { SwitchField } from "@/components/effects/fields";
import { ExportPanel } from "@/components/export/export-panel";
import { useOptimizedTree } from "@/hooks/use-optimized-tree";
import { withCurrentColor } from "@/lib/svg/jsx";
import type { OptimizeResult } from "@/lib/svg/optimize";
import { reactNativeComponent } from "@/lib/svg/react-native";
import { svgFormats } from "@/lib/svg/formats";
import { useSvgStore } from "@/store/svg-store";
import type { ExportFormat } from "@/types/export";
import type { SvgNode } from "@/types/svg";

export function SvgOutput({ root, optimized }: { root: SvgNode | null; optimized: OptimizeResult | null }) {
  const name = useSvgStore((state) => state.name);
  const currentColor = useSvgStore((state) => state.currentColor);
  const sprite = useSvgStore((state) => state.sprite);
  const setCurrentColor = useSvgStore((state) => state.setCurrentColor);
  const tree = useOptimizedTree();

  const native = useMemo(() => {
    if (!tree) return null;
    return reactNativeComponent(currentColor ? withCurrentColor(tree) : tree, name);
  }, [tree, currentColor, name]);

  const formats = useMemo<ExportFormat[]>(
    () => svgFormats({ root, optimized, tree, native, currentColor, name, sprite }),
    [root, optimized, tree, native, currentColor, name, sprite],
  );

  if (!root) return <p className="text-sm text-muted-foreground">Fix the SVG to see the generated code.</p>;
  return (
    <>
      <SwitchField label="Use currentColor in components" checked={currentColor} onChange={setCurrentColor} />
      <ExportPanel formats={formats} label="SVG output format" />
      {native?.warnings.length ? (
        <div role="note" className="rounded-md border border-warning/40 bg-warning/5 p-3 text-xs text-muted-foreground">
          <p className="mb-1 font-medium text-foreground">React Native notes</p>
          <ul className="list-disc pl-4">
            {native.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </>
  );
}

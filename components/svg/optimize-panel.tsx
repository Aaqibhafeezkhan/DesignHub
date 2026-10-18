"use client";

import { Download } from "lucide-react";

import { SwitchField } from "@/components/effects/fields";
import { Button } from "@/components/ui/button";
import { SliderField } from "@/components/ui/field";
import { Panel } from "@/components/ui/panel";
import { downloadText } from "@/lib/download";
import type { OptimizeResult, SvgOptimizeOptions } from "@/lib/svg/optimize";
import { formatBytes } from "@/lib/svg-size";
import { useSvgStore } from "@/store/svg-store";

type BooleanOption = {
  [K in keyof SvgOptimizeOptions]: SvgOptimizeOptions[K] extends boolean ? K : never;
}[keyof SvgOptimizeOptions];

const toggles: { key: BooleanOption; label: string }[] = [
  { key: "removeMetadata", label: "Remove metadata & <desc>" },
  { key: "removeEditorData", label: "Remove editor data (Inkscape, Figma…)" },
  { key: "removeUnusedIds", label: "Remove unused ids" },
  { key: "collapseGroups", label: "Collapse empty groups" },
  { key: "optimizePaths", label: "Optimize path data" },
  { key: "cleanupNumbers", label: "Round numbers" },
  { key: "shortenColors", label: "Shorten colors" },
  { key: "styleToAttributes", label: "Style → attributes" },
  { key: "removeDimensions", label: "Remove width/height" },
  { key: "pretty", label: "Pretty print output" },
];

export function OptimizePanel({ result }: { result: OptimizeResult | null }) {
  const options = useSvgStore((state) => state.options);
  const setOptions = useSvgStore((state) => state.setOptions);
  const name = useSvgStore((state) => state.name);

  return (
    <Panel title="Optimize" description="Scripts and event handlers are always removed.">
      {result ? (
        <div
          className="flex items-center justify-between rounded-md border bg-surface px-3 py-2 font-mono text-xs"
          aria-live="polite"
        >
          <span className="text-muted-foreground">
            {formatBytes(result.before)} → <span className="text-foreground">{formatBytes(result.after)}</span>
          </span>
          <span className="font-semibold text-success">−{Math.round(result.saved * 100)}%</span>
        </div>
      ) : null}
      <SliderField
        label="Precision"
        value={options.precision}
        min={0}
        max={5}
        onChange={(precision) => setOptions({ precision })}
        format={(value) => `${value} decimal${value === 1 ? "" : "s"}`}
      />
      <div className="flex flex-col gap-2.5">
        {toggles.map((toggle) => (
          <SwitchField
            key={toggle.key}
            label={toggle.label}
            checked={options[toggle.key]}
            onChange={(value) => setOptions({ [toggle.key]: value })}
          />
        ))}
      </div>
      <Button
        disabled={!result}
        onClick={() => result && downloadText(result.svg, name.replace(/\.svg$/i, ".min.svg"))}
      >
        <Download /> Download optimized SVG
      </Button>
    </Panel>
  );
}

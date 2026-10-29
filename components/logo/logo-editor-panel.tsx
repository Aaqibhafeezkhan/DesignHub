"use client";

import { Paintbrush } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Panel } from "@/components/ui/panel";
import { Textarea } from "@/components/ui/textarea";
import { useBrandTokens } from "@/hooks/use-brand";
import { extractColors, recolorSvg } from "@/lib/logo/recolor";
import { sanitizeSvg } from "@/lib/svg/sanitize";
import { useBrandStore } from "@/store/brand-store";

/** Recolor and hand-edit the logo. Changes are written to the brand profile. */
export function LogoEditorPanel() {
  const brand = useBrandTokens();
  const updateProfile = useBrandStore((state) => state.updateProfile);
  const colors = useMemo(() => extractColors(brand.logo.svg), [brand.logo.svg]);
  const [draft, setDraft] = useState(brand.logo.svg);
  const [invalid, setInvalid] = useState(false);
  const palette = [...brand.colors.primary, ...brand.colors.secondary, ...brand.colors.neutrals, "#ffffff", "#000000"];

  useEffect(() => {
    setDraft(brand.logo.svg);
    setInvalid(false);
  }, [brand.logo.svg]);

  // Editing a generated mark "detaches" it into a real SVG owned by the brand.
  const save = (svg: string) => updateProfile({ logoSvg: svg });
  const swap = (from: string, to: string) => save(recolorSvg(brand.logo.svg, { [from]: to }));

  function applyBrandColors() {
    const targets = [...brand.colors.primary, ...brand.colors.secondary];
    const map = Object.fromEntries(
      colors.map((color, index) => [color, targets[index % Math.max(targets.length, 1)] ?? color]),
    );
    save(recolorSvg(brand.logo.svg, map));
  }

  function commitSource() {
    const clean = sanitizeSvg(draft);
    if (clean) save(clean);
    else setInvalid(true);
  }

  return (
    <Panel advanced title="Edit" description="Recolor or edit the markup. Scripts are always stripped.">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label>Colors in this logo</Label>
          <Button variant="ghost" size="sm" className="h-7" onClick={applyBrandColors} disabled={colors.length === 0}>
            <Paintbrush /> Use brand colors
          </Button>
        </div>
        {colors.length === 0 ? (
          <p className="text-xs text-muted-foreground">No solid colors found (the logo may use currentColor).</p>
        ) : null}
        <ul className="flex flex-col gap-2" aria-label="Logo colors">
          {colors.map((color) => (
            <li key={color} className="flex flex-wrap items-center gap-1.5">
              <label className="relative size-8 cursor-pointer overflow-hidden rounded-md border">
                <span className="absolute inset-0" style={{ background: color }} />
                <input
                  type="color"
                  aria-label={`Replace ${color}`}
                  value={color}
                  onChange={(event) => swap(color, event.target.value)}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
              </label>
              <span className="w-16 font-mono text-[11px] uppercase">{color}</span>
              {palette.map((target) => (
                <button
                  key={target}
                  type="button"
                  onClick={() => swap(color, target)}
                  aria-label={`Replace ${color} with ${target}`}
                  className="size-5 rounded-sm border"
                  style={{ background: target }}
                />
              ))}
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="logo-source">SVG source</Label>
        <Textarea
          id="logo-source"
          value={draft}
          spellCheck={false}
          aria-invalid={invalid}
          onChange={(event) => {
            setDraft(event.target.value);
            setInvalid(false);
          }}
          onBlur={commitSource}
          className="min-h-36 font-mono text-[11px] scrollbar-thin"
        />
        <p className="text-[11px] text-subtle-foreground">
          {invalid ? "That isn't valid SVG; nothing was changed." : "Changes apply when the field loses focus."}
        </p>
      </div>
    </Panel>
  );
}

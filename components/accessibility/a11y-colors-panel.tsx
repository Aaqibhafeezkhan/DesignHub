"use client";

import { ArrowUpDown } from "lucide-react";

import { ColorField } from "@/components/effects/fields";
import { useI18n } from "@/components/layout/locale-provider";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { useA11yStore } from "@/store/a11y-store";
import type { A11yColors } from "@/types/a11y";

const fields = ["text", "background", "accent", "onAccent"] as const satisfies readonly (keyof A11yColors)[];

export function A11yColorsPanel() {
  const { t } = useI18n();
  const colors = useA11yStore((state) => state.colors);
  const setColors = useA11yStore((state) => state.setColors);

  return (
    <Panel title={t("a11y.colors.title")}>
      {fields.map((field) => (
        <ColorField
          key={field}
          label={t(`a11y.colors.${field}`)}
          value={colors[field]}
          onChange={(value) => setColors({ [field]: value })}
        />
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setColors({ text: colors.background, background: colors.text })}
      >
        <ArrowUpDown /> {t("a11y.colors.swap")}
      </Button>
    </Panel>
  );
}

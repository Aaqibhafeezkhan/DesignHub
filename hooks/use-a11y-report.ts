"use client";

import { useDeferredValue, useMemo } from "react";

import { useBrandTokens } from "@/hooks/use-brand";
import { useFocusRing } from "@/hooks/use-focus-ring";
import { useEffectContext } from "@/hooks/use-effect-context";
import { useGradientContrast } from "@/hooks/use-gradient-contrast";
import { useGuidelineContext } from "@/hooks/use-guideline-context";
import { useReadability } from "@/hooks/use-readability";
import { contrastSection, focusIndicatorCheck, focusSection } from "@/lib/a11y/contrast";
import { gradientSection } from "@/lib/a11y/gradient-contrast";
import { headingSection } from "@/lib/a11y/headings";
import { motionSection } from "@/lib/a11y/motion";
import { buildReport, type A11yReport } from "@/lib/a11y/report";
import { textSpacingSection } from "@/lib/a11y/text-spacing";
import { targetsSection } from "@/lib/a11y/targets";
import { paletteVisionSection, visionSection } from "@/lib/a11y/vision";
import { brandSiteFiles } from "@/lib/guidelines/site";
import { useA11yStore } from "@/store/a11y-store";
import { useEffectsStore } from "@/store/effects-store";

/**
 * The full accessibility audit for the current Accessibility Lab settings. The audit, the brand book pages it
 * reads headings from and the vision simulations are heavy, so they follow a deferred copy of the settings:
 * the fields answer at once and the report catches up a frame behind, skipping the keystrokes in between.
 */
export function useA11yReport(): A11yReport {
  const colors = useDeferredValue(useA11yStore((state) => state.colors));
  const typography = useDeferredValue(useA11yStore((state) => state.typography));
  const targets = useDeferredValue(useA11yStore((state) => state.targets));
  const targetGap = useDeferredValue(useA11yStore((state) => state.targetGap));
  const readability = useReadability();
  const { ring } = useFocusRing();
  const gradientText = useGradientContrast();
  const brandColors = useBrandTokens().colors.all;
  const palette = useMemo(() => brandColors.map(({ name, hex }) => ({ name, hex })), [brandColors]);
  const effectSettings = useDeferredValue(useEffectsStore((state) => state.settings));
  const effectContext = useEffectContext();
  const guideline = useGuidelineContext();
  const guidelineCtx = useDeferredValue(guideline.ctx);
  const guidelinePages = useDeferredValue(guideline.pages);
  const headings = useMemo(
    () =>
      headingSection(
        brandSiteFiles(guidelineCtx, guidelinePages)
          .filter((entry) => entry.name.endsWith(".html"))
          .map((entry) => {
            const id = entry.name === "index.html" ? guidelinePages[0]?.id : entry.name.split("/")[0];
            const title = guidelinePages.find((page) => page.id === id)?.title ?? "Downloads";
            return { title, html: String(entry.data) };
          }),
      ),
    [guidelineCtx, guidelinePages],
  );

  return useMemo(
    () =>
      buildReport(
        { colors, focusRing: ring, typography, targets, targetGap, palette },
        {
          contrast: contrastSection(colors),
          focusIndicator: focusSection(focusIndicatorCheck(ring, colors.background, colors.accent)),
          gradientText: gradientSection(gradientText.gradient, gradientText.results),
          vision: visionSection(colors),
          paletteVision: paletteVisionSection(palette),
          readability: {
            charactersPerLine: Math.round(readability.charsPerLine),
            readingEase: readability.score.ease,
            gradeLevel: readability.score.grade,
            checks: readability.checks.map(({ label, value, verdict }) => ({ check: label, value, verdict })),
          },
          textSpacing: textSpacingSection(typography),
          motion: motionSection(effectSettings, effectContext),
          touchTargets: targetsSection(targets, targetGap),
          headings,
        },
      ),
    [
      colors,
      ring,
      gradientText,
      typography,
      targets,
      targetGap,
      readability,
      palette,
      effectSettings,
      effectContext,
      headings,
    ],
  );
}

"use client";

import { useCallback, useState } from "react";

import { useI18n } from "@/components/layout/locale-provider";
import { paletteNames } from "@/lib/color/names";
import type { Swatch } from "@/types/color";

export type PaletteAnnouncementKind = "generated" | "loaded";
export type PaletteAnnouncer = (kind: PaletteAnnouncementKind, swatches: Swatch[]) => void;

export function usePaletteAnnouncement() {
  const { t, plural } = useI18n();
  const [message, setMessage] = useState("");

  const announce = useCallback<PaletteAnnouncer>(
    (kind, swatches) => {
      const names = paletteNames(swatches.map((swatch) => swatch.color)).join(", ");
      const announcement =
        kind === "generated"
          ? t("colors.announcement.generated", { names })
          : t("colors.announcement.loaded", { names });
      const lockedCount = kind === "generated" ? swatches.filter((swatch) => swatch.locked).length : 0;
      const completeMessage =
        lockedCount > 0 ? `${announcement} ${plural("colors.announcement.locked", lockedCount)}` : announcement;

      // Clear first so repeating the same palette is still a live-region change.
      setMessage("");
      window.setTimeout(() => setMessage(completeMessage), 0);
    },
    [plural, t],
  );

  return { announce, message };
}

import { billboard } from "@/lib/mockups/templates/billboard";
import { browserTab } from "@/lib/mockups/templates/browser-tab";
import { businessCard } from "@/lib/mockups/templates/business-card";
import { coffeeCup } from "@/lib/mockups/templates/coffee-cup";
import { desktopDashboard } from "@/lib/mockups/templates/desktop-dashboard";
import { emailSignature } from "@/lib/mockups/templates/email-signature";
import { envelope } from "@/lib/mockups/templates/envelope";
import { idBadge } from "@/lib/mockups/templates/id-badge";
import { letterhead } from "@/lib/mockups/templates/letterhead";
import { laptopLanding } from "@/lib/mockups/templates/laptop-landing";
import { lockScreenMockup } from "@/lib/mockups/templates/lock-screen";
import { merch } from "@/lib/mockups/templates/merch";
import { mobileApp } from "@/lib/mockups/templates/mobile-app";
import { appStoreScreenshots } from "@/lib/mockups/templates/app-store";
import { poster } from "@/lib/mockups/templates/poster";
import { shoppingBag } from "@/lib/mockups/templates/shopping-bag";
import { smartwatch } from "@/lib/mockups/templates/smartwatch";
import { sticker } from "@/lib/mockups/templates/sticker";
import { tabletScreens } from "@/lib/mockups/templates/tablet";
import type { MockupTemplate } from "@/lib/mockups/types";

/** Templates register here as they are implemented. */
export const mockupTemplates: MockupTemplate[] = [
  businessCard,
  letterhead,
  envelope,
  sticker,
  poster,
  billboard,
  merch,
  coffeeCup,
  shoppingBag,
  idBadge,
  laptopLanding,
  desktopDashboard,
  mobileApp,
  appStoreScreenshots,
  smartwatch,
  lockScreenMockup,
  tabletScreens,
  browserTab,
  emailSignature,
];

export function getTemplate(id: string): MockupTemplate | undefined {
  return mockupTemplates.find((template) => template.id === id);
}

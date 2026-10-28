import type { MockupTemplate } from "@/lib/mockups/types";

const from =
  <M>(load: () => Promise<M>, choose: (module: M) => MockupTemplate) =>
  () =>
    load().then(choose);

/** One loader per template, so a template's drawing code is fetched when it is chosen. A test keeps this in step with the list. */
export const mockupLoaders: Record<string, () => Promise<MockupTemplate>> = {
  "app-store": from(
    () => import("@/lib/mockups/templates/app-store"),
    (module) => module.appStoreScreenshots,
  ),
  billboard: from(
    () => import("@/lib/mockups/templates/billboard"),
    (module) => module.billboard,
  ),
  "browser-tab": from(
    () => import("@/lib/mockups/templates/browser-tab"),
    (module) => module.browserTab,
  ),
  "business-card": from(
    () => import("@/lib/mockups/templates/business-card"),
    (module) => module.businessCard,
  ),
  "coffee-cup": from(
    () => import("@/lib/mockups/templates/coffee-cup"),
    (module) => module.coffeeCup,
  ),
  "delivery-van": from(
    () => import("@/lib/mockups/templates/delivery-van"),
    (module) => module.deliveryVan,
  ),
  "desktop-dashboard": from(
    () => import("@/lib/mockups/templates/desktop-dashboard"),
    (module) => module.desktopDashboard,
  ),
  "email-signature": from(
    () => import("@/lib/mockups/templates/email-signature"),
    (module) => module.emailSignature,
  ),
  envelope: from(
    () => import("@/lib/mockups/templates/envelope"),
    (module) => module.envelope,
  ),
  "id-badge": from(
    () => import("@/lib/mockups/templates/id-badge"),
    (module) => module.idBadge,
  ),
  "laptop-landing": from(
    () => import("@/lib/mockups/templates/laptop-landing"),
    (module) => module.laptopLanding,
  ),
  letterhead: from(
    () => import("@/lib/mockups/templates/letterhead"),
    (module) => module.letterhead,
  ),
  "lock-screen": from(
    () => import("@/lib/mockups/templates/lock-screen"),
    (module) => module.lockScreenMockup,
  ),
  merch: from(
    () => import("@/lib/mockups/templates/merch"),
    (module) => module.merch,
  ),
  "mobile-app": from(
    () => import("@/lib/mockups/templates/mobile-app"),
    (module) => module.mobileApp,
  ),
  notebook: from(
    () => import("@/lib/mockups/templates/notebook"),
    (module) => module.notebook,
  ),
  poster: from(
    () => import("@/lib/mockups/templates/poster"),
    (module) => module.poster,
  ),
  presentation: from(
    () => import("@/lib/mockups/templates/presentation"),
    (module) => module.presentation,
  ),
  "shopping-bag": from(
    () => import("@/lib/mockups/templates/shopping-bag"),
    (module) => module.shoppingBag,
  ),
  smartwatch: from(
    () => import("@/lib/mockups/templates/smartwatch"),
    (module) => module.smartwatch,
  ),
  sticker: from(
    () => import("@/lib/mockups/templates/sticker"),
    (module) => module.sticker,
  ),
  tablet: from(
    () => import("@/lib/mockups/templates/tablet"),
    (module) => module.tabletScreens,
  ),
  "trade-show-booth": from(
    () => import("@/lib/mockups/templates/trade-show-booth"),
    (module) => module.tradeShowBooth,
  ),
};

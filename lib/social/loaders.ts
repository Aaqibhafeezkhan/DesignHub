import type { SocialTemplate } from "@/lib/social/types";

/** Finds one template in a module that exports several. */
const pick = (templates: SocialTemplate[], id: string): SocialTemplate => {
  const found = templates.find((template) => template.id === id);
  if (!found) throw new Error(`Social template ${id} is missing from its module`);
  return found;
};

const from =
  <M>(load: () => Promise<M>, choose: (module: M) => SocialTemplate) =>
  () =>
    load().then(choose);

/** One loader per template, so a template's drawing code is fetched when it is chosen. A test keeps this in step with the list. */
export const socialLoaders: Record<string, () => Promise<SocialTemplate>> = {
  "bandcamp-header": from(
    () => import("@/lib/social/templates/bandcamp"),
    (module) => module.bandcampHeader,
  ),
  "behance-cover": from(
    () => import("@/lib/social/templates/behance"),
    (module) => module.behanceCover,
  ),
  "bluesky-banner": from(
    () => import("@/lib/social/templates/bluesky"),
    (module) => module.blueskyBanner,
  ),
  "buy-me-a-coffee-cover": from(
    () => import("@/lib/social/templates/buy-me-a-coffee"),
    (module) => module.buyMeACoffeeCover,
  ),
  "devto-cover": from(
    () => import("@/lib/social/templates/devto"),
    (module) => module.devtoCover,
  ),
  "discord-banner": from(
    () => import("@/lib/social/templates/discord"),
    (module) => module.discordBanner,
  ),
  "dribbble-shot": from(
    () => import("@/lib/social/templates/dribbble"),
    (module) => module.dribbbleShot,
  ),
  "etsy-shop-banner": from(
    () => import("@/lib/social/templates/etsy"),
    (module) => module.etsyShopBanner,
  ),
  "facebook-cover": from(
    () => import("@/lib/social/templates/facebook"),
    (module) => module.facebookCover,
  ),
  "ghost-cover": from(
    () => import("@/lib/social/templates/ghost"),
    (module) => module.ghostCover,
  ),
  "github-aurora": from(
    () => import("@/lib/social/templates/github"),
    (module) => pick(module.githubBannerStyles, "github-aurora"),
  ),
  "github-badges": from(
    () => import("@/lib/social/templates/github"),
    (module) => pick(module.githubBannerStyles, "github-badges"),
  ),
  "github-bento": from(
    () => import("@/lib/social/templates/github"),
    (module) => pick(module.githubBannerStyles, "github-bento"),
  ),
  "github-classic": from(
    () => import("@/lib/social/templates/github"),
    (module) => pick(module.githubBannerStyles, "github-classic"),
  ),
  "github-editorial": from(
    () => import("@/lib/social/templates/github"),
    (module) => pick(module.githubBannerStyles, "github-editorial"),
  ),
  "github-features": from(
    () => import("@/lib/social/templates/github"),
    (module) => pick(module.githubBannerStyles, "github-features"),
  ),
  "github-glass": from(
    () => import("@/lib/social/templates/github"),
    (module) => pick(module.githubBannerStyles, "github-glass"),
  ),
  "github-gradient": from(
    () => import("@/lib/social/templates/github"),
    (module) => pick(module.githubBannerStyles, "github-gradient"),
  ),
  "github-grid": from(
    () => import("@/lib/social/templates/github"),
    (module) => pick(module.githubBannerStyles, "github-grid"),
  ),
  "github-launch": from(
    () => import("@/lib/social/templates/github"),
    (module) => pick(module.githubBannerStyles, "github-launch"),
  ),
  "github-minimal": from(
    () => import("@/lib/social/templates/github"),
    (module) => pick(module.githubBannerStyles, "github-minimal"),
  ),
  "github-showcase": from(
    () => import("@/lib/social/templates/github"),
    (module) => pick(module.githubBannerStyles, "github-showcase"),
  ),
  "github-split": from(
    () => import("@/lib/social/templates/github"),
    (module) => pick(module.githubBannerStyles, "github-split"),
  ),
  "github-spotlight": from(
    () => import("@/lib/social/templates/github"),
    (module) => pick(module.githubBannerStyles, "github-spotlight"),
  ),
  "github-terminal": from(
    () => import("@/lib/social/templates/github"),
    (module) => pick(module.githubBannerStyles, "github-terminal"),
  ),
  "gumroad-cover": from(
    () => import("@/lib/social/templates/gumroad"),
    (module) => module.gumroadCover,
  ),
  "hashnode-cover": from(
    () => import("@/lib/social/templates/hashnode"),
    (module) => module.hashnodeCover,
  ),
  "instagram-highlight": from(
    () => import("@/lib/social/templates/instagram-highlight"),
    (module) => module.instagramHighlight,
  ),
  "instagram-portrait": from(
    () => import("@/lib/social/templates/instagram"),
    (module) => module.instagramPortrait,
  ),
  "instagram-square": from(
    () => import("@/lib/social/templates/instagram"),
    (module) => module.instagramSquare,
  ),
  "instagram-story": from(
    () => import("@/lib/social/templates/instagram"),
    (module) => module.instagramStory,
  ),
  "kick-banner": from(
    () => import("@/lib/social/templates/kick"),
    (module) => module.kickBanner,
  ),
  "kofi-banner": from(
    () => import("@/lib/social/templates/kofi"),
    (module) => module.kofiBanner,
  ),
  "linkedin-company": from(
    () => import("@/lib/social/templates/linkedin-company"),
    (module) => module.linkedinCompanyCover,
  ),
  "linkedin-cover": from(
    () => import("@/lib/social/templates/linkedin-cover"),
    (module) => module.linkedinCover,
  ),
  "linkedin-event": from(
    () => import("@/lib/social/templates/linkedin-event"),
    (module) => module.linkedinEvent,
  ),
  "mastodon-header": from(
    () => import("@/lib/social/templates/mastodon"),
    (module) => module.mastodonHeader,
  ),
  "medium-banner": from(
    () => import("@/lib/social/templates/medium"),
    (module) => module.mediumBanner,
  ),
  "notion-cover": from(
    () => import("@/lib/social/templates/notion"),
    (module) => module.notionCover,
  ),
  "og-article": from(
    () => import("@/lib/social/templates/open-graph"),
    (module) => pick(module.ogTemplates, "og-article"),
  ),
  "og-minimal": from(
    () => import("@/lib/social/templates/open-graph"),
    (module) => pick(module.ogTemplates, "og-minimal"),
  ),
  "og-product": from(
    () => import("@/lib/social/templates/open-graph"),
    (module) => pick(module.ogTemplates, "og-product"),
  ),
  "patreon-cover": from(
    () => import("@/lib/social/templates/patreon"),
    (module) => module.patreonCover,
  ),
  "pinterest-board-cover": from(
    () => import("@/lib/social/templates/pinterest"),
    (module) => module.pinterestBoardCover,
  ),
  "pinterest-pin": from(
    () => import("@/lib/social/templates/pinterest"),
    (module) => module.pinterestPin,
  ),
  "product-hunt-gallery": from(
    () => import("@/lib/social/templates/product-hunt"),
    (module) => module.productHuntGallery,
  ),
  "product-hunt-thumbnail": from(
    () => import("@/lib/social/templates/product-hunt-thumbnail"),
    (module) => module.productHuntThumbnail,
  ),
  "reddit-banner": from(
    () => import("@/lib/social/templates/reddit"),
    (module) => module.redditBanner,
  ),
  "spotify-playlist-cover": from(
    () => import("@/lib/social/templates/spotify"),
    (module) => module.spotifyPlaylistCover,
  ),
  "substack-banner": from(
    () => import("@/lib/social/templates/substack"),
    (module) => module.substackBanner,
  ),
  "telegram-cover": from(
    () => import("@/lib/social/templates/telegram"),
    (module) => module.telegramCover,
  ),
  "tumblr-header": from(
    () => import("@/lib/social/templates/tumblr"),
    (module) => module.tumblrHeader,
  ),
  "twitch-banner": from(
    () => import("@/lib/social/templates/twitch"),
    (module) => module.twitchBanner,
  ),
  "twitch-offline": from(
    () => import("@/lib/social/templates/twitch-offline"),
    (module) => module.twitchOffline,
  ),
  "x-banner": from(
    () => import("@/lib/social/templates/x-banner"),
    (module) => module.xBanner,
  ),
  "x-post-image": from(
    () => import("@/lib/social/templates/x-post"),
    (module) => module.xPostImage,
  ),
  "youtube-banner": from(
    () => import("@/lib/social/templates/youtube-banner"),
    (module) => module.youtubeBanner,
  ),
  "youtube-thumbnail": from(
    () => import("@/lib/social/templates/product-hunt"),
    (module) => module.youtubeThumbnail,
  ),
};

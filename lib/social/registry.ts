import { githubBannerStyles } from "@/lib/social/templates/github";
import { instagramHighlight } from "@/lib/social/templates/instagram-highlight";
import { instagramPortrait, instagramSquare, instagramStory } from "@/lib/social/templates/instagram";
import { linkedinCover } from "@/lib/social/templates/linkedin-cover";
import { ogTemplates } from "@/lib/social/templates/open-graph";
import { pinterestBoardCover, pinterestPin } from "@/lib/social/templates/pinterest";
import { productHuntGallery, youtubeThumbnail } from "@/lib/social/templates/product-hunt";
import { xBanner } from "@/lib/social/templates/x-banner";
import { xPostImage } from "@/lib/social/templates/x-post";
import { blueskyBanner } from "@/lib/social/templates/bluesky";
import { facebookCover } from "@/lib/social/templates/facebook";
import { linkedinCompanyCover } from "@/lib/social/templates/linkedin-company";
import { discordBanner } from "@/lib/social/templates/discord";
import { mastodonHeader } from "@/lib/social/templates/mastodon";
import { twitchBanner } from "@/lib/social/templates/twitch";
import { twitchOffline } from "@/lib/social/templates/twitch-offline";
import { linkedinEvent } from "@/lib/social/templates/linkedin-event";
import { youtubeBanner } from "@/lib/social/templates/youtube-banner";
import { redditBanner } from "@/lib/social/templates/reddit";
import { tumblrHeader } from "@/lib/social/templates/tumblr";
import { dribbbleShot } from "@/lib/social/templates/dribbble";
import { behanceCover } from "@/lib/social/templates/behance";
import { gumroadCover } from "@/lib/social/templates/gumroad";
import { kofiBanner } from "@/lib/social/templates/kofi";
import { buyMeACoffeeCover } from "@/lib/social/templates/buy-me-a-coffee";
import { patreonCover } from "@/lib/social/templates/patreon";
import { kickBanner } from "@/lib/social/templates/kick";
import { bandcampHeader } from "@/lib/social/templates/bandcamp";
import { productHuntThumbnail } from "@/lib/social/templates/product-hunt-thumbnail";
import { telegramCover } from "@/lib/social/templates/telegram";
import { substackBanner } from "@/lib/social/templates/substack";
import { ghostCover } from "@/lib/social/templates/ghost";
import { spotifyPlaylistCover } from "@/lib/social/templates/spotify";
import { devtoCover } from "@/lib/social/templates/devto";
import { hashnodeCover } from "@/lib/social/templates/hashnode";
import { etsyShopBanner } from "@/lib/social/templates/etsy";
import { notionCover } from "@/lib/social/templates/notion";
import { mediumBanner } from "@/lib/social/templates/medium";
import type { SocialPlatform, SocialTemplate } from "@/lib/social/types";

/** Templates register here as they are implemented. */
export const socialTemplates: SocialTemplate[] = [
  ...githubBannerStyles,
  linkedinCover,
  xBanner,
  xPostImage,
  instagramSquare,
  instagramPortrait,
  instagramStory,
  instagramHighlight,
  ...ogTemplates,
  productHuntGallery,
  productHuntThumbnail,
  youtubeThumbnail,
  youtubeBanner,
  pinterestPin,
  pinterestBoardCover,
  linkedinCompanyCover,
  blueskyBanner,
  facebookCover,
  discordBanner,
  twitchBanner,
  mastodonHeader,
  redditBanner,
  tumblrHeader,
  dribbbleShot,
  behanceCover,
  patreonCover,
  kickBanner,
  bandcampHeader,
  twitchOffline,
  linkedinEvent,
  telegramCover,
  substackBanner,
  ghostCover,
  spotifyPlaylistCover,
  devtoCover,
  hashnodeCover,
  etsyShopBanner,
  gumroadCover,
  kofiBanner,
  buyMeACoffeeCover,
  notionCover,
  mediumBanner,
];

export const socialPlatforms: SocialPlatform[] = [
  "GitHub",
  "LinkedIn",
  "X",
  "Instagram",
  "Open Graph",
  "Product Hunt",
  "YouTube",
  "Pinterest",
  "Bluesky",
  "Facebook",
  "Discord",
  "Twitch",
  "Mastodon",
  "Reddit",
  "Tumblr",
  "Dribbble",
  "Behance",
  "Patreon",
  "Kick",
  "Bandcamp",
  "Telegram",
  "Substack",
  "Ghost",
  "Spotify",
  "DEV",
  "Hashnode",
  "Etsy",
  "Gumroad",
  "Ko-fi",
  "Buy Me a Coffee",
  "Notion",
  "Medium",
];

export type SocialPlatformGroup = "core" | "more";

/**
 * Where each platform sits in the picker and the default pack. Core platforms are shown first and go
 * into the default ZIP; the rest are under "More platforms" and are added to a pack by choice. A new
 * platform must be listed here (the record is exhaustive), so it is a deliberate decision.
 */
export const socialPlatformGroups: Record<SocialPlatform, SocialPlatformGroup> = {
  GitHub: "core",
  LinkedIn: "core",
  X: "core",
  Instagram: "core",
  "Open Graph": "core",
  "Product Hunt": "core",
  YouTube: "core",
  Pinterest: "core",
  Bluesky: "core",
  Facebook: "core",
  Discord: "core",
  Twitch: "core",
  Mastodon: "core",
  Reddit: "core",
  Telegram: "core",
  Substack: "core",
  DEV: "core",
  Hashnode: "core",
  Notion: "core",
  Medium: "core",
  Tumblr: "more",
  Dribbble: "more",
  Behance: "more",
  Patreon: "more",
  Kick: "more",
  Bandcamp: "more",
  Ghost: "more",
  Spotify: "more",
  Etsy: "more",
  Gumroad: "more",
  "Ko-fi": "more",
  "Buy Me a Coffee": "more",
};

/** Platforms in picker order: the core ones first, then the rest, each in registry order. */
export const orderedSocialPlatforms: SocialPlatform[] = [
  ...socialPlatforms.filter((platform) => socialPlatformGroups[platform] === "core"),
  ...socialPlatforms.filter((platform) => socialPlatformGroups[platform] === "more"),
];

export function isCoreTemplate(template: SocialTemplate): boolean {
  return socialPlatformGroups[template.platform] === "core";
}

/** Ids from earlier versions, so saved selections keep working. */
const aliases: Record<string, string> = { "github-banner": "github-classic" };

export function getSocialTemplate(id: string): SocialTemplate | undefined {
  const target = aliases[id] ?? id;
  return socialTemplates.find((template) => template.id === target);
}

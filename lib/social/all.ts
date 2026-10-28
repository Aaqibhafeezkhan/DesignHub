import type { SocialTemplate } from "@/lib/social/types";
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

/**
 * Every social template with its drawing code, in picker order. Only the guidelines pages and the tests import
 * this; the studio lists templates from `registry.ts` and loads one when it is chosen (see `loaders.ts`).
 */
export const allSocialTemplates: SocialTemplate[] = [
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

import { expect, test } from "vitest";

import { packTemplates } from "@/lib/social/pack";
import { getSocialTemplate, socialPlatforms, socialTemplates } from "@/lib/social/registry";

test("template ids are unique", () => {
  const ids = socialTemplates.map((template) => template.id);
  expect(new Set(ids).size).toBe(ids.length);
});

test("every template's platform is listed, so the picker and pack show it", () => {
  for (const template of socialTemplates) expect(socialPlatforms).toContain(template.platform);
});

test("safe areas and covered zones fit inside the canvas", () => {
  for (const { id, width, height, safe, covered = [] } of socialTemplates) {
    for (const rect of [safe, ...covered]) {
      expect(rect.x, id).toBeGreaterThanOrEqual(0);
      expect(rect.y, id).toBeGreaterThanOrEqual(0);
      expect(rect.x + rect.width, id).toBeLessThanOrEqual(width);
      expect(rect.y + rect.height, id).toBeLessThanOrEqual(height);
    }
  }
});

test.each([
  ["twitch-banner", 1200, 480],
  ["mastodon-header", 1500, 500],
  ["instagram-portrait", 1080, 1350],
  ["youtube-banner", 2560, 1440],
  ["reddit-banner", 1920, 384],
  ["tumblr-header", 3000, 1055],
  ["dribbble-shot", 1600, 1200],
  ["behance-cover", 808, 632],
  ["patreon-cover", 1600, 400],
  ["kick-banner", 1920, 480],
  ["bandcamp-header", 975, 180],
  ["product-hunt-thumbnail", 240, 240],
  ["twitch-offline", 1920, 1080],
  ["linkedin-event", 1776, 444],
  ["telegram-cover", 1280, 720],
  ["substack-banner", 1100, 220],
  ["spotify-playlist-cover", 640, 640],
  ["devto-cover", 1000, 420],
  ["hashnode-cover", 1600, 840],
  ["x-post-image", 1600, 900],
  ["pinterest-board-cover", 600, 600],
])("%s is registered at %ix%i and included in the full pack", (id, width, height) => {
  const template = getSocialTemplate(id);
  expect(template).toMatchObject({ width, height });
  expect(packTemplates(null)).toContain(template);
});

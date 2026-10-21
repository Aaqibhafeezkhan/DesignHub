import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/site";

/**
 * Next types `share_target.params.files` as `File | File[]`, but the web app manifest spec wants
 * `{ name, accept }` descriptors there, so the manifest is built as plain data and cast once.
 */
export default function manifest(): MetadataRoute.Manifest {
  const manifest = {
    name: siteConfig.name,
    short_name: siteConfig.name,
    description: siteConfig.description,
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0e0e10",
    theme_color: "#0e0e10",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    // The installed app's icon menu jumps straight to these studios. Every url is an existing route.
    shortcuts: [
      { name: "Color Studio", short_name: "Colors", description: "Palettes, shades and contrast", url: "/colors" },
      {
        name: "Typography Studio",
        short_name: "Typography",
        description: "Fonts, pairs and type scales",
        url: "/typography",
      },
      {
        name: "Brand Projects",
        short_name: "Projects",
        description: "Open, save and compare brands",
        url: "/projects",
      },
      { name: "Export Engine", short_name: "Export", description: "Design tokens in every format", url: "/export" },
    ].map((shortcut) => ({ ...shortcut, icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }] })),
    // A double click on a .designhub.json file opens the installed app, which asks before importing.
    file_handlers: [{ action: "/projects", accept: { "application/json": [".designhub.json"] } }],
    // A file shared from another app is answered by the service worker (no server), then opens the import prompt.
    share_target: {
      action: "/share-target",
      method: "POST",
      enctype: "multipart/form-data",
      params: { files: [{ name: "project", accept: ["application/json", ".designhub.json"] }] },
    },
  };
  return manifest as unknown as MetadataRoute.Manifest;
}

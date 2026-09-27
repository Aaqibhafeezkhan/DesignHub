import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const appDir = path.join(root, "app");
const staticDir = path.join(root, ".next", "static");
const publicDir = path.join(root, "public");
const buildId = (await readFile(path.join(root, ".next", "BUILD_ID"), "utf8")).trim();

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(absolute)));
    else files.push(absolute);
  }

  return files;
}

function routeFromPage(file) {
  const relative = path.relative(appDir, path.dirname(file));
  const segments = relative === "" ? [] : relative.split(path.sep);

  if (
    segments.some(
      (segment) =>
        segment.startsWith("[") || segment.startsWith("@") || segment.startsWith("."),
    )
  ) {
    throw new Error("Cannot precache dynamic or parallel route: " + file);
  }

  return "/" + segments.filter((segment) => !/^\(.*\)$/.test(segment)).join("/");
}

const pageFiles = (await walk(appDir)).filter((file) =>
  /(?:^|[\\/])page\.(?:js|jsx|ts|tsx)$/.test(file),
);
const routes = new Set(pageFiles.map(routeFromPage));
routes.add("/manifest.webmanifest");
routes.add("/robots.txt");
routes.add("/sitemap.xml");
routes.add("/icon.svg");

const staticFiles = (await walk(staticDir)).map((file) =>
  "/" +
  path.posix.join(
    "_next/static",
    path.relative(staticDir, file).split(path.sep).join("/"),
  ),
);
const publicFiles = (await walk(publicDir))
  .filter((file) => path.basename(file) !== "sw.js")
  .map((file) => "/" + path.relative(publicDir, file).split(path.sep).join("/"));
const precache = [...new Set([...routes, ...staticFiles, ...publicFiles])].sort();

const sw = [
  "const BUILD_ID = " + JSON.stringify(buildId) + ";",
  "const STATIC_CACHE = \"designhub-static-\" + BUILD_ID;",
  "const RUNTIME_CACHE = \"designhub-runtime-\" + BUILD_ID;",
  "const PRECACHE_URLS = " + JSON.stringify(precache, null, 2) + ";",
  "const ICONIFY_HOSTS = new Set([\"api.iconify.design\", \"api.simplesvg.com\", \"api.unisvg.com\"]);",
  "const isCacheable = (response) => response.ok || response.type === \"opaque\";",
  "",
  "async function put(cacheName, request, response) {",
  "  if (!isCacheable(response)) return;",
  "  const cache = await caches.open(cacheName);",
  "  await cache.put(request, response.clone());",
  "}",
  "",
  "async function cacheFirst(request) {",
  "  const cached = await caches.match(request);",
  "  if (cached) return cached;",
  "  const response = await fetch(request);",
  "  await put(RUNTIME_CACHE, request, response);",
  "  return response;",
  "}",
  "",
  "async function staleWhileRevalidate(request) {",
  "  const cached = await caches.match(request);",
  "  const network = fetch(request).then((response) => put(RUNTIME_CACHE, request, response).then(() => response)).catch(() => undefined);",
  "  return cached || (await network) || Response.error();",
  "}",
  "",
  "async function networkFirst(request) {",
  "  try {",
  "    const response = await fetch(request);",
  "    await put(RUNTIME_CACHE, request, response);",
  "    return response;",
  "  } catch {",
  "    return (await caches.match(request, { ignoreSearch: true })) || Response.error();",
  "  }",
  "}",
  "",
  "self.addEventListener(\"install\", (event) => {",
  "  event.waitUntil((async () => {",
  "    const cache = await caches.open(STATIC_CACHE);",
  "    await Promise.all(PRECACHE_URLS.map(async (url) => {",
  "      try { const response = await fetch(url, { cache: \"reload\" }); if (response.ok) await cache.put(url, response); } catch {}",
  "    }));",
  "  })());",
  "});",
  "",
  "self.addEventListener(\"activate\", (event) => {",
  "  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith(\"designhub-\") && key !== STATIC_CACHE && key !== RUNTIME_CACHE).map((key) => caches.delete(key)))));",
  "});",
  "",
  "self.addEventListener(\"message\", (event) => { if (event.data?.type === \"SKIP_WAITING\") self.skipWaiting(); });",
  "",
  "self.addEventListener(\"fetch\", (event) => {",
  "  const request = event.request; if (request.method !== \"GET\") return;",
  "  const url = new URL(request.url);",
  "  if (url.hostname === \"fonts.googleapis.com\") { event.respondWith(staleWhileRevalidate(request)); return; }",
  "  if (url.hostname === \"fonts.gstatic.com\") { event.respondWith(cacheFirst(request)); return; }",
  "  if (ICONIFY_HOSTS.has(url.hostname)) { event.respondWith(networkFirst(request)); return; }",
  "  if (url.origin !== self.location.origin) return;",
  "  if (request.mode === \"navigate\") { event.respondWith(networkFirst(request)); return; }",
  "  if (url.pathname.startsWith(\"/_next/static/\") || PRECACHE_URLS.includes(url.pathname)) event.respondWith(cacheFirst(request));",
  "});",
  ""
].join("\n");

await writeFile(path.join(publicDir, "sw.js"), sw);
console.log("Generated public/sw.js for build " + buildId + " with " + precache.length + " precached resources.");

import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { serviceWorkerSource } from "./service-worker-source.mjs";

const root = process.cwd();
const appDir = path.join(root, "app");
const serverAppDir = path.join(root, ".next", "server", "app");
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

  if (segments.some((segment) => segment.startsWith("[") || segment.startsWith("@") || segment.startsWith("."))) {
    throw new Error("Cannot precache dynamic or parallel route: " + file);
  }

  return "/" + segments.filter((segment) => !/^\(.*\)$/.test(segment)).join("/");
}

/** The built files a prerendered page loads, and the fonts and images its stylesheets point at. */
async function filesOf(route) {
  const html = await readFile(path.join(serverAppDir, route === "/" ? "index.html" : `${route.slice(1)}.html`), "utf8");
  const files = new Set(html.match(/\/_next\/static\/[A-Za-z0-9_./~%-]+/g) ?? []);
  for (const file of [...files].filter((item) => item.endsWith(".css"))) {
    const css = await readFile(path.join(staticDir, file.slice("/_next/static/".length)), "utf8");
    for (const [, target] of css.matchAll(/url\(\.\.\/media\/([A-Za-z0-9_.~-]+)\)/g)) {
      files.add(`/_next/static/media/${target}`);
    }
  }
  return [...files].sort();
}

const pageFiles = (await walk(appDir)).filter((file) => /(?:^|[\\/])page\.(?:js|jsx|ts|tsx)$/.test(file));
const routes = [...new Set(pageFiles.map(routeFromPage))].sort();

const home = await filesOf("/");
const icons = (await walk(publicDir))
  .map((file) => "/" + path.relative(publicDir, file).split(path.sep).join("/"))
  .filter((file) => /^\/icon-\d+\.png$/.test(file));
const shell = [...new Set(["/", "/manifest.webmanifest", "/icon.svg", ...icons, ...home])].sort();

const routeFiles = {};
for (const route of routes) {
  if (route === "/") continue;
  const own = (await filesOf(route)).filter((file) => !shell.includes(file));
  routeFiles[route] = own;
}

await writeFile(path.join(publicDir, "sw.js"), serviceWorkerSource({ buildId, shell, routeFiles }));

const size = async (urls) => {
  let bytes = 0;
  for (const url of urls) {
    const file = url.startsWith("/_next/static/")
      ? path.join(staticDir, url.slice("/_next/static/".length))
      : path.join(publicDir, url);
    try {
      bytes += (await readFile(file)).length;
    } catch {}
  }
  return Math.round(bytes / 1024);
};
console.log(
  `Generated public/sw.js for build ${buildId}: ${shell.length} files (${await size(shell)} kB raw) precached, ` +
    `${routes.length - 1} studios and pages remembered when opened.`,
);

import { builtinModules } from "node:module";

import { defineConfig } from "vite";

/**
 * Bundles the CLI and the app's own token generators into one file, so the published package has no
 * dependencies. Node's built-ins stay external; everything else is inlined.
 */
export default defineConfig({
  resolve: { tsconfigPaths: true },
  build: {
    target: "node22",
    outDir: "dist",
    emptyOutDir: true,
    minify: false,
    ssr: "src/bin.ts",
    rolldownOptions: {
      external: [...builtinModules, /^node:/],
      output: { entryFileNames: "designhub.mjs", format: "es", banner: "#!/usr/bin/env node" },
    },
  },
  ssr: { noExternal: true },
});

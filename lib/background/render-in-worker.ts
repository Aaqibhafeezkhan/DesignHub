import { createRenderClient, type RenderWorker } from "@/lib/background/render-client";
import { renderBackgroundSvg } from "@/lib/background/registry";

const client = createRenderClient(() => {
  // A module worker in its own chunk: the page's first load does not include it.
  const worker = new Worker(new URL("./render.worker.ts", import.meta.url), { type: "module" });
  return worker as unknown as RenderWorker;
}, renderBackgroundSvg);

/** Draws a heavy generator off the page. Rejects with `Superseded` when a newer call overtakes it. */
export const renderInWorker = client.render;

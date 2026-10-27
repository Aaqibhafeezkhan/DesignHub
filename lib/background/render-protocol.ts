import type { BackgroundSettings } from "@/types/background";

/** What the page sends the worker, and what the worker sends back. Only plain data crosses. */
export type RenderRequest = { id: number; settings: BackgroundSettings };
export type RenderResponse = { id: number; svg: string } | { id: number; error: string };

/**
 * The worker's side: draws a request after the current task, and if a newer request arrives first, only that
 * one is drawn. A slider drag sends many requests and gets one drawing per pause, never a queue of stale ones.
 * Superseded requests get no reply.
 */
export function createRenderHandler(
  render: (settings: BackgroundSettings) => string,
  reply: (response: RenderResponse) => void,
  schedule: (run: () => void) => void = (run) => void setTimeout(run, 0),
): (request: RenderRequest) => void {
  let pending: RenderRequest | null = null;
  return (request) => {
    const idle = pending === null;
    pending = request;
    if (!idle) return;
    schedule(() => {
      const next = pending;
      pending = null;
      if (!next) return;
      try {
        reply({ id: next.id, svg: render(next.settings) });
      } catch (error) {
        reply({ id: next.id, error: error instanceof Error ? error.message : "Render failed" });
      }
    });
  };
}

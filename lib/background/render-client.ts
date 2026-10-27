import type { RenderRequest, RenderResponse } from "@/lib/background/render-protocol";
import type { BackgroundSettings } from "@/types/background";

/** The part of a Worker the client uses, so a test can stand in for one. */
export type RenderWorker = {
  postMessage: (request: RenderRequest) => void;
  onmessage: ((event: { data: RenderResponse }) => void) | null;
  onerror: ((event: unknown) => void) | null;
  terminate: () => void;
};

export class Superseded extends Error {
  constructor() {
    super("A newer render replaced this one");
  }
}

type Waiting = { resolve: (svg: string) => void; reject: (error: Error) => void };

/**
 * The page's side: sends settings to a worker and resolves with the SVG. A render that a newer one has
 * overtaken rejects with `Superseded`, and the worker never draws it. If the worker cannot start or fails,
 * `fallback` draws on the page instead, so a browser without module workers still works.
 */
export function createRenderClient(
  createWorker: () => RenderWorker,
  fallback: (settings: BackgroundSettings) => string,
) {
  let worker: RenderWorker | null = null;
  let broken = false;
  let nextId = 0;
  const waiting = new Map<number, Waiting>();

  function fail(error: Error) {
    for (const entry of waiting.values()) entry.reject(error);
    waiting.clear();
    worker?.terminate();
    worker = null;
    broken = true;
  }

  function start(): RenderWorker | null {
    if (broken) return null;
    if (worker) return worker;
    try {
      worker = createWorker();
    } catch {
      broken = true;
      return null;
    }
    worker.onmessage = ({ data }) => {
      const answered = waiting.get(data.id);
      // Anything older than the answer was overtaken: the worker skipped it.
      for (const [id, entry] of waiting) {
        if (id < data.id) {
          entry.reject(new Superseded());
          waiting.delete(id);
        }
      }
      if (!answered) return;
      waiting.delete(data.id);
      if ("svg" in data) answered.resolve(data.svg);
      else answered.reject(new Error(data.error));
    };
    worker.onerror = () => fail(new Error("The background worker stopped"));
    return worker;
  }

  return {
    render(settings: BackgroundSettings): Promise<string> {
      const target = start();
      if (!target) return Promise.resolve(fallback(settings));
      const id = ++nextId;
      return new Promise<string>((resolve, reject) => {
        waiting.set(id, { resolve, reject });
        target.postMessage({ id, settings });
      }).catch((error: unknown) => {
        if (error instanceof Superseded) throw error;
        // The worker failed: draw it here this once, and later renders use the page too.
        return fallback(settings);
      });
    },
    /** Stops the worker and rejects what is waiting. */
    dispose() {
      fail(new Superseded());
      broken = false;
    },
  };
}

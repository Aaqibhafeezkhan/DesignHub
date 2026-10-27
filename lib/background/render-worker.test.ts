import { describe, expect, test } from "vitest";

import { heavyGenerators, renderHeavy } from "@/lib/background/heavy";
import { backgroundGenerators, renderBackgroundSvg } from "@/lib/background/registry";
import { createRenderClient, Superseded, type RenderWorker } from "@/lib/background/render-client";
import { createRenderHandler, type RenderRequest, type RenderResponse } from "@/lib/background/render-protocol";
import { defaultBackground } from "@/store/background-store";
import type { BackgroundKind, BackgroundSettings } from "@/types/background";

const settings = (kind: BackgroundKind, seed = 42): BackgroundSettings => {
  const generator = backgroundGenerators.find((item) => item.kind === kind);
  return { ...defaultBackground, ...generator?.defaults, kind, seed, width: 400, height: 300 };
};

/** A worker that runs in this process: the page's messages go through the same handler the real worker uses. */
function inProcessWorker(queue: (run: () => void) => void, log: number[] = []): RenderWorker {
  const worker: RenderWorker = {
    onmessage: null,
    onerror: null,
    terminate: () => undefined,
    postMessage: (request: RenderRequest) => {
      // Messages reach the worker as tasks, never inside the caller's own stack.
      queueMicrotask(() => handle(request));
    },
  };
  const handle = createRenderHandler(
    (value) => {
      log.push(value.seed);
      return renderHeavy(value);
    },
    (response: RenderResponse) => worker.onmessage?.({ data: response }),
    queue,
  );
  return worker;
}

describe("heavy generators", () => {
  test("the worker's list is exactly the generators marked heavy", () => {
    const marked = backgroundGenerators.filter((generator) => generator.heavy).map((generator) => generator.kind);
    expect(heavyGenerators.map((generator) => generator.kind).sort()).toEqual(marked.sort());
    expect(marked).toEqual(expect.arrayContaining(["flow-field", "topographic", "voronoi", "circle-packing"]));
  });

  test.each(heavyGenerators.map((generator) => generator.kind))(
    "%s draws the same bytes in the worker's list",
    (kind) => {
      expect(renderHeavy(settings(kind))).toBe(renderBackgroundSvg(settings(kind)));
    },
  );

  test("a generator that is not heavy is refused by the worker's renderer", () => {
    expect(() => renderHeavy(settings("waves"))).toThrow(/not a heavy generator/);
  });
});

describe("the render handler", () => {
  test("only the newest request is drawn when several arrive before the draw", () => {
    const replies: RenderResponse[] = [];
    const tasks: (() => void)[] = [];
    const handle = createRenderHandler(
      (value) => `svg ${value.seed}`,
      (response) => replies.push(response),
      (run) => tasks.push(run),
    );
    for (const id of [1, 2, 3]) handle({ id, settings: settings("flow-field", id) });
    expect(tasks).toHaveLength(1);
    tasks.shift()?.();
    expect(replies).toEqual([{ id: 3, svg: "svg 3" }]);
    // The next request after that is drawn as usual.
    handle({ id: 4, settings: settings("flow-field", 4) });
    tasks.shift()?.();
    expect(replies.at(-1)).toEqual({ id: 4, svg: "svg 4" });
  });

  test("an error in a generator is sent back instead of thrown", () => {
    const replies: RenderResponse[] = [];
    const handle = createRenderHandler(
      () => {
        throw new Error("boom");
      },
      (response) => replies.push(response),
      (run) => run(),
    );
    handle({ id: 1, settings: settings("voronoi") });
    expect(replies).toEqual([{ id: 1, error: "boom" }]);
  });
});

describe("the render client", () => {
  test("a heavy generator is drawn through the worker interface and matches the page's drawing", async () => {
    const client = createRenderClient(() => inProcessWorker((run) => void setTimeout(run, 0)), renderBackgroundSvg);
    for (const kind of ["flow-field", "topographic", "voronoi", "circle-packing"] as const) {
      expect(await client.render(settings(kind))).toBe(renderBackgroundSvg(settings(kind)));
    }
    client.dispose();
  });

  test("a render that a newer one overtook is rejected, and the worker never draws it", async () => {
    const drawn: number[] = [];
    const client = createRenderClient(
      () => inProcessWorker((run) => void setTimeout(run, 0), drawn),
      renderBackgroundSvg,
    );
    const first = client.render(settings("flow-field", 1));
    const second = client.render(settings("flow-field", 2));
    const third = client.render(settings("flow-field", 3));
    await expect(first).rejects.toBeInstanceOf(Superseded);
    await expect(second).rejects.toBeInstanceOf(Superseded);
    expect(await third).toBe(renderBackgroundSvg(settings("flow-field", 3)));
    expect(drawn).toEqual([3]);
    client.dispose();
  });

  test("when the worker cannot start, the page draws instead", async () => {
    const client = createRenderClient(() => {
      throw new Error("no module workers here");
    }, renderBackgroundSvg);
    expect(await client.render(settings("voronoi"))).toBe(renderBackgroundSvg(settings("voronoi")));
  });

  test("when the worker fails, waiting renders are drawn on the page and later ones too", async () => {
    let worker: RenderWorker | undefined;
    const client = createRenderClient(() => {
      worker = { onmessage: null, onerror: null, terminate: () => undefined, postMessage: () => undefined };
      return worker;
    }, renderBackgroundSvg);
    const waiting = client.render(settings("circle-packing"));
    worker?.onerror?.(new Event("error"));
    expect(await waiting).toBe(renderBackgroundSvg(settings("circle-packing")));
    expect(await client.render(settings("topographic"))).toBe(renderBackgroundSvg(settings("topographic")));
  });
});

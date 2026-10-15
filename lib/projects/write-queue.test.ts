import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createWriteQueue } from "@/lib/projects/write-queue";

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe("createWriteQueue", () => {
  it("writes a key once after the delay, however often it was scheduled", async () => {
    const write = vi.fn(async () => {});
    const queue = createWriteQueue({ write, delay: 1000 });
    queue.schedule("a");
    await vi.advanceTimersByTimeAsync(600);
    queue.schedule("a");
    await vi.advanceTimersByTimeAsync(600);
    expect(write).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(500);
    expect(write).toHaveBeenCalledTimes(1);
    expect(write).toHaveBeenCalledWith("a");
  });

  it("writes one key at a time, in the order they became ready", async () => {
    const log: string[] = [];
    let release: () => void = () => {};
    const write = vi.fn(async (key: string) => {
      log.push(`start ${key}`);
      await new Promise<void>((resolve) => {
        release = resolve;
      });
      log.push(`end ${key}`);
    });
    const queue = createWriteQueue({ write, delay: 10 });
    queue.schedule("a");
    queue.schedule("b");
    await vi.advanceTimersByTimeAsync(20);
    expect(log).toEqual(["start a"]);
    release();
    await vi.advanceTimersByTimeAsync(0);
    expect(log).toEqual(["start a", "end a", "start b"]);
    release();
    await vi.advanceTimersByTimeAsync(0);
    expect(log).toEqual(["start a", "end a", "start b", "end b"]);
    expect(queue.size()).toBe(0);
  });

  it("writes again when a key changes during its write", async () => {
    let release: () => void = () => {};
    const write = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          release = resolve;
        }),
    );
    const queue = createWriteQueue({ write, delay: 10 });
    queue.schedule("a");
    await vi.advanceTimersByTimeAsync(10);
    expect(write).toHaveBeenCalledTimes(1);
    queue.schedule("a");
    await vi.advanceTimersByTimeAsync(10);
    release();
    await vi.advanceTimersByTimeAsync(0);
    expect(write).toHaveBeenCalledTimes(2);
    release();
    await vi.advanceTimersByTimeAsync(0);
    expect(queue.size()).toBe(0);
  });

  it("flush writes pending keys immediately and resolves when idle", async () => {
    const write = vi.fn(async () => {});
    const onSuccess = vi.fn();
    const queue = createWriteQueue({ write, delay: 60_000, onSuccess });
    queue.schedule("a");
    queue.schedule("b");
    await queue.flush();
    expect(write.mock.calls).toEqual([["a"], ["b"]]);
    expect(onSuccess).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(120_000);
    expect(write).toHaveBeenCalledTimes(2);
  });

  it("reports a failed write, keeps going, and retries the key on flush", async () => {
    let fail = true;
    const write = vi.fn(async (key: string) => {
      if (key === "a" && fail) throw new Error("denied");
    });
    const onError = vi.fn();
    const onSuccess = vi.fn();
    const queue = createWriteQueue({ write, delay: 10, onError, onSuccess });
    queue.schedule("a");
    queue.schedule("b");
    await vi.advanceTimersByTimeAsync(10);
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0]?.[0]).toBe("a");
    expect(onSuccess).toHaveBeenCalledWith("b");
    expect(queue.size()).toBe(1);
    fail = false;
    await queue.flush();
    expect(onSuccess).toHaveBeenCalledWith("a");
    expect(queue.size()).toBe(0);
  });

  it("clear drops pending and failed keys", async () => {
    const write = vi.fn(async () => {
      throw new Error("no");
    });
    const queue = createWriteQueue({ write, delay: 10 });
    queue.schedule("a");
    await vi.advanceTimersByTimeAsync(10);
    queue.schedule("b");
    queue.clear();
    expect(queue.size()).toBe(0);
    await queue.flush();
    await vi.advanceTimersByTimeAsync(100);
    expect(write).toHaveBeenCalledTimes(1);
  });
});

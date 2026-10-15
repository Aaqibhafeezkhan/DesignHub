export type WriteQueueOptions = {
  /** Writes one key. Throwing marks the key failed; it is retried on the next `flush`. */
  write: (key: string) => Promise<void>;
  /** Quiet time after the last `schedule` of a key before it is written. */
  delay: number;
  onSuccess?: (key: string) => void;
  onError?: (key: string, error: unknown) => void;
};

export type WriteQueue = {
  /** Writes `key` after the delay. Scheduling it again before then resets the timer, so a burst is one write. */
  schedule: (key: string) => void;
  /** Writes everything pending now, plus every key that failed earlier, and resolves when the queue is idle. */
  flush: () => Promise<void>;
  /** Keys waiting for their timer or a write, plus failed ones. */
  size: () => number;
  /** Forgets everything not yet written. */
  clear: () => void;
};

/**
 * A debounced, serial write queue: one write at a time, each key coalesced, and a key that changes
 * while it is being written is written again afterwards, so the last state always lands.
 */
export function createWriteQueue(options: WriteQueueOptions): WriteQueue {
  const timers = new Map<string, ReturnType<typeof setTimeout>>();
  const ready: string[] = [];
  const failed = new Set<string>();
  let running: Promise<void> | null = null;
  let current: string | null = null;

  function enqueue(key: string) {
    if (!ready.includes(key)) ready.push(key);
    if (!running) start();
  }

  function start() {
    running = drain().finally(() => {
      running = null;
      // A key queued between the last loop check and here would otherwise wait for the next schedule.
      if (ready.length > 0) start();
    });
  }

  async function drain() {
    for (let key = ready.shift(); key !== undefined; key = ready.shift()) {
      failed.delete(key);
      current = key;
      try {
        await options.write(key);
        options.onSuccess?.(key);
      } catch (error) {
        failed.add(key);
        options.onError?.(key, error);
      }
      current = null;
    }
  }

  return {
    schedule(key) {
      clearTimeout(timers.get(key));
      timers.set(
        key,
        setTimeout(() => {
          timers.delete(key);
          enqueue(key);
        }, options.delay),
      );
    },
    async flush() {
      for (const [key, timer] of timers) {
        clearTimeout(timer);
        timers.delete(key);
        enqueue(key);
      }
      for (const key of failed) enqueue(key);
      while (running) await running;
    },
    size: () => new Set([...timers.keys(), ...ready, ...failed, ...(current === null ? [] : [current])]).size,
    clear() {
      for (const timer of timers.values()) clearTimeout(timer);
      timers.clear();
      ready.length = 0;
      failed.clear();
    },
  };
}

import { afterEach, describe, expect, test, vi } from "vitest";

import { createRandom, pick, r1, randomSeed, range } from "@/lib/background/random";

const sequence = (seed: number, count = 20) => {
  const random = createRandom(seed);
  return Array.from({ length: count }, () => random());
};

afterEach(() => vi.restoreAllMocks());

describe("createRandom", () => {
  test("the same seed gives the same sequence", () => {
    expect(sequence(42)).toEqual(sequence(42));
  });

  test("different seeds give different sequences", () => {
    expect(sequence(1)).not.toEqual(sequence(2));
    expect(sequence(0)).not.toEqual(sequence(1));
  });

  test("generators are independent of each other", () => {
    const a = createRandom(9);
    const b = createRandom(9);
    a();
    a();
    expect(b()).toBe(sequence(9, 1)[0]);
  });

  test("values stay in [0, 1)", () => {
    for (const value of sequence(123, 5000)) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  test("a known seed gives fixed values, so the algorithm can't change unnoticed", () => {
    // Changing the algorithm changes every saved background. If this fails on purpose, say so in the changelog.
    expect(createRandom(42)()).toBe(0.6011037519201636);
    expect(sequence(42, 3)).toEqual([0.6011037519201636, 0.44829055899754167, 0.8524657934904099]);
  });

  test("fractional and negative seeds are folded into a 32-bit integer", () => {
    expect(sequence(7.9)).toEqual(sequence(7));
    expect(sequence(-1)).toEqual(sequence(0xffffffff));
    expect(sequence(2 ** 32 + 5)).toEqual(sequence(5));
  });
});

describe("randomSeed", () => {
  test("returns an integer from 1 to 999999", () => {
    vi.spyOn(Math, "random").mockReturnValueOnce(0).mockReturnValueOnce(0.999999999);
    expect(randomSeed()).toBe(1);
    expect(randomSeed()).toBe(999_999);
    for (let i = 0; i < 200; i += 1) {
      const seed = randomSeed();
      expect(Number.isInteger(seed)).toBe(true);
      expect(seed).toBeGreaterThanOrEqual(1);
      expect(seed).toBeLessThanOrEqual(999_999);
    }
  });
});

describe("range", () => {
  test("stays inside its bounds", () => {
    const random = createRandom(5);
    for (let i = 0; i < 2000; i += 1) {
      const value = range(random, -3, 8);
      expect(value).toBeGreaterThanOrEqual(-3);
      expect(value).toBeLessThan(8);
    }
  });

  test("maps the ends of the random scale to min and max", () => {
    expect(range(() => 0, 2, 10)).toBe(2);
    expect(range(() => 0.5, 2, 10)).toBe(6);
  });
});

describe("pick", () => {
  test("only returns items from the list and reaches all of them", () => {
    const items = ["a", "b", "c", "d"] as const;
    const random = createRandom(11);
    const seen = new Set<string>();
    for (let i = 0; i < 500; i += 1) {
      const item = pick(random, items);
      expect(items).toContain(item);
      seen.add(item);
    }
    expect(seen.size).toBe(items.length);
  });

  test("picks the first and last item at the ends of the random scale", () => {
    expect(pick(() => 0, [1, 2, 3])).toBe(1);
    expect(pick(() => 0.999999, [1, 2, 3])).toBe(3);
  });

  test("throws for an empty list", () => {
    expect(() => pick(createRandom(1), [])).toThrow("non-empty");
  });
});

describe("r1", () => {
  test("rounds to one decimal place", () => {
    expect(r1(1.04)).toBe(1);
    expect(r1(1.26)).toBe(1.3);
    expect(r1(-2.74)).toBe(-2.7);
  });
});

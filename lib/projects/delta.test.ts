import { describe, expect, test } from "vitest";

import { applyDelta, diffJson, sameJson, type Json } from "@/lib/projects/delta";

const roundTrip = (a: Json, b: Json) => expect(applyDelta(a, diffJson(a, b))).toEqual(b);

describe("delta", () => {
  test("equal values have no delta, whatever the order of keys", () => {
    expect(diffJson({ a: 1, b: [1, 2] }, { b: [1, 2], a: 1 })).toBeNull();
    expect(sameJson({ a: { b: null } }, { a: { b: null } })).toBe(true);
    expect(sameJson({ a: 1 }, { a: 1, b: 2 })).toBe(false);
  });

  test("a change inside an object holds only the changed keys", () => {
    const delta = diffJson(
      { keep: { big: "x".repeat(500) }, name: "Acme" },
      { keep: { big: "x".repeat(500) }, name: "Beta" },
    );
    expect(delta).toEqual({ o: { name: { r: "Beta" } } });
  });

  test("added keys, removed keys, nulls and changed types all round trip", () => {
    roundTrip({ a: 1 }, { a: 1, b: { c: [1, { d: 2 }] } });
    roundTrip({ a: 1, b: 2 }, { a: 1 });
    roundTrip({ a: null }, { a: { b: 1 } });
    roundTrip({ a: { b: 1 } }, { a: null });
    roundTrip({ a: [1, 2, 3] }, { a: [1, 2] });
    roundTrip({ a: "text" }, { a: 5 });
    roundTrip([1, 2], { a: 1 });
    roundTrip({ a: 1 }, [1]);
  });

  test("a key that holds null is not mistaken for a deleted one", () => {
    const delta = diffJson({ a: 1 }, { a: null });
    expect(delta).toEqual({ o: { a: { r: null } } });
    expect(applyDelta({ a: 1 }, delta)).toEqual({ a: null });
  });

  test("random edits round trip", () => {
    let seed = 7;
    const next = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
    const make = (depth: number): Json => {
      const roll = next();
      if (depth === 0 || roll < 0.3)
        return roll < 0.1 ? null : roll < 0.2 ? Math.floor(next() * 10) : `s${Math.floor(next() * 5)}`;
      if (roll < 0.45) return Array.from({ length: Math.floor(next() * 4) }, () => make(depth - 1));
      return Object.fromEntries(Array.from({ length: Math.floor(next() * 4) }, (_, i) => [`k${i}`, make(depth - 1)]));
    };
    for (let round = 0; round < 300; round += 1) roundTrip(make(4), make(4));
  });
});

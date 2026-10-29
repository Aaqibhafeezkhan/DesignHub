/** Plain data, as a snapshot is: what JSON can hold. */
export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

/**
 * The change from one value to another, as plain data. An object changes key by key (`o`), a key that is gone
 * is `d`, and anything else (a number, a string, an array) is replaced whole (`r`). Arrays are replaced
 * whole on purpose: they are short here, and a change inside one is rarely more than one element.
 */
export type Delta = { r: Json } | { o: Record<string, Delta> } | { d: true };

const isObject = (value: Json): value is { [key: string]: Json } =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export function sameJson(a: Json, b: Json): boolean {
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((item, i) => sameJson(item, b[i]!));
  if (isObject(a) && isObject(b)) {
    const keys = Object.keys(a);
    return keys.length === Object.keys(b).length && keys.every((key) => key in b && sameJson(a[key]!, b[key]!));
  }
  return false;
}

/** What changes `from` into `to`, or null when they are the same. */
export function diffJson(from: Json, to: Json): Delta | null {
  if (sameJson(from, to)) return null;
  if (isObject(from) && isObject(to)) {
    const changes: Record<string, Delta> = {};
    for (const [key, value] of Object.entries(to)) {
      if (!(key in from)) changes[key] = { r: value };
      else {
        const inner = diffJson(from[key]!, value);
        if (inner) changes[key] = inner;
      }
    }
    for (const key of Object.keys(from)) if (!(key in to)) changes[key] = { d: true };
    return { o: changes };
  }
  return { r: to };
}

/** `from` with the change applied. The inverse of `diffJson`: `applyDelta(a, diffJson(a, b))` equals `b`. */
export function applyDelta(from: Json, delta: Delta | null): Json {
  if (delta === null) return from;
  if ("r" in delta) return delta.r;
  if ("d" in delta) throw new Error("A deletion only applies to a key of an object");
  if (!isObject(from)) throw new Error("A change to keys needs an object to change");
  const result: { [key: string]: Json } = { ...from };
  for (const [key, change] of Object.entries(delta.o)) {
    if ("d" in change) delete result[key];
    else result[key] = applyDelta(from[key] ?? null, change);
  }
  return result;
}

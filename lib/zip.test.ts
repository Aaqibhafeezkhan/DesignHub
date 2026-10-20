import { describe, expect, test } from "vitest";

import { crc32, createZip } from "@/lib/zip";

type CentralEntry = {
  name: string;
  flags: number;
  crc: number;
  compressedSize: number;
  size: number;
  localOffset: number;
};

/** Reads the end record and central directory back by hand. */
function readZip(bytes: Uint8Array): { entries: CentralEntry[]; data: (entry: CentralEntry) => Uint8Array } {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const end = bytes.length - 22;
  expect(view.getUint32(end, true)).toBe(0x06054b50);
  const count = view.getUint16(end + 10, true);
  expect(view.getUint16(end + 8, true)).toBe(count);
  const centralSize = view.getUint32(end + 12, true);
  const centralStart = view.getUint32(end + 16, true);
  expect(centralStart + centralSize).toBe(end);

  const decoder = new TextDecoder();
  const entries: CentralEntry[] = [];
  let offset = centralStart;
  for (let i = 0; i < count; i += 1) {
    expect(view.getUint32(offset, true)).toBe(0x02014b50);
    const nameLength = view.getUint16(offset + 28, true);
    entries.push({
      flags: view.getUint16(offset + 8, true),
      crc: view.getUint32(offset + 16, true),
      compressedSize: view.getUint32(offset + 20, true),
      size: view.getUint32(offset + 24, true),
      localOffset: view.getUint32(offset + 42, true),
      name: decoder.decode(bytes.subarray(offset + 46, offset + 46 + nameLength)),
    });
    offset += 46 + nameLength;
  }

  const data = (entry: CentralEntry) => {
    const local = entry.localOffset;
    expect(view.getUint32(local, true)).toBe(0x04034b50);
    expect(view.getUint32(local + 14, true)).toBe(entry.crc);
    const nameLength = view.getUint16(local + 26, true);
    const start = local + 30 + nameLength;
    return bytes.subarray(start, start + entry.size);
  };
  return { entries, data };
}

describe("crc32", () => {
  test("matches the standard check value", () => {
    expect(crc32(new TextEncoder().encode("123456789"))).toBe(0xcbf43926);
    expect(crc32(new Uint8Array())).toBe(0);
  });
});

describe("createZip", () => {
  test("writes only an end record for an empty archive", () => {
    const zip = createZip([]);
    expect(zip.length).toBe(22);
    expect(readZip(zip).entries).toEqual([]);
  });

  test("stores one file with its name, size and CRC-32", () => {
    const zip = createZip([{ name: "hello.txt", data: "Hello, world" }]);
    const { entries, data } = readZip(zip);
    expect(entries).toHaveLength(1);
    const [entry] = entries;
    expect(entry?.name).toBe("hello.txt");
    expect(entry?.size).toBe(12);
    expect(entry?.compressedSize).toBe(12);
    expect(entry?.crc).toBe(crc32(new TextEncoder().encode("Hello, world")));
    expect(new TextDecoder().decode(data(entry as CentralEntry))).toBe("Hello, world");
  });

  test("keeps many files in order, including binary data and a nested folder name", () => {
    const binary = new Uint8Array([0, 255, 1, 254]);
    const zip = createZip([
      { name: "a.css", data: "a{}" },
      { name: "assets/icons/b.bin", data: binary },
      { name: "c.json", data: "" },
    ]);
    const { entries, data } = readZip(zip);
    expect(entries.map((entry) => entry.name)).toEqual(["a.css", "assets/icons/b.bin", "c.json"]);
    expect(Array.from(data(entries[1] as CentralEntry))).toEqual([0, 255, 1, 254]);
    expect(entries[2]?.size).toBe(0);
  });

  test("encodes a non-ASCII name as UTF-8 and flags it", () => {
    const zip = createZip([{ name: "café/über.txt", data: "x" }]);
    const [entry] = readZip(zip).entries;
    expect(entry?.name).toBe("café/über.txt");
    expect((entry?.flags ?? 0) & 0x0800).toBe(0x0800);
  });
});

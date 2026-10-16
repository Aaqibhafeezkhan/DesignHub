import { crc32 } from "node:zlib";
import { describe, expect, test } from "vitest";

import { CREDIT_TEXT, withPngCredit, withSvgCredit } from "@/lib/export/credit";
import { xmlError } from "@/lib/test/xml";

const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

/** One PNG chunk with a correct length and CRC. */
function chunk(type: string, data: number[]): number[] {
  const body = [...new TextEncoder().encode(type), ...data];
  const out = new Uint8Array(8 + data.length + 4);
  const view = new DataView(out.buffer);
  view.setUint32(0, data.length);
  out.set(body, 4);
  view.setUint32(8 + data.length, crc32(Uint8Array.from(body)));
  return [...out];
}

/** A valid 1 x 1 RGBA PNG: IHDR, one IDAT with made-up bytes, IEND. */
const idat = [0x78, 0x9c, 0x63, 0x60, 0x60, 0x60, 0xf8, 0x0f, 0x00, 0x01, 0x01, 0x01, 0x00];
const ihdr = [0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0];
const png = Uint8Array.from([...signature, ...chunk("IHDR", ihdr), ...chunk("IDAT", idat), ...chunk("IEND", [])]);

type Chunk = { type: string; data: Uint8Array; crc: number; crcOk: boolean; start: number };

function readChunks(bytes: Uint8Array): Chunk[] {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const chunks: Chunk[] = [];
  let offset = 8;
  while (offset < bytes.length) {
    const length = view.getUint32(offset);
    const type = new TextDecoder().decode(bytes.subarray(offset + 4, offset + 8));
    const data = bytes.subarray(offset + 8, offset + 8 + length);
    const crc = view.getUint32(offset + 8 + length);
    chunks.push({
      type,
      data,
      crc,
      crcOk: crc32(bytes.subarray(offset + 4, offset + 8 + length)) === crc,
      start: offset,
    });
    offset += 12 + length;
  }
  return chunks;
}

describe("withPngCredit", () => {
  test("keeps the signature and adds tEXt chunks before IEND", () => {
    const out = withPngCredit(png);
    expect([...out.subarray(0, 8)]).toEqual(signature);
    const chunks = readChunks(out);
    const types = chunks.map((item) => item.type);
    expect(types[0]).toBe("IHDR");
    expect(types.at(-1)).toBe("IEND");
    expect(types.filter((type) => type === "tEXt")).toHaveLength(3);
    expect(types.lastIndexOf("tEXt")).toBeLessThan(types.indexOf("IEND"));
    // The file ends exactly at the end of IEND.
    const iend = chunks.at(-1)!;
    expect(iend.start + 12).toBe(out.length);
  });

  test("writes the credit as a Comment chunk with a correct CRC", () => {
    const chunks = readChunks(withPngCredit(png));
    expect(chunks.every((item) => item.crcOk)).toBe(true);
    const comment = chunks
      .filter((item) => item.type === "tEXt")
      .map((item) => new TextDecoder().decode(item.data))
      .find((text) => text.startsWith("Comment\0"));
    expect(comment).toBe(`Comment\0${CREDIT_TEXT}`);
  });

  test("leaves the image data untouched", () => {
    const before = readChunks(png);
    const after = readChunks(withPngCredit(png));
    for (const type of ["IHDR", "IDAT", "IEND"]) {
      const a = before.find((item) => item.type === type)!;
      const b = after.find((item) => item.type === type)!;
      expect([...b.data]).toEqual([...a.data]);
      expect(b.crc).toBe(a.crc);
    }
  });

  test("works on a view into a larger buffer", () => {
    const padded = new Uint8Array(png.length + 10);
    padded.set(png, 7);
    const out = withPngCredit(padded.subarray(7, 7 + png.length));
    expect(readChunks(out).every((item) => item.crcOk)).toBe(true);
    expect(readChunks(out).map((item) => item.type)).toContain("tEXt");
  });

  test("returns input that is not a PNG as is", () => {
    const text = new TextEncoder().encode("not a png at all, just some bytes of text here");
    expect(withPngCredit(text)).toBe(text);
    const short = Uint8Array.from(signature);
    expect(withPngCredit(short)).toBe(short);
  });
});

describe("withSvgCredit", () => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10"/></svg>`;

  test("adds the credit as a comment and metadata inside the root", () => {
    const out = withSvgCredit(svg);
    expect(out).toContain(`<!-- ${CREDIT_TEXT} -->`);
    expect(out).toContain(`<metadata>${CREDIT_TEXT}</metadata>`);
    expect(out.startsWith('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><!--')).toBe(true);
    expect(xmlError(out)).toBeNull();
  });

  test("adds the credit only once", () => {
    const once = withSvgCredit(svg);
    expect(withSvgCredit(once)).toBe(once);
    expect(once.split(CREDIT_TEXT)).toHaveLength(3);
  });

  test("keeps a self-closing root well-formed", () => {
    const out = withSvgCredit(`<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>`);
    expect(out).toContain(CREDIT_TEXT);
    expect(xmlError(out)).toBeNull();
  });

  test("keeps an XML prolog in front of the root", () => {
    const out = withSvgCredit(`<?xml version="1.0"?>\n${svg}`);
    expect(out.startsWith('<?xml version="1.0"?>\n<svg')).toBe(true);
    expect(xmlError(out)).toBeNull();
  });
});

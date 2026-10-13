import { describe, expect, test } from "vitest";

import { encodeIco } from "@/lib/icons/ico";

// The encoder never decodes PNGs, so these signature-prefixed payloads need not be complete images.
const png16 = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x10, 0x00, 0xff]);
const png32 = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x20, 0x80, 0x01, 0xfe, 0x7f]);

describe("encodeIco", () => {
  test("writes the header, directory entries and unchanged payloads for two images", () => {
    const expected16 = png16.slice();
    const expected32 = png32.slice();
    const ico = encodeIco([
      { size: 16, png: png16 },
      { size: 32, png: png32 },
    ]);
    const view = new DataView(ico.buffer, ico.byteOffset, ico.byteLength);

    expect(view.getUint16(0, true)).toBe(0);
    expect(view.getUint16(2, true)).toBe(1);
    expect(view.getUint16(4, true)).toBe(2);
    // ICONDIR is 6 bytes and each of the two directory entries is 16 bytes.
    expect(ico.byteLength).toBe(38 + png16.length + png32.length);

    const entries = [
      { entry: 6, size: 16, png: expected16, offset: 38 },
      { entry: 22, size: 32, png: expected32, offset: 38 + expected16.length },
    ];
    for (const { entry, size, png, offset } of entries) {
      expect(view.getUint8(entry)).toBe(size);
      expect(view.getUint8(entry + 1)).toBe(size);
      expect(view.getUint8(entry + 2)).toBe(0);
      expect(view.getUint8(entry + 3)).toBe(0);
      expect(view.getUint16(entry + 4, true)).toBe(1);
      expect(view.getUint16(entry + 6, true)).toBe(32);

      const length = view.getUint32(entry + 8, true);
      const payloadOffset = view.getUint32(entry + 12, true);
      expect(length).toBe(png.length);
      expect(payloadOffset).toBe(offset);
      expect(ico.slice(payloadOffset, payloadOffset + length)).toEqual(png);
    }
  });

  test("encodes 256px width and height as zero", () => {
    const ico = encodeIco([{ size: 256, png: png16 }]);
    const view = new DataView(ico.buffer, ico.byteOffset, ico.byteLength);

    expect(view.getUint8(6)).toBe(0);
    expect(view.getUint8(7)).toBe(0);
  });
});

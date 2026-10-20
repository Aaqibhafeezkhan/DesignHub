import { describe, expect, test } from "vitest";

import { parseArgs } from "./args";

describe("parseArgs", () => {
  test("splits positionals, options and flags", () => {
    const args = parseArgs(["build", "brand.json", "--format", "css,tailwind-v4", "--out=tokens/", "--help"]);
    expect(args.positionals).toEqual(["build", "brand.json"]);
    expect(args.options.get("format")).toBe("css,tailwind-v4");
    expect(args.options.get("out")).toBe("tokens/");
    expect(args.flags.has("help")).toBe(true);
  });

  test("understands short options", () => {
    const args = parseArgs(["-f", "css", "-o", "out", "-h", "-v"]);
    expect(args.options.get("format")).toBe("css");
    expect(args.options.get("out")).toBe("out");
    expect([...args.flags].sort()).toEqual(["help", "version"]);
  });

  test("everything after -- is positional", () => {
    expect(parseArgs(["build", "--", "--odd-name.json"]).positionals).toEqual(["build", "--odd-name.json"]);
  });

  test("an option without a value is an error", () => {
    expect(() => parseArgs(["build", "--format"])).toThrow("Option --format needs a value.");
    expect(() => parseArgs(["--out", "--help"])).toThrow("Option --out needs a value.");
  });
});

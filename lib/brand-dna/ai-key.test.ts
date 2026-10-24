import { describe, expect, test } from "vitest";

import { cleanBaseUrl, cleanModelName, isLocalBaseUrl, isLocalHost } from "@/lib/brand-dna/ai-key";

describe("cleanBaseUrl", () => {
  test("accepts https anywhere and drops a trailing slash", () => {
    expect(cleanBaseUrl("https://api.openai.com/v1")).toBe("https://api.openai.com/v1");
    expect(cleanBaseUrl("  https://example.com/v1/  ")).toBe("https://example.com/v1");
    expect(cleanBaseUrl("https://example.com")).toBe("https://example.com");
  });

  test("accepts plain http only on this device", () => {
    expect(cleanBaseUrl("http://localhost:11434/v1")).toBe("http://localhost:11434/v1");
    expect(cleanBaseUrl("http://127.0.0.1:8080/v1")).toBe("http://127.0.0.1:8080/v1");
    expect(cleanBaseUrl("http://example.com/v1")).toBeNull();
    expect(cleanBaseUrl("http://localhost.example.com/v1")).toBeNull();
  });

  test("refuses credentials, queries, fragments and other schemes", () => {
    for (const value of [
      "https://user:pass@example.com/v1",
      "https://example.com/v1?key=1",
      "https://example.com/v1#x",
      "ftp://example.com",
      "javascript:alert(1)",
      "not a url",
      "",
    ]) {
      expect(cleanBaseUrl(value), value).toBeNull();
    }
  });
});

describe("local hosts", () => {
  test("recognizes this device and nothing else", () => {
    expect(isLocalHost("localhost")).toBe(true);
    expect(isLocalHost("LOCALHOST")).toBe(true);
    expect(isLocalHost("example.com")).toBe(false);
    expect(isLocalBaseUrl("http://localhost:1234/v1")).toBe(true);
    expect(isLocalBaseUrl("https://api.openai.com/v1")).toBe(false);
    expect(isLocalBaseUrl(undefined)).toBe(false);
    expect(isLocalBaseUrl("nonsense")).toBe(false);
  });
});

describe("cleanModelName", () => {
  test("accepts the shapes model names have", () => {
    for (const name of ["gpt-4o", "claude-opus-5-5", "llava:13b", "org/model@v1.2", "qwen2.5vl"]) {
      expect(cleanModelName(name), name).toBe(name);
    }
  });

  test("refuses empty text, spaces and markup", () => {
    for (const name of ["", "  ", "two words", "<script>", "-leading", "a".repeat(101)]) {
      expect(cleanModelName(name), name).toBeNull();
    }
  });
});

import { describe, expect, test, vi } from "vitest";

import { cleanAiKey } from "@/lib/brand-dna/ai-key";
import {
  AI_MODEL,
  aiRequestPreview,
  buildAiRequest,
  createAiProvider,
  describeAiError,
  parseAiAnswer,
  type MessagesClient,
} from "@/lib/brand-dna/providers/anthropic";
import { localProvider } from "@/lib/brand-dna/providers/local";
import type { DnaImage } from "@/lib/brand-dna/types";

const image = (name: string): DnaImage => {
  const pixels = new Uint8ClampedArray(4 * 4 * 4);
  for (let i = 0; i < pixels.length; i += 4) pixels.set([200, 30, 60, 255], i);
  return { id: name, name, url: "blob:x", width: 400, height: 400, pixels, sampleWidth: 4, sampleHeight: 4 };
};

const answer = {
  colors: [
    { hex: "#112233", weight: 0.6, role: "primary" },
    { hex: "#F5F5F5", weight: 0.4, role: "neutral" },
  ],
  heading: "Sora",
  body: "Inter",
  personality: ["Bold", "Warm"],
  mood: "Expressive",
  radius: 12,
  confidence: 0.8,
  notes: ["Strong contrast."],
};

const reply = (text: string, stop_reason = "end_turn") => ({ content: [{ type: "text", text }], stop_reason }) as never;

const client = (create: MessagesClient["messages"]["create"]): MessagesClient => ({ messages: { create } });
const encode = () => "UE5H";

function provider(
  create: MessagesClient["messages"]["create"],
  stored = { key: "sk-ant-test-key-123456789", reviewed: true },
) {
  return createAiProvider({
    loadKey: async () => stored,
    createClient: async () => client(create),
    encode,
    fallback: localProvider,
  });
}

describe("request building", () => {
  test("sends only the downscaled images as PNG blocks, then the instruction", () => {
    const preview = aiRequestPreview([image("a.png"), image("b.png")], encode);
    expect(preview.images.map((item) => item.name)).toEqual(["a.png", "b.png"]);
    const request = buildAiRequest(preview);
    expect(request.model).toBe(AI_MODEL);
    const content = request.messages[0]!.content as { type: string; source?: { media_type: string; data: string } }[];
    expect(content.map((block) => block.type)).toEqual(["image", "image", "text"]);
    expect(content[0]!.source).toEqual({ type: "base64", media_type: "image/png", data: "UE5H" });
    expect(request.output_config?.format?.type).toBe("json_schema");
    // File names, the key and anything about the project stay out of the body.
    expect(JSON.stringify(request)).not.toContain("a.png");
  });
});

describe("parseAiAnswer", () => {
  test("accepts a valid answer and normalizes it", () => {
    const dna = parseAiAnswer(JSON.stringify(answer));
    expect(dna.colors[1]!.hex).toBe("#f5f5f5");
    expect(dna).toMatchObject({ heading: "Sora", body: "Inter", radius: 12, mood: "Expressive" });
  });

  test("clamps numbers and drops invalid colors", () => {
    const dna = parseAiAnswer(
      JSON.stringify({
        ...answer,
        radius: 500,
        confidence: 9,
        colors: [
          ...answer.colors,
          { hex: "red", weight: 1, role: "primary" },
          { hex: "#abcdef", weight: 5, role: "weird" },
        ],
      }),
    );
    expect(dna.radius).toBe(32);
    expect(dna.confidence).toBe(1);
    expect(dna.colors).toHaveLength(3);
    expect(dna.colors[2]).toMatchObject({ role: "neutral", weight: 1 });
  });

  test("rejects answers that are not usable", () => {
    expect(() => parseAiAnswer("nope")).toThrow("not valid JSON");
    expect(() => parseAiAnswer("{}")).toThrow("no colors");
    expect(() => parseAiAnswer(JSON.stringify({ ...answer, colors: [{ hex: "x" }] }))).toThrow("no valid colors");
    expect(() => parseAiAnswer(JSON.stringify({ ...answer, heading: "" }))).toThrow("no fonts");
  });
});

describe("the provider", () => {
  test("returns the model's answer when everything works", async () => {
    const create = vi.fn(async () => reply(JSON.stringify(answer)));
    const result = await provider(create).analyze([image("a.png")]);
    expect(create).toHaveBeenCalledOnce();
    expect(result.heading).toBe("Sora");
    expect(result.notes[0]).toContain(AI_MODEL);
  });

  test("falls back to the on-device result, saying why, for a bad key, a rate limit and a network error", async () => {
    const cases: [unknown, string][] = [
      [Object.assign(new Error("401"), { status: 401 }), "key was rejected"],
      [Object.assign(new Error("429"), { status: 429 }), "rate limiting"],
      [new TypeError("Failed to fetch"), "Could not reach"],
    ];
    for (const [error, message] of cases) {
      const result = await provider(async () => {
        throw error;
      }).analyze([image("a.png")]);
      expect(result.notes[0], message).toContain(message);
      expect(result.notes[0]).toContain("on-device result");
      expect(result.colors.length).toBeGreaterThan(0);
    }
  });

  test("falls back for a refusal, a cut-off answer and an odd answer", async () => {
    for (const response of [reply("{}", "refusal"), reply("{}", "max_tokens"), reply("not json")]) {
      const result = await provider(async () => response).analyze([image("a.png")]);
      expect(result.notes[0]).toContain("on-device result");
    }
  });

  test("sends nothing without a key or before the images were reviewed", async () => {
    const create = vi.fn(async () => reply(JSON.stringify(answer)));
    const noKey = createAiProvider({
      loadKey: async () => null,
      createClient: async () => client(create),
      encode,
      fallback: localProvider,
    });
    expect((await noKey.analyze([image("a.png")])).notes[0]).toContain("Add your API key");
    const unreviewed = await provider(create, { key: "sk-ant-test-key-123456789", reviewed: false }).analyze([
      image("a.png"),
    ]);
    expect(unreviewed.notes[0]).toContain("Review what will be sent");
    expect(create).not.toHaveBeenCalled();
  });

  test("an aborted request throws instead of falling back", async () => {
    const controller = new AbortController();
    const create = async () => {
      controller.abort();
      throw new DOMException("Aborted", "AbortError");
    };
    await expect(provider(create).analyze([image("a.png")], { signal: controller.signal })).rejects.toThrow("Aborted");
  });

  test("is marked as not private and not mocked", () => {
    const item = provider(async () => reply("{}"));
    expect(item).toMatchObject({ id: "anthropic", local: false, mocked: false });
  });
});

describe("keys and errors", () => {
  test("cleanAiKey trims and refuses short or spaced text", () => {
    expect(cleanAiKey("  sk-ant-abcdefghijklmnopqrstuvwxyz  ")).toBe("sk-ant-abcdefghijklmnopqrstuvwxyz");
    expect(cleanAiKey("short")).toBeNull();
    expect(cleanAiKey("sk-ant-abcdef ghijklmnopqrstuvwxyz")).toBeNull();
  });

  test("describeAiError never echoes a key", () => {
    expect(describeAiError({ status: 500 })).toContain("problem");
    expect(describeAiError(new Error("custom"))).toBe("custom");
    expect(describeAiError("???")).toBe("The analysis failed.");
  });
});

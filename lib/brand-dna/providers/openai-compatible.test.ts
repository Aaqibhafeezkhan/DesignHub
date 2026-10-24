import { describe, expect, test, vi } from "vitest";

import { aiRequestPreview, ProviderHttpError } from "@/lib/brand-dna/providers/anthropic";
import { localProvider } from "@/lib/brand-dna/providers/local";
import {
  buildOpenAiRequest,
  chatEndpoint,
  createChatClient,
  createOpenAiProvider,
  openAiRequestPreview,
  type ChatClient,
  type ChatResponse,
} from "@/lib/brand-dna/providers/openai-compatible";
import type { DnaImage } from "@/lib/brand-dna/types";
import type { StoredAiKey } from "@/lib/brand-dna/ai-key";

const image = (name: string): DnaImage => {
  const pixels = new Uint8ClampedArray(4 * 4 * 4);
  for (let i = 0; i < pixels.length; i += 4) pixels.set([200, 30, 60, 255], i);
  return { id: name, name, url: "blob:x", width: 400, height: 400, pixels, sampleWidth: 4, sampleHeight: 4 };
};

const answer = {
  colors: [{ hex: "#112233", weight: 1, role: "primary" }],
  heading: "Sora",
  body: "Inter",
  personality: ["Bold"],
  mood: "Expressive",
  radius: 12,
  confidence: 0.8,
  notes: [],
};

const encode = () => "UE5H";
const hosted: StoredAiKey = {
  key: "sk-test-key-0123456789ab",
  reviewed: true,
  model: "gpt-test",
  baseUrl: "https://api.example.com/v1",
};
const localServer: StoredAiKey = { key: "", reviewed: true, model: "llava:13b", baseUrl: "http://localhost:11434/v1" };

const reply = (content: string | null, finish_reason = "stop", refusal: string | null = null): ChatResponse => ({
  choices: [{ message: { content, refusal }, finish_reason }],
});

function provider(create: ChatClient["create"], stored: StoredAiKey | null = hosted) {
  return createOpenAiProvider({
    loadConnection: async () => stored,
    createClient: () => ({ create }),
    encode,
    fallback: localProvider,
  });
}

describe("request building", () => {
  test("puts the endpoint, the model and the exact images in the preview", () => {
    const preview = openAiRequestPreview([image("a.png")], encode, hosted);
    expect(preview).toMatchObject({
      endpoint: "https://api.example.com/v1/chat/completions",
      host: "api.example.com",
      model: "gpt-test",
    });
    expect(preview.images).toEqual([{ name: "a.png", base64: "UE5H" }]);
    expect(openAiRequestPreview([], encode, localServer).host).toBe("localhost:11434");
  });

  test("sends a system message, then the images as data URLs and the instruction, with a strict schema", () => {
    const request = buildOpenAiRequest(openAiRequestPreview([image("a.png"), image("b.png")], encode, hosted));
    expect(request.model).toBe("gpt-test");
    expect(request.messages.map((message) => message.role)).toEqual(["system", "user"]);
    const content = (request.messages[1] as { content: { type: string; image_url?: { url: string } }[] }).content;
    expect(content.map((part) => part.type)).toEqual(["image_url", "image_url", "text"]);
    expect(content[0]!.image_url!.url).toBe("data:image/png;base64,UE5H");
    expect(request.response_format.json_schema).toMatchObject({ name: "brand_dna", strict: true });
    // File names and the key stay out of the body.
    expect(JSON.stringify(request)).not.toContain("a.png");
    expect(JSON.stringify(request)).not.toContain(hosted.key);
  });

  test("joins the endpoint without doubling slashes", () => {
    expect(chatEndpoint("https://x.test/v1/")).toBe("https://x.test/v1/chat/completions");
  });
});

describe("the chat client", () => {
  const body = buildOpenAiRequest(openAiRequestPreview([image("a.png")], encode, hosted));
  const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status });
  const noWait = async () => {};

  test("posts to the endpoint with the key only in the authorization header", async () => {
    const fetchImpl = vi.fn(async () => json(reply("{}")));
    await createChatClient(hosted, fetchImpl, noWait).create(body);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.example.com/v1/chat/completions");
    expect(url).not.toContain(hosted.key);
    expect(init.headers).toEqual({ "content-type": "application/json", authorization: `Bearer ${hosted.key}` });
    expect(init.body).not.toContain(hosted.key);
  });

  test("sends no authorization header to a local server without a key", async () => {
    const fetchImpl = vi.fn(async () => json(reply("{}")));
    await createChatClient(localServer, fetchImpl, noWait).create(body);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("http://localhost:11434/v1/chat/completions");
    expect(init.headers).toEqual({ "content-type": "application/json" });
  });

  test("tries a rate limit once more and reports other statuses", async () => {
    let calls = 0;
    const flaky = async () => (++calls === 1 ? json({}, 429) : json(reply("{}")));
    await createChatClient(hosted, flaky, noWait).create(body);
    expect(calls).toBe(2);
    await expect(createChatClient(hosted, async () => json({}, 401), noWait).create(body)).rejects.toBeInstanceOf(
      ProviderHttpError,
    );
  });
});

describe("the provider", () => {
  test("returns the model's answer and names the model", async () => {
    const create = vi.fn(async () => reply(JSON.stringify(answer)));
    const result = await provider(create).analyze([image("a.png")]);
    expect(create).toHaveBeenCalledOnce();
    expect(result.heading).toBe("Sora");
    expect(result.notes[0]).toContain("gpt-test");
  });

  test("works with a local server and no key", async () => {
    const create = vi.fn(async () => reply(JSON.stringify(answer)));
    const result = await provider(create, localServer).analyze([image("a.png")]);
    expect(create).toHaveBeenCalledOnce();
    expect(result.notes[0]).toContain("llava:13b");
  });

  test("falls back, saying why, for a bad key, a rate limit and a network error", async () => {
    const cases: [unknown, string][] = [
      [new ProviderHttpError(401), "key was rejected"],
      [new ProviderHttpError(429), "rate limiting"],
      [new TypeError("Failed to fetch"), "Could not reach"],
    ];
    for (const [error, message] of cases) {
      const result = await provider(async () => {
        throw error;
      }).analyze([image("a.png")]);
      expect(result.notes[0], message).toContain(message);
      expect(result.notes[0]).toContain("on-device result");
    }
  });

  test("falls back for a refusal, a cut-off answer, an empty answer and an odd answer", async () => {
    for (const response of [
      reply(null, "stop", "I can't help with that."),
      reply("{}", "length"),
      reply(null),
      reply("not json"),
    ]) {
      const result = await provider(async () => response).analyze([image("a.png")]);
      expect(result.notes[0]).toContain("on-device result");
    }
  });

  test("sends nothing without a connection, a key (for a hosted endpoint) or a review", async () => {
    const create = vi.fn(async () => reply(JSON.stringify(answer)));
    expect((await provider(create, null).analyze([image("a.png")])).notes[0]).toContain("Add your endpoint");
    expect((await provider(create, { ...hosted, key: "" }).analyze([image("a.png")])).notes[0]).toContain(
      "Add your API key",
    );
    expect((await provider(create, { ...hosted, reviewed: false }).analyze([image("a.png")])).notes[0]).toContain(
      "Review what will be sent",
    );
    expect((await provider(create, { ...hosted, model: undefined }).analyze([image("a.png")])).notes[0]).toContain(
      "Add your endpoint",
    );
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
    expect(provider(async () => reply("{}"))).toMatchObject({ id: "openai-compatible", local: false, mocked: false });
  });
});

describe("the first provider's model setting", () => {
  test("the preview carries the chosen model", () => {
    expect(aiRequestPreview([image("a.png")], encode, "custom-model").model).toBe("custom-model");
  });
});

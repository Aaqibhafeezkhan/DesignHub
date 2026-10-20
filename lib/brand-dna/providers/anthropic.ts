import type Anthropic from "@anthropic-ai/sdk";

import { loadAiKey, type StoredAiKey } from "@/lib/brand-dna/ai-key";
import { sampleToPngBase64 } from "@/lib/brand-dna/providers/encode";
import { localProvider } from "@/lib/brand-dna/providers/local";
import type { BrandDna, BrandDnaProvider, DnaColor, DnaImage, DnaOptions } from "@/lib/brand-dna/types";

/** The vision API behind this provider. Named in the UI and in docs/brand-dna-providers.md. */
export const AI_API_NAME = "Anthropic Messages API";
export const AI_MODEL = "claude-opus-5-5";

export const AI_SYSTEM_PROMPT =
  "You are a brand designer. You are shown a small downscaled copy of one to five images that form a moodboard. " +
  "Describe the brand they suggest: a palette of up to six hex colors with relative weights that sum to about 1 and a role " +
  "(primary, secondary or neutral) for each, a Google Fonts heading and body family, three or four short personality words, " +
  "a one or two word mood, a corner radius in pixels between 0 and 32, your confidence from 0 to 1, and one or two short notes. " +
  "Answer only with JSON that matches the schema.";

export const AI_USER_PROMPT = "Analyze these images as one moodboard and describe the brand they suggest.";

const ROLES = ["primary", "secondary", "neutral"] as const;

/** The schema the answer must match (structured outputs), also used to check it again on arrival. */
export const AI_OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    colors: {
      type: "array",
      items: {
        type: "object",
        properties: {
          hex: { type: "string" },
          weight: { type: "number" },
          role: { type: "string", enum: [...ROLES] },
        },
        required: ["hex", "weight", "role"],
        additionalProperties: false,
      },
    },
    heading: { type: "string" },
    body: { type: "string" },
    personality: { type: "array", items: { type: "string" } },
    mood: { type: "string" },
    radius: { type: "number" },
    confidence: { type: "number" },
    notes: { type: "array", items: { type: "string" } },
  },
  required: ["colors", "heading", "body", "personality", "mood", "radius", "confidence", "notes"],
  additionalProperties: false,
} as const;

/** The only part of the SDK client the provider uses, so tests can stand in for it without a network. */
export type MessagesClient = {
  messages: {
    create: (
      body: Anthropic.MessageCreateParamsNonStreaming,
      options?: { signal?: AbortSignal },
    ) => Promise<Anthropic.Message>;
  };
};

/** Everything that is sent: the images (as the exact PNG data), the instructions and the model. */
export type AiRequestPreview = {
  model: string;
  system: string;
  prompt: string;
  images: { name: string; base64: string }[];
};

export function aiRequestPreview(images: DnaImage[], encode: (image: DnaImage) => string): AiRequestPreview {
  return {
    model: AI_MODEL,
    system: AI_SYSTEM_PROMPT,
    prompt: AI_USER_PROMPT,
    images: images.map((image) => ({ name: image.name, base64: encode(image) })),
  };
}

/** The request body for the preview: one image block per image, then the instruction. */
export function buildAiRequest(preview: AiRequestPreview): Anthropic.MessageCreateParamsNonStreaming {
  return {
    model: preview.model,
    max_tokens: 4096,
    system: preview.system,
    output_config: { effort: "low", format: { type: "json_schema", schema: AI_OUTPUT_SCHEMA } },
    messages: [
      {
        role: "user",
        content: [
          ...preview.images.map(
            (image) =>
              ({
                type: "image",
                source: { type: "base64", media_type: "image/png", data: image.base64 },
              }) as const,
          ),
          { type: "text", text: preview.prompt },
        ],
      },
    ],
  };
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Checks a model answer and turns it into `BrandDna`. Anything off-schema throws, so the caller can fall back. */
export function parseAiAnswer(text: string): BrandDna {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("The answer was not valid JSON.");
  }
  if (!isRecord(data) || !Array.isArray(data.colors)) throw new Error("The answer had no colors.");
  const colors: DnaColor[] = [];
  for (const item of data.colors.slice(0, 8)) {
    if (!isRecord(item) || typeof item.hex !== "string" || !/^#[0-9a-f]{6}$/i.test(item.hex)) continue;
    const role = ROLES.find((value) => value === item.role) ?? "neutral";
    const weight = typeof item.weight === "number" && Number.isFinite(item.weight) ? clamp(item.weight, 0, 1) : 0.1;
    colors.push({ hex: item.hex.toLowerCase(), weight, role });
  }
  if (colors.length === 0) throw new Error("The answer had no valid colors.");
  const text_ = (value: unknown, max: number) => (typeof value === "string" ? value.trim().slice(0, max) : "");
  const list = (value: unknown, max: number) =>
    Array.isArray(value)
      ? value
          .map((entry) => text_(entry, 80))
          .filter(Boolean)
          .slice(0, max)
      : [];
  const heading = text_(data.heading, 80);
  const body = text_(data.body, 80);
  if (!heading || !body) throw new Error("The answer had no fonts.");
  return {
    colors,
    heading,
    body,
    personality: list(data.personality, 6),
    mood: text_(data.mood, 40) || "Custom",
    radius: typeof data.radius === "number" && Number.isFinite(data.radius) ? Math.round(clamp(data.radius, 0, 32)) : 8,
    confidence:
      typeof data.confidence === "number" && Number.isFinite(data.confidence) ? clamp(data.confidence, 0, 1) : 0.5,
    notes: list(data.notes, 4),
  };
}

/** Why a request failed, in words for the person using the studio. */
export function describeAiError(error: unknown): string {
  const status = isRecord(error) && typeof error.status === "number" ? error.status : undefined;
  if (status === 401 || status === 403) return "The API key was rejected. Check it or remove it.";
  if (status === 429) return "The provider is rate limiting this key. Try again in a minute.";
  if (status !== undefined && status >= 500) return "The provider had a problem. Try again shortly.";
  if (status !== undefined) return "The provider could not handle this request.";
  if (error instanceof Error && /fetch|network|connect/i.test(error.message)) {
    return "Could not reach the provider. Check your connection.";
  }
  return error instanceof Error && error.message ? error.message : "The analysis failed.";
}

export type AiProviderDeps = {
  loadKey: () => Promise<StoredAiKey | null>;
  createClient: (key: string) => Promise<MessagesClient>;
  encode: (image: DnaImage) => string;
  fallback: BrandDnaProvider;
};

async function browserClient(key: string): Promise<MessagesClient> {
  // Loaded on first use, so the SDK stays out of every other page.
  const { default: Client } = await import("@anthropic-ai/sdk");
  // The person supplied their own key and it only goes to the provider, so browser use is intended.
  return new Client({ apiKey: key, dangerouslyAllowBrowser: true, maxRetries: 1 });
}

/**
 * Brand DNA from a vision model, with the person's own API key. Only the downscaled images the
 * on-device provider prepares are sent, and only after the person has reviewed them. Any failure
 * (no key, not reviewed, bad key, rate limit, network, odd answer) returns the on-device result
 * with a note that says what happened, so the studio never ends up empty-handed.
 */
export function createAiProvider(deps: AiProviderDeps): BrandDnaProvider {
  return {
    id: "anthropic",
    label: "AI (your key)",
    description: `A vision model (${AI_API_NAME}) describes the images. Needs your own API key, kept only in this browser.`,
    local: false,
    mocked: false,
    async analyze(images, options: DnaOptions = {}) {
      const { signal, onStage } = options;
      const fallBack = async (reason: string) => {
        const result = await deps.fallback.analyze(images, options);
        return { ...result, notes: [`${reason} This is the on-device result instead.`, ...result.notes] };
      };

      const stored = await deps.loadKey();
      if (!stored) return fallBack("Add your API key to use AI analysis.");
      if (!stored.reviewed) return fallBack("Review what will be sent before the first request.");

      try {
        onStage?.("reading");
        const request = buildAiRequest(aiRequestPreview(images, deps.encode));
        const client = await deps.createClient(stored.key);
        onStage?.("palette");
        const response = await client.messages.create(request, { signal });
        onStage?.("mood");
        if (response.stop_reason === "refusal") throw new Error("The model declined to describe these images.");
        if (response.stop_reason === "max_tokens") throw new Error("The answer was cut off.");
        const block = response.content.find((item) => item.type === "text");
        if (!block || block.type !== "text") throw new Error("The model returned no answer.");
        const result = parseAiAnswer(block.text);
        onStage?.("type");
        onStage?.("done");
        return { ...result, notes: [`Described by ${AI_MODEL}.`, ...result.notes] };
      } catch (error) {
        if (signal?.aborted || (error instanceof DOMException && error.name === "AbortError")) {
          throw new DOMException("Aborted", "AbortError");
        }
        return fallBack(describeAiError(error));
      }
    },
  };
}

/** The provider the app registers: the real SDK, the stored key and the canvas encoder. */
export const aiProvider = createAiProvider({
  loadKey: loadAiKey,
  createClient: browserClient,
  encode: sampleToPngBase64,
  fallback: localProvider,
});

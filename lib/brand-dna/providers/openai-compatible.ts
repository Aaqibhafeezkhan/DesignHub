import { isLocalBaseUrl, loadAiKey, OPENAI_KEY_STORAGE_NAME, type StoredAiKey } from "@/lib/brand-dna/ai-key";
import {
  AI_OUTPUT_SCHEMA,
  AI_SYSTEM_PROMPT,
  AI_USER_PROMPT,
  ProviderHttpError,
  parseAiAnswer,
  describeAiError,
} from "@/lib/brand-dna/providers/anthropic";
import { sampleToPngBase64 } from "@/lib/brand-dna/providers/encode";
import { localProvider } from "@/lib/brand-dna/providers/local";
import type { BrandDna, BrandDnaProvider, DnaImage, DnaOptions } from "@/lib/brand-dna/types";

/** The API behind this provider. Named in the UI and in docs/brand-dna-providers.md. */
export const OPENAI_API_NAME = "OpenAI-compatible chat completions API";
export const DEFAULT_OPENAI_BASE_URL = "https://api.openai.com/v1";

/** Everything that is sent, and where: the endpoint, the model, the instructions and the exact images. */
export type OpenAiRequestPreview = {
  endpoint: string;
  /** The host the request goes to, shown so the destination is clear before the first request. */
  host: string;
  model: string;
  system: string;
  prompt: string;
  images: { name: string; base64: string }[];
};

export function chatEndpoint(baseUrl: string): string {
  return `${baseUrl.replace(/\/+$/, "")}/chat/completions`;
}

export function openAiRequestPreview(
  images: DnaImage[],
  encode: (image: DnaImage) => string,
  connection: Pick<StoredAiKey, "baseUrl" | "model">,
): OpenAiRequestPreview {
  const endpoint = chatEndpoint(connection.baseUrl ?? DEFAULT_OPENAI_BASE_URL);
  return {
    endpoint,
    host: new URL(endpoint).host,
    model: connection.model ?? "",
    system: AI_SYSTEM_PROMPT,
    prompt: AI_USER_PROMPT,
    images: images.map((image) => ({ name: image.name, base64: encode(image) })),
  };
}

export type ChatContentPart = { type: "image_url"; image_url: { url: string } } | { type: "text"; text: string };

/** The chat completions body: the system instructions, then one image part per image and the instruction. */
export type ChatRequest = {
  model: string;
  max_tokens: number;
  messages: ({ role: "system"; content: string } | { role: "user"; content: ChatContentPart[] })[];
  response_format: {
    type: "json_schema";
    json_schema: { name: string; strict: true; schema: typeof AI_OUTPUT_SCHEMA };
  };
};

export type ChatResponse = {
  choices: { message: { content: string | null; refusal?: string | null }; finish_reason: string | null }[];
};

export function buildOpenAiRequest(preview: OpenAiRequestPreview): ChatRequest {
  return {
    model: preview.model,
    max_tokens: 4096,
    messages: [
      { role: "system", content: preview.system },
      {
        role: "user",
        content: [
          ...preview.images.map((image): ChatContentPart => ({
            type: "image_url",
            image_url: { url: `data:image/png;base64,${image.base64}` },
          })),
          { type: "text", text: preview.prompt },
        ],
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: { name: "brand_dna", strict: true, schema: AI_OUTPUT_SCHEMA },
    },
  };
}

/** The only part of a client the provider uses, so tests can stand in for it without a network. */
export type ChatClient = {
  create: (body: ChatRequest, options?: { signal?: AbortSignal }) => Promise<ChatResponse>;
};

const RETRY_STATUSES = new Set([408, 409, 429, 500, 502, 503, 504]);

/**
 * A chat completions client built on `fetch`. The key goes only into the `authorization` header, and
 * is left out when there is none (a server on this device). Rate limits and server errors are tried
 * once more.
 */
export function createChatClient(
  connection: Pick<StoredAiKey, "key" | "baseUrl">,
  fetchImpl: typeof fetch = (...args) => fetch(...args),
  wait: (ms: number) => Promise<void> = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
): ChatClient {
  const endpoint = chatEndpoint(connection.baseUrl ?? DEFAULT_OPENAI_BASE_URL);
  return {
    async create(body, options = {}) {
      for (let attempt = 0; ; attempt += 1) {
        const response = await fetchImpl(endpoint, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            ...(connection.key ? { authorization: `Bearer ${connection.key}` } : {}),
          },
          body: JSON.stringify(body),
          signal: options.signal,
        });
        if (response.ok) return (await response.json()) as ChatResponse;
        if (attempt === 0 && RETRY_STATUSES.has(response.status)) {
          await wait(500);
          continue;
        }
        throw new ProviderHttpError(response.status);
      }
    },
  };
}

export type OpenAiProviderDeps = {
  loadConnection: () => Promise<StoredAiKey | null>;
  createClient: (connection: StoredAiKey) => ChatClient;
  encode: (image: DnaImage) => string;
  fallback: BrandDnaProvider;
};

/**
 * Brand DNA from any OpenAI-compatible endpoint (a hosted API, or a model server on this device such as
 * Ollama), with the person's own key and model. Like the first AI provider, nothing is sent without a
 * saved connection and a review, and every failure returns the on-device result with a note.
 */
export function createOpenAiProvider(deps: OpenAiProviderDeps): BrandDnaProvider {
  return {
    id: "openai-compatible",
    label: "AI (OpenAI-compatible)",
    description: `A vision model behind any ${OPENAI_API_NAME} endpoint, including a local server. Needs your own endpoint, model and key, kept only in this browser.`,
    local: false,
    mocked: false,
    async analyze(images, options: DnaOptions = {}): Promise<BrandDna> {
      const { signal, onStage } = options;
      const fallBack = async (reason: string) => {
        const result = await deps.fallback.analyze(images, options);
        return { ...result, notes: [`${reason} This is the on-device result instead.`, ...result.notes] };
      };

      const stored = await deps.loadConnection();
      if (!stored?.model || !stored.baseUrl) return fallBack("Add your endpoint, model and key to use AI analysis.");
      if (!stored.key && !isLocalBaseUrl(stored.baseUrl)) return fallBack("Add your API key to use AI analysis.");
      if (!stored.reviewed) return fallBack("Review what will be sent before the first request.");

      try {
        onStage?.("reading");
        const request = buildOpenAiRequest(openAiRequestPreview(images, deps.encode, stored));
        const client = deps.createClient(stored);
        onStage?.("palette");
        const response = await client.create(request, { signal });
        onStage?.("mood");
        const choice = response.choices?.[0];
        if (choice?.message.refusal) throw new Error("The model declined to describe these images.");
        if (choice?.finish_reason === "length") throw new Error("The answer was cut off.");
        if (!choice?.message.content) throw new Error("The model returned no answer.");
        const result = parseAiAnswer(choice.message.content);
        onStage?.("type");
        onStage?.("done");
        return { ...result, notes: [`Described by ${stored.model}.`, ...result.notes] };
      } catch (error) {
        if (signal?.aborted || (error instanceof DOMException && error.name === "AbortError")) {
          throw new DOMException("Aborted", "AbortError");
        }
        return fallBack(describeAiError(error));
      }
    },
  };
}

/** The provider the app registers: the fetch client, the stored connection and the canvas encoder. */
export const openAiProvider = createOpenAiProvider({
  loadConnection: () => loadAiKey(OPENAI_KEY_STORAGE_NAME),
  createClient: createChatClient,
  encode: sampleToPngBase64,
  fallback: localProvider,
});

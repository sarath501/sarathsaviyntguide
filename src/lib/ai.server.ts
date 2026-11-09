import { createOpenAI } from "@ai-sdk/openai";
import { streamText, type ModelMessage } from "ai";

const GATEWAY = "https://ai.gateway.lovable.dev/v1";
const MODEL = "openai/gpt-6-astra";

export class AiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/** Streams a Responses call server-side and returns the final text. */
export async function runAI(system: string, messages: ModelMessage[]): Promise<string> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new AiError("AI is not configured.", 401);
  let runId: string | undefined;
  const provider = createOpenAI({
    baseURL: GATEWAY,
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: async (input, init) => {
      const headers = new Headers(init?.headers);
      if (runId) headers.set("X-Lovable-AIG-Run-ID", runId);
      const res = await fetch(input, { ...init, headers });
      runId ??= res.headers.get("X-Lovable-AIG-Run-ID") ?? undefined;
      if (!res.ok) {
        let msg = `AI request failed (${res.status})`;
        try {
          const body = (await res.clone().json()) as { message?: string; error?: { message?: string } };
          msg = body.message ?? body.error?.message ?? msg;
        } catch {
          /* ignore */
        }
        if (res.status === 402) msg = "AI credits are used up. Please top up in Settings → Plans & credits.";
        if (res.status === 429) msg = "Too many AI requests right now — please wait a moment and try again.";
        throw new AiError(msg, res.status);
      }
      return res;
    },
  });
  let failure: unknown;
  const result = streamText({
    model: provider.responses(MODEL),
    messages: [{ role: "system", content: system }, ...messages],
    maxRetries: 0,
    onError: ({ error }) => {
      failure = error;
    },
    providerOptions: {
      openai: {
        store: false,
        forceReasoning: true,
        reasoningEffort: "low",
        include: ["reasoning.encrypted_content"],
      },
    },
  });
  let text = "";
  try {
    text = await result.text;
  } catch (e) {
    failure ??= e;
  }
  if (failure) {
    console.error("AI error", failure);
    const e = failure as { message?: string };
    throw new Error(e.message ?? "AI request failed");
  }
  return text;
}

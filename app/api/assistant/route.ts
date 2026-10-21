import { configuration, reserve } from "../../lib/assistant/controls";
import { assemble } from "../../lib/assistant/knowledge";
export const runtime = "nodejs";
import {
  classifierInput,
  countInputTokens,
  boundedJson,
} from "../../lib/assistant/provider";
import { pricingPolicy } from "../../lib/assistant/pricing";
export const maxDuration = 30;
const unavailable = () =>
  Response.json(
    {
      error:
        "The AI Assistant is unavailable. Please contact Monetcore directly.",
    },
    { status: 503 },
  );
export async function POST(request: Request) {
  let reservation: Awaited<ReturnType<typeof reserve>> | undefined;
  try {
    const config = configuration();
    if (!config) return unavailable();
    if (
      request.headers.get("origin") !== new URL(request.url).origin ||
      request.headers.get("content-type")?.split(";")[0] !== "application/json"
    )
      return Response.json({ error: "Invalid request." }, { status: 400 });
    const reader = request.body?.getReader();
    if (!reader)
      return Response.json({ error: "Enter a question." }, { status: 400 });
    const chunks: Uint8Array[] = [];
    let size = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.length;
        if (size > 8192) {
          await reader.cancel();
          return Response.json(
            {
              error:
                "Conversation is too long. Please clear it and try a shorter question.",
            },
            { status: 413 },
          );
        }
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }
    let body: unknown;
    try {
      body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    } catch {
      return Response.json({ error: "Invalid request." }, { status: 400 });
    }
    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body) ||
      Object.keys(body).join(",") !== "messages"
    )
      return Response.json({ error: "Invalid conversation." }, { status: 400 });
    const messages = (body as { messages: unknown }).messages;
    // Only visitor text is accepted. Clients cannot forge system/assistant instructions.
    if (
      !Array.isArray(messages) ||
      messages.length < 1 ||
      messages.length > 6 ||
      messages.some(
        (m) => typeof m !== "string" || !m.trim() || m.length > 1000,
      )
    )
      return Response.json(
        { error: "Use up to six questions of at most 1,000 characters each." },
        { status: 400 },
      );
    const countedInput = classifierInput(messages);
    if (Buffer.byteLength(JSON.stringify(countedInput)) > 16000)
      return Response.json(
        { error: "Conversation is too long. Clear it and try again." },
        { status: 413 },
      );
    reservation = await reserve(config, request);
    if (reservation.result !== 1)
      return reservation.result === 2
        ? Response.json(
            {
              error:
                "Usage limit reached. Please contact Monetcore or try later.",
            },
            { status: 429, headers: { "Retry-After": "60" } },
          )
        : unavailable();
    await reservation.check();
    const inputTokens = await countInputTokens(config.key, countedInput);
    if (inputTokens > pricingPolicy.maxInputTokens)
      return Response.json(
        {
          error:
            "Conversation exceeds the input-token limit. Clear it and try a shorter question.",
        },
        { status: 413 },
      );
    // The counter request can take time: recheck stop immediately before inference.
    await reservation.check();
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...countedInput,
        service_tier: pricingPolicy.serviceTier,
        store: false,
        max_output_tokens: pricingPolicy.maxOutputTokens,
      }),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) return unavailable();
    const payload = await boundedJson(response, 65536);
    if (!payload || typeof payload !== "object") return unavailable();
    const data = payload as {
      status?: unknown;
      output?: {
        type?: unknown;
        role?: unknown;
        content?: { type?: unknown; text?: unknown }[];
      }[];
    };
    if (
      data.status !== "completed" ||
      !Array.isArray(data.output) ||
      data.output.length !== 1 ||
      data.output[0].type !== "message" ||
      data.output[0].role !== "assistant" ||
      !Array.isArray(data.output[0].content) ||
      data.output[0].content.length !== 1 ||
      data.output[0].content[0].type !== "output_text" ||
      typeof data.output[0].content[0].text !== "string" ||
      data.output[0].content[0].text.length > 2048
    )
      return unavailable();
    const answers = assemble(JSON.parse(data.output[0].content[0].text));
    return Response.json({
      answers: answers.map(({ text, links }) => ({ text, links })),
    });
  } catch {
    console.error("AI Assistant request unavailable.");
    return unavailable();
  } finally {
    if (reservation?.result === 1)
      try {
        await reservation.release();
      } catch {
        console.error("AI Assistant lease release unavailable.");
      }
  }
}

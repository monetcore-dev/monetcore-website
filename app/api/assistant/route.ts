import { ownerTestAccess, assistantRequestOrigin } from "../../lib/assistant/access";
import { configuration, admit } from "../../lib/assistant/controls";
import { assemble } from "../../lib/assistant/knowledge";
export const runtime = "nodejs";
import {
  classifierInput,
  estimateInputTokens,
  generationRequest,
  boundedJson,
} from "../../lib/assistant/provider";
import { pricingPolicy } from "../../lib/assistant/pricing";
import {
  stagingMeasurement,
  captureUsage,
  reportMeasurement,
  type SafeCategory,
} from "../../lib/assistant/measurements";
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
  const denied = ownerTestAccess(request);
  if (denied) return denied;
  const measurement = stagingMeasurement(request);
  function category(value: SafeCategory) {
    if (measurement) measurement.category = value;
  }
  let admission: ReturnType<typeof admit> | undefined;
  try {
    const config = configuration();
    if (!config) return unavailable();
    if (measurement && !measurement.caseId) {
      category("invalid_test_case");
      return Response.json(
        { error: "Choose a synthetic staging test case." },
        { status: 400 },
      );
    }
    category("invalid_request");
    if (
      request.headers.get("origin") !== assistantRequestOrigin(request) ||
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
    const classifierRequest = classifierInput(messages);
    if (Buffer.byteLength(JSON.stringify(classifierRequest)) > 16000)
      return Response.json(
        { error: "Conversation is too long. Clear it and try again." },
        { status: 413 },
      );
    const inputTokens = estimateInputTokens(classifierRequest);
    if (inputTokens > pricingPolicy.maxInputTokens) {
      category("input_token_limit");
      return Response.json(
        {
          error:
            "Conversation exceeds the input-token limit. Clear it and try a shorter question.",
        },
        { status: 413 },
      );
    }
    category("controls_unavailable");
    admission = admit(config, request, JSON.stringify(classifierRequest));
    if (!admission.allowed) {
      category(admission.category);
      return Response.json({ error: admission.error }, {
        status: admission.status,
        headers: admission.retryAfter ? { "Retry-After": String(admission.retryAfter) } : {},
      });
    }
    // Recheck owner access, cancellation and emergency stop immediately before inference.
    category("emergency_stop");
    admission.check();
    category("provider_unavailable");
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(generationRequest(classifierRequest)),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(15000)]),
    });
    if (!response.ok) return unavailable();
    category("provider_response_invalid");
    const payload = await boundedJson(response, 65536);
    if (!payload || typeof payload !== "object") return unavailable();
    captureUsage(measurement, payload);
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
    if (measurement) {
      measurement.topics = answers.map((a) => a.id);
      category(
        measurement.inputTokens === null || measurement.outputTokens === null
          ? "usage_unavailable"
          : measurement.inputTokens > pricingPolicy.maxInputTokens ||
              measurement.outputTokens > pricingPolicy.maxOutputTokens
            ? "usage_limit_mismatch"
            : "success",
      );
    }
    if (measurement?.category === "usage_limit_mismatch") return unavailable();
    return Response.json({
      answers: answers.map(({ text, links }) => ({ text, links })),
    });
  } catch {
    console.error("AI Assistant request unavailable.");
    return unavailable();
  } finally {
    if (admission?.allowed) admission.release();
    reportMeasurement(measurement);
  }
}

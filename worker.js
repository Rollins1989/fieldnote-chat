import { CONFIG, SYSTEM_PROMPT } from "./backend/config.js";
import { AppError, corsHeaders, errorResponse, json } from "./backend/http.js";
import { validateChatMessage, validateConversation, validateDocument } from "./backend/validation.js";
import { addMessage, checkRateLimit, createConversation, getChunks, getConversation, listConversations, saveChunk, saveDocument } from "./backend/storage.js";
import { chunkText, embed, retrieve } from "./backend/rag.js";

const ALLOWED_ORIGINS = new Set([
  "https://rollins1989.github.io",
  "https://fieldnote-chat.nanotechnology728.workers.dev"
]);

function clientKey(request) {
  return request.headers.get("CF-Connecting-IP") || "anonymous";
}

function route(pathname) {
  if (pathname === "/health") return ["health"];
  if (pathname === "/conversations") return ["conversations"];
  if (pathname === "/documents") return ["documents"];
  if (pathname === "/chat") return ["chat"];
  if (pathname.startsWith("/conversations/")) return ["conversation", pathname.split("/").pop()];
  return ["not-found"];
}

async function streamGroq(env, messages, context, headers, onComplete) {
  const system = SYSTEM_PROMPT + (context
    ? "\n\nRetrieved source material:\n" + context + "\n\nUse source material when relevant. Do not claim it proves something it does not."
    : "\n\nNo source material was retrieved for this request.");

  const upstream = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + env.GROQ_API_KEY },
    body: JSON.stringify({
      model: env.GROQ_MODEL || CONFIG.model,
      messages: [{ role: "system", content: system }, ...messages],
      max_tokens: 1200,
      temperature: 0.2,
      stream: true
    })
  });

  if (!upstream.ok || !upstream.body) throw new AppError("LLM_UNAVAILABLE", "The AI provider is temporarily unavailable.", 503);

  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";
  let fullReply = "";

  const stream = new ReadableStream({
    async pull(controller) {
      try {
        const { value, done } = await reader.read();
        if (done) {
          await onComplete(fullReply);
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
          return;
        }
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6);
          if (payload === "[DONE]") continue;
          try {
            const parsed = JSON.parse(payload);
            const delta = parsed.choices?.[0]?.delta?.content || "";
            if (!delta) continue;
            fullReply += delta;
            controller.enqueue(encoder.encode("data: " + JSON.stringify({ type: "delta", text: delta }) + "\n\n"));
          } catch {}
        }
      } catch (error) {
        controller.error(error);
      }
    },
    cancel() { reader.cancel(); }
  });

  return new Response(stream, {
    headers: { ...headers, "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache", Connection: "keep-alive" }
  });
}

export default {
  async fetch(request, env) {
    const headers = corsHeaders(request, ALLOWED_ORIGINS);
    const origin = request.headers.get("Origin");
    if (origin && !ALLOWED_ORIGINS.has(origin)) return new Response("Forbidden origin", { status: 403, headers });
    const requestId = crypto.randomUUID();
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });

    try {
      const [name, value] = route(new URL(request.url).pathname);

      if (request.method === "GET" && name === "health") {
        return json({ status: "ok", service: "fieldnote-api", version: "2.1.0", request_id: requestId }, 200, headers);
      }

      if (request.method === "GET" && name === "conversations") {
        return json({ conversations: await listConversations(env) }, 200, headers);
      }

      if (request.method === "GET" && name === "conversation") {
        const data = await getConversation(env, value);
        if (!data.conversation) throw new AppError("NOT_FOUND", "Conversation not found.", 404);
        return json(data, 200, headers);
      }

      if (request.method === "POST" && name === "conversations") {
        const body = await request.json();
        const error = validateConversation(body);
        if (error) throw new AppError("VALIDATION_ERROR", error, 400);
        const id = crypto.randomUUID().replaceAll("-", "");
        await createConversation(env, id, body.title?.trim() || "New conversation");
        return json({ id }, 201, headers);
      }

      if (request.method === "POST" && name === "documents") {
        const body = await request.json();
        const error = validateDocument(body);
        if (error) throw new AppError("VALIDATION_ERROR", error, 400);
        if (!env.AI || !env.DB) throw new AppError("FEATURE_UNAVAILABLE", "Document retrieval requires D1 and Workers AI.", 503);
        const conversation = await getConversation(env, body.conversation_id);
        if (!conversation.conversation) throw new AppError("NOT_FOUND", "Conversation not found.", 404);

        const documentId = crypto.randomUUID().replaceAll("-", "");
        await saveDocument(env, documentId, body.conversation_id, body.title.trim());
        const chunks = chunkText(body.text);
        for (let i = 0; i < chunks.length; i++) {
          const vector = await embed(env, chunks[i]);
          if (vector) await saveChunk(env, documentId, i, chunks[i], vector);
        }
        return json({ id: documentId, chunks: chunks.length }, 201, headers);
      }

      if (request.method === "POST" && name === "chat") {
        const body = await request.json();
        const error = validateChatMessage(body);
        if (error) throw new AppError("VALIDATION_ERROR", error, 400);
        if (!env.GROQ_API_KEY) throw new AppError("CONFIGURATION_ERROR", "LLM provider is not configured.", 503);

        const rate = await checkRateLimit(env, clientKey(request), CONFIG.rateLimitPerMinute);
        if (!rate.allowed) throw new AppError("RATE_LIMITED", "Too many requests. Try again in a minute.", 429);

        const conversation = await getConversation(env, body.conversation_id);
        if (env.DB && !conversation.conversation) throw new AppError("NOT_FOUND", "Conversation not found.", 404);

        await addMessage(env, body.conversation_id, "user", body.message.trim());

        const recent = (conversation.messages || [])
          .slice(-CONFIG.maxMessages)
          .map(({ role, content }) => ({ role, content }));
        recent.push({ role: "user", content: body.message.trim() });

        const chunks = await getChunks(env, body.conversation_id);
        const relevant = chunks.length && env.AI ? await retrieve(env, body.message.trim(), chunks) : [];
        const context = relevant.map((item, i) => "[Source " + (i + 1) + ": " + item.title + "]\n" + item.content).join("\n\n");

        const response = await streamGroq(env, recent, context, headers, async reply => {
          await addMessage(env, body.conversation_id, "assistant", reply);
        });

        if (!relevant.length) return response;

        const encoder = new TextEncoder();
        const source = response.body;
        const stream = new ReadableStream({
          async start(controller) {
            try {
              const reader = source.getReader();
              while (true) {
                const part = await reader.read();
                if (part.done) break;
                controller.enqueue(part.value);
              }
              controller.enqueue(encoder.encode("data: " + JSON.stringify({
                type: "citations",
                citations: relevant.map(x => ({ title: x.title, score: Number(x.score.toFixed(3)) }))
              }) + "\n\n"));
              controller.close();
            } catch (error) {
              controller.error(error);
            }
          }
        });
        return new Response(stream, { headers: response.headers });
      }

      throw new AppError("NOT_FOUND", "Route not found.", 404);
    } catch (error) {
      return errorResponse(error, requestId, headers);
    }
  }
};

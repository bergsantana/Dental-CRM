import Fastify from "fastify";
import { z } from "zod";
import { config } from "./config.js";
import { retrieve } from "./retrieve/retriever.js";
import { rerank } from "./retrieve/reranker.js";
import { chatStream } from "./generate/ollamaChat.js";
import { SYSTEM_PROMPT, buildUserMessage } from "./generate/prompt.js";
import { ingest } from "./ingest/ingest.js";
import { evaluateTriad } from "./metrics/evaluate.js";

const app = Fastify({ logger: true });

const ChatBody = z.object({
  patientId: z.string().min(1),
  question: z.string().min(1),
  k: z.number().int().positive().optional(),
  rerank: z.boolean().optional(),
});

const IngestBody = z.object({
  patientId: z.string().min(1),
  dir: z.string().optional(),
  file: z.string().optional(),
});

app.get("/v1/health", async () => ({
  ok: true,
  ollama: config.ollamaUrl,
  chroma: config.chromaUrl,
  model: config.llmModel,
}));

app.post("/v1/ingest", async (req, reply) => {
  const parsed = IngestBody.safeParse(req.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: parsed.error.flatten() });
  }
  const result = await ingest({
    patient: parsed.data.patientId,
    dir: parsed.data.dir,
    file: parsed.data.file,
  });
  return result;
});

/**
 * POST /chat — streams the answer as Server-Sent Events.
 * Each event has `data: <token>`; a final `event: done` event closes.
 */
app.post("/v1/chat", async (req, reply) => {
  const parsed = ChatBody.safeParse(req.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: parsed.error.flatten() });
  }
  const { patientId, question } = parsed.data;
  const k = parsed.data.k ?? config.topK;
  const useRerank = parsed.data.rerank ?? config.rerank;

  let hits = await retrieve({ patientId, question, k });
  if (useRerank) hits = await rerank(question, hits, 3);

  reply.raw.writeHead(200, {
    "content-type": "text/event-stream",
    "cache-control": "no-cache",
    connection: "keep-alive",
  });

  const sources = hits.map((h) => ({
    source: h.metadata.source,
    index: h.metadata.recordIndex ?? h.metadata.chunkIndex ?? 0,
    distance: h.distance,
  }));
  reply.raw.write(`event: sources\ndata: ${JSON.stringify(sources)}\n\n`);

  const messages = [
    { role: "system" as const, content: SYSTEM_PROMPT },
    { role: "user" as const, content: buildUserMessage(question, hits, patientId) },
  ];

  let answer = "";
  try {
    for await (const piece of chatStream(messages)) {
      answer += piece;
      reply.raw.write(`data: ${JSON.stringify(piece)}\n\n`);
    }

    // Evaluate the RAG-Triad on the completed answer. Failures here must
    // not break the response — we still emit `done` so the client closes.
    try {
      const metrics = await evaluateTriad({ question, answer, hits });
      reply.raw.write(`event: metrics\ndata: ${JSON.stringify(metrics)}\n\n`);
    } catch (err) {
      app.log.warn({ err }, "metrics evaluation failed");
    }

    reply.raw.write("event: done\ndata: {}\n\n");
  } catch (err) {
    reply.raw.write(`event: error\ndata: ${JSON.stringify({ message: String(err) })}\n\n`);
  } finally {
    reply.raw.end();
  }
});

app.listen({ port: config.port, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});

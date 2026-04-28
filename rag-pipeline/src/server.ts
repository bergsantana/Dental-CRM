import Fastify, { type FastifyReply, type FastifyRequest } from "fastify";
import cors from "@fastify/cors";
import { z } from "zod";
import { config } from "./config.js";
import { retrieve } from "./retrieve/retriever.js";
import { rerank } from "./retrieve/reranker.js";
import { chatStream } from "./generate/ollamaChat.js";
import { SYSTEM_PROMPT, buildUserMessage } from "./generate/prompt.js";
import { ingest } from "./ingest/ingest.js";
import { deleteByPatient, listPatientSources } from "./store/chromaClient.js";
import { evaluateTriad } from "./metrics/evaluate.js";

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: config.allowedOrigin === "*" ? true : config.allowedOrigin.split(","),
  methods: ["GET", "POST", "DELETE", "OPTIONS"],
});

/**
 * Bearer-token auth. Skipped for health probes so container orchestrators
 * can check liveness without a secret. When `RAG_AUTH_TOKEN` is empty the
 * hook is a no-op (development convenience).
 */
app.addHook("onRequest", async (req, reply) => {
  if (!config.authToken) return;
  if (req.url === "/health" || req.url === "/v1/health") return;
  const header = req.headers["authorization"];
  if (typeof header !== "string" || header !== `Bearer ${config.authToken}`) {
    reply.code(401).send({ error: "unauthorized" });
  }
});

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
  files: z
    .array(z.object({ path: z.string().min(1), mime: z.string().optional() }))
    .optional(),
});

const healthHandler = async () => ({
  ok: true,
  ollama: config.ollamaUrl,
  chroma: config.chromaUrl,
  model: config.llmModel,
});

app.get("/health", healthHandler);
app.get("/v1/health", healthHandler);

async function ingestHandler(req: FastifyRequest, reply: FastifyReply) {
  const parsed = IngestBody.safeParse(req.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: parsed.error.flatten() });
  }
  return ingest({
    patient: parsed.data.patientId,
    dir: parsed.data.dir,
    file: parsed.data.file,
    files: parsed.data.files,
  });
}

app.post("/ingest", ingestHandler);
app.post("/v1/ingest", ingestHandler);

async function chatHandler(req: FastifyRequest, reply: FastifyReply) {
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

  try {
    let assistantText = "";
    for await (const piece of chatStream(messages)) {
      assistantText += piece;
      reply.raw.write(`data: ${JSON.stringify(piece)}\n\n`);
    }

    if (config.metricsEnabled && assistantText.trim().length > 0) {
      try {
        const metrics = await evaluateTriad({ question, answer: assistantText, hits });
        reply.raw.write(`event: metrics\ndata: ${JSON.stringify(metrics)}\n\n`);
      } catch (metricErr) {
        // Metrics must never break the chat response.
        app.log.warn({ err: metricErr }, "metrics evaluation failed");
        reply.raw.write(
          `event: metrics\ndata: ${JSON.stringify({
            contextRelevance: null,
            groundedness: null,
            answerRelevance: null,
            perChunk: [],
            error: String(metricErr),
          })}\n\n`,
        );
      }
    }

    reply.raw.write("event: done\ndata: {}\n\n");
  } catch (err) {
    reply.raw.write(`event: error\ndata: ${JSON.stringify({ message: String(err) })}\n\n`);
  } finally {
    reply.raw.end();
  }
}

app.post("/chat", chatHandler);
app.post("/v1/chat", chatHandler);

app.get<{ Params: { id: string } }>("/v1/patients/:id/sources", async (req) => {
  return { sources: await listPatientSources(req.params.id) };
});

app.delete<{ Params: { id: string }; Querystring: { source?: string } }>(
  "/v1/patients/:id/sources",
  async (req, reply) => {
    await deleteByPatient(req.params.id, req.query.source);
    return reply.code(204).send();
  },
);

app.listen({ port: config.port, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});

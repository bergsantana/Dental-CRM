import "dotenv/config";

export const config = {
  ollamaUrl: process.env.OLLAMA_URL ?? "http://ollama:11434",
  chromaUrl: process.env.CHROMA_URL ?? "http://chroma:8000",
  llmModel: process.env.LLM_MODEL ?? "phi3:mini",
  embedModel: process.env.EMBED_MODEL ?? "nomic-embed-text",
  port: Number.parseInt(process.env.PORT ?? "3000", 10),
  topK: Number.parseInt(process.env.TOP_K ?? "8", 10),
  rerank: (process.env.RERANK ?? "false").toLowerCase() === "true",
  collection: "patients",
};

export type Config = typeof config;

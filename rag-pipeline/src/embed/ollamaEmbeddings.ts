import { config } from "../config.js";

interface OllamaEmbedResponse {
  embedding: number[];
}

/**
 * Generate embeddings via Ollama's `/api/embeddings` endpoint.
 * Ollama exposes one-text-per-call; we batch sequentially with a small
 * concurrency pool to avoid overloading the model server.
 */
export async function embed(texts: string[]): Promise<number[][]> {
  const out: number[][] = new Array(texts.length);
  const concurrency = 4;
  let next = 0;

  async function worker() {
    while (true) {
      const i = next++;
      if (i >= texts.length) return;
      out[i] = await embedOne(texts[i]!);
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  return out;
}

async function embedOne(text: string, attempt = 0): Promise<number[]> {
  try {
    const res = await fetch(`${config.ollamaUrl}/api/embeddings`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ model: config.embedModel, prompt: text }),
    });
    if (!res.ok) {
      throw new Error(`Ollama embeddings ${res.status}: ${await res.text()}`);
    }
    const json = (await res.json()) as OllamaEmbedResponse;
    if (!Array.isArray(json.embedding)) {
      throw new Error("Ollama embeddings: missing 'embedding' in response");
    }
    return json.embedding;
  } catch (err) {
    if (attempt >= 2) throw err;
    await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    return embedOne(text, attempt + 1);
  }
}

import type { QueryHit } from "../store/chromaClient.js";

/**
 * Optional re-ranking with a cross-encoder. Lazily loaded so the model is
 * only downloaded when actually used. Returns the top `topN` hits scored
 * by relevance to the query.
 */
let _pipeline: unknown = null;

async function getReranker() {
  if (_pipeline) return _pipeline;
  // Dynamic import keeps the dep optional at startup.
  const { pipeline } = await import("@xenova/transformers");
  _pipeline = await pipeline("text-classification", "Xenova/bge-reranker-base", {
    quantized: true,
  });
  return _pipeline;
}

export async function rerank(query: string, hits: QueryHit[], topN = 3): Promise<QueryHit[]> {
  if (hits.length === 0) return hits;
  const ranker = (await getReranker()) as (
    pairs: { text: string; text_pair: string }[],
  ) => Promise<{ score: number }[] | { score: number }>;

  const scored: { hit: QueryHit; score: number }[] = [];
  for (const hit of hits) {
    const out = await ranker([{ text: query, text_pair: hit.document }]);
    const score = Array.isArray(out) ? out[0]!.score : out.score;
    scored.push({ hit, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topN).map((s) => s.hit);
}

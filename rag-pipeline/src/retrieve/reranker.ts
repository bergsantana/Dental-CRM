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
  const scores = await scorePairs(
    query,
    hits.map((h) => h.document),
  );
  const scored = hits.map((hit, i) => ({ hit, score: scores[i] ?? 0 }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topN).map((s) => s.hit);
}

/**
 * Score (query, doc) pairs with the cross-encoder, returning the raw
 * relevance score for each doc in the same order. Used by the metrics
 * evaluator for context relevance.
 *
 * The transformers.js text-classification pipeline expects paired input as
 * `pipe(text, { text_pair })` — passing `[{ text, text_pair }]` makes the
 * tokenizer treat the object as a string and fail with `text.split is not
 * a function`. We call it once per doc with a string `query` and a single
 * `text_pair` to stay on the supported path.
 */
export async function scorePairs(query: string, docs: string[]): Promise<number[]> {
  if (docs.length === 0) return [];
  const ranker = (await getReranker()) as (
    text: string,
    options?: { text_pair?: string },
  ) => Promise<{ score: number }[] | { score: number }>;

  const scores: number[] = [];
  for (const doc of docs) {
    const safeDoc = typeof doc === "string" && doc.length > 0 ? doc : " ";
    const out = await ranker(query, { text_pair: safeDoc });
    const score = Array.isArray(out) ? out[0]!.score : out.score;
    scores.push(score);
  }
  return scores;
}

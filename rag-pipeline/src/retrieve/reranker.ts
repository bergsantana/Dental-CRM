import type { QueryHit } from "../store/chromaClient.js";
import { sigmoid } from "../metrics/math.js";

/**
 * Optional re-ranking with a cross-encoder. Lazily loaded so the model is
 * only downloaded when actually used. Returns the top `topN` hits scored
 * by relevance to the query.
 *
 * NOTE: We cannot use the `text-classification` pipeline because it does
 * not support paired inputs (`text_pair`) — its `_call` forwards `texts`
 * straight to the tokenizer with no per-element unpacking. We instead
 * load the tokenizer + model manually so we can pass the query/passage
 * pair via the tokenizer's `text_pair` option.
 */
type Tokenizer = (
  text: string | string[],
  options: {
    text_pair?: string | string[];
    padding?: boolean;
    truncation?: boolean;
  },
) => unknown;

interface SequenceClassifierOutput {
  logits: { data: Float32Array | number[]; dims: number[] };
}

type SequenceClassifier = (inputs: unknown) => Promise<SequenceClassifierOutput>;

let _modelPromise: Promise<{ tokenizer: Tokenizer; model: SequenceClassifier }> | null = null;

async function getCrossEncoder() {
  if (_modelPromise) return _modelPromise;
  _modelPromise = (async () => {
    const tx = (await import("@xenova/transformers")) as {
      AutoTokenizer: { from_pretrained: (m: string) => Promise<Tokenizer> };
      AutoModelForSequenceClassification: {
        from_pretrained: (
          m: string,
          opts?: { quantized?: boolean },
        ) => Promise<SequenceClassifier>;
      };
    };
    const [tokenizer, model] = await Promise.all([
      tx.AutoTokenizer.from_pretrained("Xenova/bge-reranker-base"),
      tx.AutoModelForSequenceClassification.from_pretrained("Xenova/bge-reranker-base", {
        quantized: true,
      }),
    ]);
    return { tokenizer, model };
  })();
  return _modelPromise;
}

/**
 * Score each (query, passage) pair with the cross-encoder. The raw model
 * output is a logit; we squash it through a sigmoid so callers always get
 * a comparable [0, 1] relevance score.
 */
export async function scorePairs(query: string, passages: string[]): Promise<number[]> {
  if (passages.length === 0) return [];
  const { tokenizer, model } = await getCrossEncoder();

  const queries = new Array(passages.length).fill(query);
  const inputs = tokenizer(queries, {
    text_pair: passages,
    padding: true,
    truncation: true,
  });
  const { logits } = await model(inputs);

  // bge-reranker is a single-label classifier: logits is shape [N, 1].
  const data = Array.from(logits.data as ArrayLike<number>);
  const stride = data.length / passages.length;
  const out: number[] = new Array(passages.length);
  for (let i = 0; i < passages.length; i++) {
    const raw = data[Math.floor(i * stride)] ?? 0;
    out[i] = raw >= 0 && raw <= 1 ? raw : sigmoid(raw);
  }
  return out;
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

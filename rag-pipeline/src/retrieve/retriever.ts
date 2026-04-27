import { embed } from "../embed/ollamaEmbeddings.js";
import { queryByEmbedding, type QueryHit } from "../store/chromaClient.js";

export interface RetrieveOptions {
  patientId: string;
  question: string;
  k?: number;
}

export async function retrieve(opts: RetrieveOptions): Promise<QueryHit[]> {
  const k = opts.k ?? 8;
  const [vec] = await embed([opts.question]);
  if (!vec) return [];
  return queryByEmbedding(vec, k, { patientId: opts.patientId });
}

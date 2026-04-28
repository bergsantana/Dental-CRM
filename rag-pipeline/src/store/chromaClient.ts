import { ChromaClient, type Collection, type IEmbeddingFunction } from "chromadb";
import { config } from "../config.js";

/**
 * We pre-compute embeddings via Ollama, so Chroma's embedding function is a
 * no-op. It exists only because the client requires one for queries that
 * pass raw text — we never use that path.
 */
class NoopEmbeddingFunction implements IEmbeddingFunction {
  async generate(_texts: string[]): Promise<number[][]> {
    throw new Error(
      "NoopEmbeddingFunction invoked: pass `queryEmbeddings` instead of `queryTexts`.",
    );
  }
}

let _client: ChromaClient | null = null;
let _collection: Collection | null = null;

function getClient(): ChromaClient {
  if (!_client) _client = new ChromaClient({ path: config.chromaUrl });
  return _client;
}

export async function getCollection(): Promise<Collection> {
  if (_collection) return _collection;
  const client = getClient();
  _collection = await client.getOrCreateCollection({
    name: config.collection,
    embeddingFunction: new NoopEmbeddingFunction(),
    metadata: { "hnsw:space": "cosine" },
  });
  return _collection;
}

export interface UpsertItem {
  id: string;
  embedding: number[];
  document: string;
  metadata: Record<string, string | number | boolean>;
}

export async function upsert(items: UpsertItem[]): Promise<void> {
  if (items.length === 0) return;
  const collection = await getCollection();
  await collection.upsert({
    ids: items.map((i) => i.id),
    embeddings: items.map((i) => i.embedding),
    documents: items.map((i) => i.document),
    metadatas: items.map((i) => i.metadata),
  });
}

export interface QueryHit {
  id: string;
  document: string;
  metadata: Record<string, string | number | boolean>;
  distance: number;
}

export async function queryByEmbedding(
  embedding: number[],
  k: number,
  where: Record<string, string | number | boolean>,
): Promise<QueryHit[]> {
  const collection = await getCollection();
  const res = await collection.query({
    queryEmbeddings: [embedding],
    nResults: k,
    where,
  });
  const ids = res.ids[0] ?? [];
  const docs = res.documents[0] ?? [];
  const metas = res.metadatas[0] ?? [];
  const dists = res.distances?.[0] ?? [];
  const hits: QueryHit[] = [];
  for (let i = 0; i < ids.length; i++) {
    hits.push({
      id: ids[i]!,
      document: docs[i] ?? "",
      metadata: (metas[i] ?? {}) as Record<string, string | number | boolean>,
      distance: dists[i] ?? 0,
    });
  }
  return hits;
}

export async function deleteByPatient(
  patientId: string,
  source?: string,
): Promise<void> {
  const collection = await getCollection();
  const where: Record<string, string> = { patientId };
  if (source) where.source = source;
  await collection.delete({ where });
}

export async function listPatientSources(patientId: string): Promise<string[]> {
  const collection = await getCollection();
  const res = await collection.get({ where: { patientId }, include: ["metadatas"] as never });
  const metas = (res.metadatas ?? []) as Array<Record<string, unknown> | null>;
  const seen = new Set<string>();
  for (const m of metas) {
    const s = m?.source;
    if (typeof s === "string") seen.add(s);
  }
  return Array.from(seen);
}

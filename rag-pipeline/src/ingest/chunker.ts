import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import type { LoadedDoc } from "./loaders.js";

export interface Chunk {
  text: string;
  metadata: Record<string, string | number | boolean>;
}

/**
 * Chunking strategy:
 *  - Free-form prose (PDF/TXT/HTML): 500 chars / 75 overlap (~15%) using
 *    RecursiveCharacterTextSplitter. 500 chars ≈ 1–2 short paragraphs of
 *    clinical notes — large enough to keep context, small enough that
 *    top-k retrieval stays focused. 15% overlap preserves sentence
 *    continuity across boundaries.
 *  - Structured JSON records: one record = one chunk. Records are already
 *    semantically atomic (one anamnesis answer, one appointment note), so
 *    splitting them further would lose meaning.
 */
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 500,
  chunkOverlap: 75,
  separators: ["\n\n", "\n", ". ", " ", ""],
});

export async function chunkDocument(doc: LoadedDoc): Promise<Chunk[]> {
  // JSON records: 1 chunk each, no splitting.
  if (doc.metadata.type === "json") {
    return [
      {
        text: doc.text,
        metadata: cleanMeta({ ...doc.metadata, chunkIndex: 0 }),
      },
    ];
  }

  // Prose: recursive split.
  const pieces = await splitter.splitText(doc.text);
  return pieces.map((text, i) => ({
    text,
    metadata: cleanMeta({ ...doc.metadata, chunkIndex: i }),
  }));
}

/** Chroma metadata accepts only string/number/boolean. Drop undefined. */
function cleanMeta(
  m: Record<string, string | number | boolean | undefined>,
): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(m)) if (v !== undefined) out[k] = v;
  return out;
}

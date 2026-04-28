import { createHash } from "node:crypto";
import { parseArgs } from "node:util";
import { loadDirectory, loadFile } from "./loaders.js";
import { chunkDocument } from "./chunker.js";
import { embed } from "../embed/ollamaEmbeddings.js";
import { upsert, type UpsertItem } from "../store/chromaClient.js";
import type { LoadedDoc } from "./loaders.js";
import { promises as fs } from "node:fs";

interface IngestArgs {
  dir?: string;
  file?: string;
  patient: string;
}

function parseCli(): IngestArgs {
  const { values } = parseArgs({
    options: {
      dir: { type: "string" },
      file: { type: "string" },
      patient: { type: "string" },
    },
    allowPositionals: false,
  });
  if (!values.patient) {
    throw new Error("--patient <id> is required");
  }
  if (!values.dir && !values.file) {
    throw new Error("Provide --dir <path> or --file <path>");
  }
  return values as IngestArgs;
}

function chunkId(patientId: string, source: string, index: number): string {
  // Deterministic id → upserts replace existing chunks instead of duplicating.
  const h = createHash("sha1").update(`${patientId}|${source}|${index}`).digest("hex").slice(0, 16);
  return `${patientId}-${h}`;
}

export async function ingest(args: IngestArgs): Promise<{ docs: number; chunks: number }> {
  let docs: LoadedDoc[];
  if (args.dir) {
    const stat = await fs.stat(args.dir);
    if (!stat.isDirectory()) throw new Error(`Not a directory: ${args.dir}`);
    docs = await loadDirectory(args.dir);
  } else {
    docs = await loadFile(args.file!);
  }
  if (docs.length === 0) {
    console.log("No supported documents found.");
    return { docs: 0, chunks: 0 };
  }

  // Chunk every doc, tagging with patientId.
  const items: { text: string; metadata: Record<string, string | number | boolean> }[] = [];
  for (const doc of docs) {
    const chunks = await chunkDocument(doc);
    for (const c of chunks) {
      items.push({
        text: c.text,
        metadata: { ...c.metadata, patientId: args.patient },
      });
    }
  }

  console.log(`Embedding ${items.length} chunks from ${docs.length} document(s)...`);
  const vectors = await embed(items.map((i) => i.text));

  const upsertItems: UpsertItem[] = items.map((item, i) => {
    const source = String(item.metadata.source ?? "unknown");
    const idx = Number(item.metadata.chunkIndex ?? i);
    const recIdx = item.metadata.recordIndex;
    const sourceKey = recIdx !== undefined ? `${source}#${recIdx}` : source;
    return {
      id: chunkId(args.patient, sourceKey, idx),
      embedding: vectors[i]!,
      document: item.text,
      metadata: item.metadata,
    };
  });

  await upsert(upsertItems);
  console.log(`Ingested ${upsertItems.length} chunks across ${docs.length} document(s) for patient ${args.patient}.`);
  return { docs: docs.length, chunks: upsertItems.length };
}

// Run as CLI when executed directly.
const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  ingest(parseCli()).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

import { promises as fs } from "node:fs";
import path from "node:path";
import * as cheerio from "cheerio";
// pdf-parse ships CJS; default-import via interop
import pdfParse from "pdf-parse";

export interface LoadedDoc {
  /** Full text content (for free-form formats) or stringified record. */
  text: string;
  /** Per-document metadata. `recordIndex` is set for JSON array elements. */
  metadata: {
    source: string;
    type: "pdf" | "txt" | "html" | "json";
    recordIndex?: number;
    [key: string]: string | number | boolean | undefined;
  };
}

async function loadPdf(file: string): Promise<LoadedDoc[]> {
  const buf = await fs.readFile(file);
  const parsed = await pdfParse(buf);
  return [{ text: parsed.text, metadata: { source: path.basename(file), type: "pdf" } }];
}

async function loadTxt(file: string): Promise<LoadedDoc[]> {
  const text = await fs.readFile(file, "utf8");
  return [{ text, metadata: { source: path.basename(file), type: "txt" } }];
}

async function loadHtml(file: string): Promise<LoadedDoc[]> {
  const html = await fs.readFile(file, "utf8");
  const $ = cheerio.load(html);
  $("script, style, noscript").remove();
  const text = $("body").text().replace(/\s+/g, " ").trim();
  return [{ text, metadata: { source: path.basename(file), type: "html" } }];
}

/**
 * Treat each top-level array element as one record (one chunk).
 * If the JSON is a plain object, treat it as a single record.
 *
 * Each record is rendered as labeled "key: value" lines so the LLM has
 * structured context to read.
 */
async function loadJson(file: string): Promise<LoadedDoc[]> {
  const raw = await fs.readFile(file, "utf8");
  const parsed = JSON.parse(raw) as unknown;
  const records = Array.isArray(parsed) ? parsed : [parsed];
  return records.map((rec, i) => ({
    text: renderRecord(rec),
    metadata: {
      source: path.basename(file),
      type: "json" as const,
      recordIndex: i,
    },
  }));
}

function renderRecord(rec: unknown): string {
  if (rec === null || typeof rec !== "object") return String(rec);
  return Object.entries(rec as Record<string, unknown>)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : String(v)}`)
    .join("\n");
}

const LOADERS: Record<string, (file: string) => Promise<LoadedDoc[]>> = {
  ".pdf": loadPdf,
  ".txt": loadTxt,
  ".md": loadTxt,
  ".html": loadHtml,
  ".htm": loadHtml,
  ".json": loadJson,
};

export async function loadFile(file: string): Promise<LoadedDoc[]> {
  const ext = path.extname(file).toLowerCase();
  const loader = LOADERS[ext];
  if (!loader) throw new Error(`Unsupported file type: ${ext} (${file})`);
  return loader(file);
}

export async function loadDirectory(dir: string): Promise<LoadedDoc[]> {
  const out: LoadedDoc[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await loadDirectory(full)));
      continue;
    }
    const ext = path.extname(entry.name).toLowerCase();
    if (!LOADERS[ext]) continue;
    out.push(...(await loadFile(full)));
  }
  return out;
}

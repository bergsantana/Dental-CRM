import type { QueryHit } from "../store/chromaClient.js";

export const SYSTEM_PROMPT = `You are a clinical assistant for a dental CRM. Your job is to answer questions about a single patient using ONLY the CONTEXT block provided below.

Rules:
- Use ONLY information present in the CONTEXT. If the answer is not contained there, reply exactly: "I don't know based on the available records."
- Cite every factual claim with the source tag in square brackets, e.g. [source:anamnesis.txt#2].
- Do not provide medical advice or diagnoses. You may summarize what is recorded; if asked for advice, recommend consulting the responsible dentist.
- Answer in the same language as the question.
- Be concise.`;

export function buildContextBlock(hits: QueryHit[]): string {
  if (hits.length === 0) return "(no relevant records found)";
  return hits
    .map((h, i) => {
      const source = String(h.metadata.source ?? "unknown");
      const idx = h.metadata.recordIndex ?? h.metadata.chunkIndex ?? 0;
      return `[${i + 1}] source:${source}#${idx}\n${h.document}`;
    })
    .join("\n\n");
}

export function buildUserMessage(question: string, hits: QueryHit[], patientId: string): string {
  return `PATIENT_ID: ${patientId}

CONTEXT:
${buildContextBlock(hits)}

QUESTION: ${question}`;
}

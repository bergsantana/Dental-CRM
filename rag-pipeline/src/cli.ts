import readline from "node:readline";
import { parseArgs } from "node:util";
import { retrieve } from "./retrieve/retriever.js";
import { rerank } from "./retrieve/reranker.js";
import { chatStream } from "./generate/ollamaChat.js";
import { SYSTEM_PROMPT, buildUserMessage } from "./generate/prompt.js";
import { config } from "./config.js";

interface CliArgs {
  patient: string;
  rerank: boolean;
  k: number;
}

function parseCli(): CliArgs {
  const { values } = parseArgs({
    options: {
      patient: { type: "string" },
      rerank: { type: "boolean", default: false },
      k: { type: "string" },
    },
  });
  if (!values.patient) throw new Error("--patient <id> is required");
  return {
    patient: values.patient,
    rerank: Boolean(values.rerank) || config.rerank,
    k: values.k ? Number.parseInt(values.k, 10) : config.topK,
  };
}

async function answer(question: string, args: CliArgs): Promise<void> {
  let hits = await retrieve({ patientId: args.patient, question, k: args.k });
  if (args.rerank) hits = await rerank(question, hits, 3);

  const messages = [
    { role: "system" as const, content: SYSTEM_PROMPT },
    { role: "user" as const, content: buildUserMessage(question, hits, args.patient) },
  ];

  process.stdout.write("\nassistant> ");
  for await (const piece of chatStream(messages)) {
    process.stdout.write(piece);
  }
  process.stdout.write("\n\n");
  if (hits.length > 0) {
    const refs = hits
      .map((h) => `${h.metadata.source}#${h.metadata.recordIndex ?? h.metadata.chunkIndex ?? 0}`)
      .join(", ");
    console.log(`(retrieved: ${refs})\n`);
  }
}

async function main() {
  const args = parseCli();
  console.log(`Patient ${args.patient} | model=${config.llmModel} | k=${args.k} | rerank=${args.rerank}`);
  console.log("Type a question (Ctrl+C to exit).\n");

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.setPrompt("you> ");
  rl.prompt();

  rl.on("line", async (line) => {
    const q = line.trim();
    if (!q) return rl.prompt();
    try {
      await answer(q, args);
    } catch (err) {
      console.error("Error:", err);
    }
    rl.prompt();
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

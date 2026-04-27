import { config } from "../config.js";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OllamaChatChunk {
  message?: { role: string; content: string };
  done: boolean;
}

/**
 * Streams tokens from Ollama's `/api/chat` endpoint.
 * Yields partial content strings as they arrive.
 */
export async function* chatStream(messages: ChatMessage[]): AsyncGenerator<string> {
  const res = await fetch(`${config.ollamaUrl}/api/chat`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ model: config.llmModel, messages, stream: true }),
  });
  if (!res.ok || !res.body) {
    throw new Error(`Ollama chat ${res.status}: ${await res.text()}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let nl: number;
    while ((nl = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);
      if (!line) continue;
      try {
        const json = JSON.parse(line) as OllamaChatChunk;
        const piece = json.message?.content;
        if (piece) yield piece;
      } catch {
        // ignore malformed lines
      }
    }
  }
}

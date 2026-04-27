import { Source } from "@/@types/query-hit";
import { useState } from "react";
import { CreateChatRequest } from "./types/create-chat-request";

export function useChatStream() {
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (
    params: CreateChatRequest,
    onToken: (token: string) => void,
    onSources: (sources: Source[]) => void,
  ) => {
    setIsLoading(true);

    try {
      // Usamos fetch aqui por causa do suporte nativo a Streams
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/chat`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params),
        },
      );

      const reader = response.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("event: sources")) {
            const dataStr = line.split("data: ")[1];
            if (dataStr) onSources(JSON.parse(dataStr));
          } else if (line.startsWith("data: ")) {
            const token = line.replace("data: ", "").replace(/"/g, "");
            onToken(token);
          }
        }
      }
    } catch (error) {
      console.error("Erro no Chat Stream:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return { sendMessage, isLoading };
}

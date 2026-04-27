"use client";

import { Source } from "@/@types/query-hit";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
}

export default function PatientDetail() {
  const { id } = useParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll para o fim do chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    // Placeholder para a resposta da IA que será preenchida pelo stream
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const response = await fetch("http://localhost:3000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId: id, question: input, k: 8 }),
      });

      if (!response.body) return;
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("event: sources")) {
            const data = JSON.parse(line.replace("event: sources\ndata: ", ""));
            updateLastMessage(undefined, data);
          } else if (line.startsWith("data: ")) {
            const token = line.replace("data: ", "").replace(/"/g, "");
            updateLastMessage(token);
          }
        }
      }
    } catch (error) {
      console.error("Erro no stream:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateLastMessage = (content?: string, sources?: Source[]) => {
    setMessages((prev) => {
      const newMsgs = [...prev];
      const last = newMsgs[newMsgs.length - 1];
      if (content) last.content += content;
      if (sources) last.sources = sources;
      return newMsgs;
    });
  };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar de Informações fixas */}
      <aside className="w-80 border-r bg-white p-6 hidden md:block">
        <h2 className="text-xl font-bold mb-4">Paciente {id}</h2>
        <div className="space-y-4">
          <Card className="p-4 bg-slate-50 border-none">
            <p className="text-xs text-slate-500 uppercase font-bold">
              Alergias
            </p>
            <Badge variant="destructive">Penicilina</Badge>
          </Card>
          <div className="text-sm">
            <p>
              <strong>Último Raio-X:</strong> 12/02/2024
            </p>
            <p>
              <strong>Status:</strong> Em tratamento
            </p>
          </div>
        </div>
      </aside>

      {/* Área do Chat */}
      <main className="flex-1 flex flex-col p-4 overflow-hidden">
        <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
          <div className="space-y-4 max-w-3xl mx-auto">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] p-4 rounded-lg ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-white border"}`}
                >
                  <p className="text-sm leading-relaxed">
                    {m.content ||
                      (isLoading && i === messages.length - 1
                        ? "Digitando..."
                        : "")}
                  </p>

                  {m.sources && (
                    <div className="mt-2 pt-2 border-t text-[10px] text-slate-400">
                      Fontes: {m.sources.map((s, idx) => `[${s.source}] `)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Input fixo na base */}
        <div className="p-4 border-t bg-white max-w-3xl mx-auto w-full mt-4 rounded-xl shadow-sm">
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
          >
            <Input
              placeholder="Pergunte sobre o histórico do paciente..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "..." : "Enviar"}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}

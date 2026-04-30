"use client"

import { useEffect, useRef, useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { TopNav } from "@/components/top-nav"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sparkles, Send, AlertCircle, Loader2 } from "lucide-react"
import {
  chatApi,
  documentsApi,
  patientsApi,
  streamChat,
  type ChatMessage,
  type PatientDocument,
  type PatientSummary,
  type RagMetrics,
  type SourceRef,
} from "@/lib/api-client"
import { AuthGate } from "@/lib/auth-gate"
import { formatScorePct, scoreColorClass } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface UiMessage {
  id: string
  role: "user" | "assistant"
  content: string
  sources?: SourceRef[]
  metrics?: {
    contextRelevance: number | null
    groundedness: number | null
    answerRelevance: number | null
  }
}

export default function AssistantPage() {
  return (
    <AuthGate>
      <AssistantPageInner />
    </AuthGate>
  )
}

function AssistantPageInner() {
  const [patients, setPatients] = useState<PatientSummary[]>([])
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<PatientSummary | null>(null)
  const [docs, setDocs] = useState<PatientDocument[] | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<UiMessage[]>([])
  const [input, setInput] = useState("")
  const [streaming, setStreaming] = useState(false)
  const [ragOk, setRagOk] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatApi
      .health()
      .then((h) => setRagOk(!!h.ok))
      .catch(() => setRagOk(false))
  }, [])

  useEffect(() => {
    const t = setTimeout(() => {
      patientsApi
        .list(search ? { search } : undefined)
        .then(setPatients)
        .catch((e) => setError((e as Error).message))
    }, 250)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  async function selectPatient(p: PatientSummary) {
    setSelected(p)
    setMessages([])
    setError(null)
    setDocs(null)
    documentsApi
      .list(p.id)
      .then(setDocs)
      .catch(() => setDocs([]))
    try {
      // Reuse the most recent session for this patient so the conversation
      // history persists across reloads / patient re-selection. Only create
      // a new session if none exists yet.
      const existing = await chatApi.listSessions(p.id).catch(() => [])
      const session = existing[0] ?? (await chatApi.createSession(p.id))
      setSessionId(session.id)
      const past = await chatApi.listMessages(session.id)
      setMessages(
        past.map((m: ChatMessage) => {
          const sources = (m.sources as SourceRef[] | undefined) ?? undefined
          const perChunk = (m.metricsPerChunk as number[] | null | undefined) ?? null
          const sourcesWithRelevance =
            sources && perChunk
              ? sources.map((s, i) => ({ ...s, relevance: perChunk[i] ?? s.relevance }))
              : sources
          return {
            id: m.id,
            role: m.role,
            content: m.content,
            sources: sourcesWithRelevance,
            metrics:
              m.contextRelevance != null ||
              m.groundedness != null ||
              m.answerRelevance != null
                ? {
                    contextRelevance: m.contextRelevance ?? null,
                    groundedness: m.groundedness ?? null,
                    answerRelevance: m.answerRelevance ?? null,
                  }
                : undefined,
          }
        }),
      )
    } catch (e) {
      setError((e as Error).message)
    }
  }

  function send() {
    const q = input.trim()
    if (!q || !sessionId || streaming) return
    setInput("")
    const userMsg: UiMessage = { id: `u-${Date.now()}`, role: "user", content: q }
    const assistantId = `a-${Date.now()}`
    setMessages((m) => [...m, userMsg, { id: assistantId, role: "assistant", content: "" }])
    setStreaming(true)
    setError(null)

    abortRef.current = streamChat(sessionId, q, {
      onSources(sources) {
        setMessages((m) =>
          m.map((msg) => (msg.id === assistantId ? { ...msg, sources } : msg)),
        )
      },
      onToken(token) {
        setMessages((m) =>
          m.map((msg) =>
            msg.id === assistantId ? { ...msg, content: msg.content + token } : msg,
          ),
        )
      },
      onMetrics(metrics: RagMetrics) {
        setMessages((m) =>
          m.map((msg) => {
            if (msg.id !== assistantId) return msg
            const sources =
              msg.sources && metrics.perChunk?.length
                ? msg.sources.map((s, i) => ({
                    ...s,
                    relevance: metrics.perChunk[i] ?? s.relevance,
                  }))
                : msg.sources
            return {
              ...msg,
              sources,
              metrics: {
                contextRelevance: metrics.contextRelevance,
                groundedness: metrics.groundedness,
                answerRelevance: metrics.answerRelevance,
              },
            }
          }),
        )
      },
      onDone() {
        setStreaming(false)
      },
      onError(message) {
        setStreaming(false)
        setError(message)
      },
    })
  }

  function stop() {
    abortRef.current?.abort()
    setStreaming(false)
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <TopNav />
        <main className="flex-1 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Assistente clínico</h1>
                <p className="text-sm text-muted-foreground">
                  Resumos baseados nos documentos do paciente. Não substitui orientação médica.
                </p>
              </div>
            </div>
            <Badge variant={ragOk ? "default" : "destructive"} className="gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  ragOk === null ? "bg-muted-foreground" : ragOk ? "bg-green-500" : "bg-red-500"
                }`}
              />
              {ragOk === null ? "Verificando..." : ragOk ? "Online" : "Offline"}
            </Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Pacientes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Input
                  placeholder="Buscar por nome..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <ScrollArea className="h-[60vh]">
                  <div className="space-y-1">
                    {patients.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => selectPatient(p)}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                          selected?.id === p.id
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted"
                        }`}
                      >
                        <div className="font-medium">{p.fullName}</div>
                        {p.specialties && p.specialties.length > 0 ? (
                          <div className="text-xs opacity-70">
                            {p.specialties.join(", ")}
                          </div>
                        ) : null}
                      </button>
                    ))}
                    {patients.length === 0 ? (
                      <div className="text-sm text-muted-foreground px-3 py-2">
                        Nenhum paciente encontrado.
                      </div>
                    ) : null}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card className="flex flex-col h-[70vh]">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                  {selected ? `Conversando sobre ${selected.fullName}` : "Selecione um paciente"}
                  {selected && docs ? (
                    docs.some((d) => d.ingestStatus === "ready") ? (
                      <Badge className="bg-green-600 hover:bg-green-600 text-xs">
                        {docs.filter((d) => d.ingestStatus === "ready").length} documento(s) pronto(s)
                      </Badge>
                    ) : docs.length > 0 ? (
                      <Badge variant="secondary" className="text-xs">
                        Documentos processando...
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        Sem documentos
                      </Badge>
                    )
                  ) : null}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col gap-3 min-h-0">
                <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 pr-2">
                  {messages.length === 0 && selected ? (
                    <div className="text-sm text-muted-foreground">
                      Faça uma pergunta sobre a anamnese, alergias, medicações ou tratamentos do paciente.
                    </div>
                  ) : null}
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={`rounded-lg px-3 py-2 max-w-[85%] ${
                        m.role === "user"
                          ? "ml-auto bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <div className="whitespace-pre-wrap text-sm">
                        {m.content || (streaming ? "Processando resposta clínica..." : "")}
                      </div>
                      {m.role === "assistant" && m.metrics ? (
                        <TooltipProvider>
                          <div className="mt-2 flex flex-wrap items-center gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge
                                  className={`${scoreColorClass(
                                    m.metrics.contextRelevance,
                                  )} text-[10px] gap-1 cursor-help`}
                                >
                                  Contexto {formatScorePct(m.metrics.contextRelevance)}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                Quão relevantes são os trechos recuperados para a pergunta.
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge
                                  className={`${scoreColorClass(
                                    m.metrics.groundedness,
                                  )} text-[10px] gap-1 cursor-help`}
                                >
                                  Fidedignidade {formatScorePct(m.metrics.groundedness)}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                Quão bem a resposta se sustenta nos trechos recuperados (sem
                                alucinação).
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge
                                  className={`${scoreColorClass(
                                    m.metrics.answerRelevance,
                                  )} text-[10px] gap-1 cursor-help`}
                                >
                                  Resposta {formatScorePct(m.metrics.answerRelevance)}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                Quão diretamente a resposta endereça a pergunta feita.
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </TooltipProvider>
                      ) : null}
                      {m.role === "assistant" && m.sources && m.sources.length > 0 ? (
                        <details className="mt-2 text-xs opacity-80">
                          <summary className="cursor-pointer">Fontes ({m.sources.length})</summary>
                          <ul className="mt-1 space-y-0.5">
                            {m.sources.map((s, i) => (
                              <li key={i}>
                                {s.source}
                                {typeof s.index === "number" ? ` #${s.index}` : ""}
                                {typeof s.relevance === "number"
                                  ? ` · ${formatScorePct(s.relevance)}`
                                  : ""}
                              </li>
                            ))}
                          </ul>
                        </details>
                      ) : null}
                    </div>
                  ))}
                </div>

                {error ? (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="w-4 h-4" /> {error}
                  </div>
                ) : null}

                <div className="flex items-center gap-2">
                  <Input
                    placeholder={selected ? "Pergunte algo..." : "Selecione um paciente"}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        send()
                      }
                    }}
                    disabled={!sessionId || streaming}
                  />
                  {streaming ? (
                    <Button variant="outline" onClick={stop}>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Parar
                    </Button>
                  ) : (
                    <Button onClick={send} disabled={!sessionId || !input.trim()}>
                      <Send className="w-4 h-4 mr-2" /> Enviar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

"use client"

import { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import {
  ArrowLeft,
  Mail,
  Phone,
  CalendarIcon,
  FileText,
  Plus,
  Upload,
  Loader2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Eye,
  Pencil,
} from "lucide-react"
import { AuthGate } from "@/lib/auth-gate"
import {
  patientsApi,
  documentsApi,
  type PatientSummary,
  type TimelineEntry,
  type PatientDocument,
  type IngestStatus,
} from "@/lib/api-client"
import { errorMessage } from "@/lib/errors"

function StatusBadge({ status }: { status: IngestStatus }) {
  if (status === "ready") {
    return (
      <Badge className="bg-green-600 hover:bg-green-600">
        <CheckCircle2 className="w-3 h-3 mr-1" />
        Pronto
      </Badge>
    )
  }
  if (status === "failed") {
    return (
      <Badge variant="destructive">
        <AlertTriangle className="w-3 h-3 mr-1" />
        Falhou
      </Badge>
    )
  }
  return (
    <Badge variant="secondary">
      <Clock className="w-3 h-3 mr-1" />
      {status === "processing" ? "Processando" : "Pendente"}
    </Badge>
  )
}

function ClientDetailInner() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { toast } = useToast()
  const id = params.id

  const [patient, setPatient] = useState<PatientSummary | null>(null)
  const [timeline, setTimeline] = useState<TimelineEntry[]>([])
  const [documents, setDocuments] = useState<PatientDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function loadAll() {
    try {
      const [p, tl, docs] = await Promise.all([
        patientsApi.get(id),
        patientsApi.timeline(id).catch(() => [] as TimelineEntry[]),
        documentsApi.list(id).catch(() => [] as PatientDocument[]),
      ])
      setPatient(p)
      setTimeline(tl)
      setDocuments(docs)
    } catch (err) {
      toast({
        title: "Falha ao carregar paciente",
        description: errorMessage(err),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // Poll documents while any is pending/processing
  useEffect(() => {
    const hasPending = documents.some(
      (d) => d.ingestStatus === "pending" || d.ingestStatus === "processing",
    )
    if (!hasPending) return
    const t = setInterval(() => {
      documentsApi
        .list(id)
        .then(setDocuments)
        .catch(() => {})
    }, 3000)
    return () => clearInterval(t)
  }, [documents, id])

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      const created = await documentsApi.upload(id, Array.from(files))
      setDocuments((prev) => [...created, ...prev])
      toast({ title: "Upload concluído", description: `${created.length} arquivo(s)` })
    } catch (err) {
      toast({
        title: "Falha no upload",
        description: errorMessage(err),
        variant: "destructive",
      })
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleDeleteDoc = async (docId: string) => {
    try {
      await documentsApi.remove(id, docId)
      setDocuments((prev) => prev.filter((d) => d.id !== docId))
      toast({ title: "Documento removido" })
    } catch (err) {
      toast({
        title: "Falha ao remover",
        description: errorMessage(err),
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <main className="flex-1 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </main>
        </div>
      </SidebarProvider>
    )
  }

  if (!patient) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <main className="flex-1 flex items-center justify-center text-muted-foreground">
            Paciente não encontrado.
          </main>
        </div>
      </SidebarProvider>
    )
  }

  const initials = patient.fullName
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s.charAt(0).toUpperCase())
    .join("")

  const anamneses = timeline.filter((t) => t.type === "anamnesis")
  const appointments = timeline.filter((t) => t.type === "appointment")

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 bg-gradient-to-b from-white to-secondary">
          <div className="border-b border-border bg-white/80 backdrop-blur-sm sticky top-0 z-10">
            <div className="flex items-center gap-4 px-6 py-4">
              <SidebarTrigger />
              <Button variant="ghost" size="sm" onClick={() => router.push("/clients")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <h1 className="text-2xl font-bold text-foreground">{patient.fullName}</h1>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarFallback className="bg-primary/10 text-primary text-xl">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 grid sm:grid-cols-2 gap-2 text-sm">
                    {patient.email ? (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="w-4 h-4" />
                        {patient.email}
                      </div>
                    ) : null}
                    {patient.phone ? (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="w-4 h-4" />
                        {patient.phone}
                      </div>
                    ) : null}
                    {patient.cpf ? (
                      <div className="text-muted-foreground">CPF: {patient.cpf}</div>
                    ) : null}
                    {patient.birthDate ? (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <CalendarIcon className="w-4 h-4" />
                        {new Date(patient.birthDate).toLocaleDateString()}
                      </div>
                    ) : null}
                    {patient.address ? (
                      <div className="text-muted-foreground sm:col-span-2">{patient.address}</div>
                    ) : null}
                    <div className="flex flex-wrap gap-2 sm:col-span-2 mt-2">
                      {patient.specialties.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="documents">
              <TabsList>
                <TabsTrigger value="documents">Documentos</TabsTrigger>
                <TabsTrigger value="anamneses">Anamneses</TabsTrigger>
                <TabsTrigger value="appointments">Consultas</TabsTrigger>
              </TabsList>

              <TabsContent value="documents" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Documentos do paciente</CardTitle>
                        <CardDescription>
                          Envie arquivos para indexar e usar com o assistente
                        </CardDescription>
                      </div>
                      <div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          multiple
                          className="hidden"
                          onChange={(e) => handleFiles(e.target.files)}
                        />
                        <Button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                        >
                          {uploading ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Upload className="w-4 h-4 mr-2" />
                          )}
                          Enviar arquivos
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {documents.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nenhum documento ainda.</p>
                    ) : (
                      <div className="space-y-2">
                        {documents.map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between p-3 rounded-lg border"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                              <div className="min-w-0">
                                <p className="font-medium text-sm truncate">{doc.filename}</p>
                                <p className="text-xs text-muted-foreground">
                                  {(doc.sizeBytes / 1024).toFixed(1)} KB ·{" "}
                                  {new Date(doc.createdAt).toLocaleString()}
                                  {doc.ingestError ? ` · ${doc.ingestError}` : ""}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <StatusBadge status={doc.ingestStatus} />
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteDoc(doc.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="anamneses" className="space-y-4">
                <div className="flex justify-end">
                  <Button onClick={() => router.push(`/clients/${id}/anamnesis`)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nova anamnese
                  </Button>
                </div>
                {anamneses.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      Nenhuma anamnese registrada.
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {anamneses.map((entry) => {
                      if (entry.type !== "anamnesis") return null
                      return (
                        <Card key={entry.data.id}>
                          <CardHeader>
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <CardTitle className="text-base">
                                  {new Date(entry.at).toLocaleString()}
                                </CardTitle>
                                {entry.data.specialties.length > 0 ? (
                                  <CardDescription>
                                    {entry.data.specialties.join(", ")}
                                  </CardDescription>
                                ) : null}
                              </div>
                              <div className="flex gap-2 shrink-0">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    router.push(
                                      `/clients/${id}/anamnesis?id=${entry.data.id}`,
                                    )
                                  }
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  Ver
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    router.push(
                                      `/clients/${id}/anamnesis?id=${entry.data.id}&mode=edit`,
                                    )
                                  }
                                >
                                  <Pencil className="w-4 h-4 mr-1" />
                                  Editar
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          {entry.data.chiefComplaint ? (
                            <CardContent>
                              <p className="text-sm">{entry.data.chiefComplaint}</p>
                            </CardContent>
                          ) : null}
                        </Card>
                      )
                    })}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="appointments" className="space-y-4">
                {appointments.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      Nenhuma consulta registrada.
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {appointments.map((entry) => {
                      if (entry.type !== "appointment") return null
                      return (
                        <Card key={entry.data.id}>
                          <CardHeader>
                            <CardTitle className="text-base">
                              {new Date(entry.data.startsAt).toLocaleString()}
                            </CardTitle>
                            <CardDescription>
                              Status: {entry.data.status}
                              {entry.data.reason ? ` · ${entry.data.reason}` : ""}
                            </CardDescription>
                          </CardHeader>
                          {entry.data.notes ? (
                            <CardContent>
                              <p className="text-sm">{entry.data.notes}</p>
                            </CardContent>
                          ) : null}
                        </Card>
                      )
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}

export default function ClientDetailPage() {
  return (
    <AuthGate>
      <ClientDetailInner />
    </AuthGate>
  )
}

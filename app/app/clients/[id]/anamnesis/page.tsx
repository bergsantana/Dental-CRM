"use client"

import type React from "react"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, ChevronDown, Save, Loader2, Pencil } from "lucide-react"
import { AuthGate } from "@/lib/auth-gate"
import { anamnesesApi, type AnamnesisRecord } from "@/lib/api-client"
import { errorMessage } from "@/lib/errors"

type FormState = {
  allergies: string
  medications: string
  diseases: string
  smoking: string
  alcohol: string
  jawPain: string
  biteIssues: string
  orthodonticHistory: string
  boneDensity: string
  priorImplants: string
  xrayNotes: string
  rootCanalHistory: string
  painSensitivity: string
  pulpVitality: string
}

const EMPTY_FORM: FormState = {
  allergies: "",
  medications: "",
  diseases: "",
  smoking: "no",
  alcohol: "no",
  jawPain: "no",
  biteIssues: "",
  orthodonticHistory: "",
  boneDensity: "",
  priorImplants: "no",
  xrayNotes: "",
  rootCanalHistory: "",
  painSensitivity: "",
  pulpVitality: "",
}

function recordToForm(rec: AnamnesisRecord): FormState {
  const a = (rec.answers ?? {}) as Partial<FormState>
  return {
    ...EMPTY_FORM,
    ...a,
    allergies: rec.allergiesSummary ?? a.allergies ?? "",
    medications: rec.medicationsSummary ?? a.medications ?? "",
    smoking: rec.smoker ? "yes" : a.smoking ?? "no",
    alcohol: rec.alcoholUse ?? a.alcohol ?? "no",
  }
}

function AnamnesisPageInner() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const patientId = String(params?.id ?? "")
  const anamnesisId = searchParams?.get("id") ?? null
  const initialMode: "create" | "view" | "edit" =
    searchParams?.get("mode") === "edit" ? "edit" : anamnesisId ? "view" : "create"

  const [mode, setMode] = useState<"create" | "view" | "edit">(initialMode)
  const [loading, setLoading] = useState<boolean>(!!anamnesisId)
  const [submitting, setSubmitting] = useState(false)
  const [record, setRecord] = useState<AnamnesisRecord | null>(null)
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>(["general"])
  const [formData, setFormData] = useState<FormState>(EMPTY_FORM)

  const readOnly = mode === "view"

  useEffect(() => {
    if (!anamnesisId) return
    let cancelled = false
    setLoading(true)
    anamnesesApi
      .get(anamnesisId)
      .then((rec) => {
        if (cancelled) return
        setRecord(rec)
        setSelectedSpecialties(rec.specialties.length > 0 ? rec.specialties : ["general"])
        setFormData(recordToForm(rec))
      })
      .catch((err) => {
        toast({
          title: "Falha ao carregar anamnese",
          description: errorMessage(err),
          variant: "destructive",
        })
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [anamnesisId, toast])

  const headerTitle = useMemo(() => {
    if (mode === "view") return "Visualizar anamnese"
    if (mode === "edit") return "Editar anamnese"
    return "Nova anamnese"
  }, [mode])

  const handleSpecialtyToggle = (specialty: string) => {
    if (readOnly) return
    setSelectedSpecialties((prev) =>
      prev.includes(specialty) ? prev.filter((s) => s !== specialty) : [...prev, specialty],
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (readOnly) return
    if (!patientId) return
    setSubmitting(true)
    try {
      const payload = {
        specialties: selectedSpecialties,
        allergiesSummary: formData.allergies || undefined,
        medicationsSummary: formData.medications || undefined,
        smoker: formData.smoking === "yes",
        alcoholUse: formData.alcohol,
        answers: { ...formData },
        consentSigned: true,
      }

      if (mode === "edit" && anamnesisId) {
        await anamnesesApi.update(anamnesisId, payload)
        toast({ title: "Anamnese atualizada" })
      } else {
        await anamnesesApi.create(patientId, payload)
        toast({ title: "Anamnese salva", description: "Histórico médico atualizado" })
      }
      router.push(`/clients/${patientId}`)
    } catch (err) {
      toast({
        title: "Falha ao salvar",
        description: errorMessage(err),
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const switchToEdit = () => setMode("edit")

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 bg-gradient-to-b from-white to-secondary">
          <div className="border-b border-border bg-white/80 backdrop-blur-sm sticky top-0 z-10">
            <div className="flex items-center gap-4 px-6 py-4">
              <SidebarTrigger />
              <Button variant="ghost" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <h1 className="text-2xl font-bold text-foreground flex-1">{headerTitle}</h1>
              {mode === "view" ? (
                <Button onClick={switchToEdit} size="sm">
                  <Pencil className="w-4 h-4 mr-2" />
                  Editar
                </Button>
              ) : null}
            </div>
          </div>

          {loading ? (
            <div className="p-12 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="p-6 max-w-4xl mx-auto space-y-6">
              {record && mode !== "create" ? (
                <Card>
                  <CardContent className="py-4 text-sm text-muted-foreground">
                    Registrada em {new Date(record.recordedAt).toLocaleString()}
                  </CardContent>
                </Card>
              ) : null}

              <Card>
                <CardHeader>
                  <CardTitle>Especialidades</CardTitle>
                  <CardDescription>
                    {readOnly
                      ? "Especialidades cobertas por esta anamnese"
                      : "Escolha quais formulários de especialidade incluir para este paciente"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { id: "general", label: "Clínica Geral" },
                    { id: "orthodontics", label: "Ortodontia" },
                    { id: "implantology", label: "Implantodontia" },
                    { id: "endodontics", label: "Endodontia" },
                  ].map((spec) => (
                    <div key={spec.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={spec.id}
                        checked={selectedSpecialties.includes(spec.id)}
                        onCheckedChange={() => handleSpecialtyToggle(spec.id)}
                        disabled={readOnly}
                      />
                      <Label htmlFor={spec.id} className="cursor-pointer">
                        {spec.label}
                      </Label>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <form onSubmit={handleSubmit} className="space-y-4">
                {selectedSpecialties.includes("general") && (
                  <Collapsible defaultOpen>
                    <Card>
                      <CollapsibleTrigger className="w-full">
                        <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                          <div className="flex items-center justify-between">
                            <CardTitle>Clínica Geral</CardTitle>
                            <ChevronDown className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <CardDescription>Histórico médico básico e estilo de vida</CardDescription>
                        </CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className="space-y-4 pt-0">
                          <div className="space-y-2">
                            <Label htmlFor="allergies">Alergias</Label>
                            <Textarea
                              id="allergies"
                              placeholder="Liste alergias conhecidas..."
                              value={formData.allergies}
                              onChange={(e) =>
                                setFormData({ ...formData, allergies: e.target.value })
                              }
                              rows={2}
                              readOnly={readOnly}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="medications">Medicamentos em uso</Label>
                            <Textarea
                              id="medications"
                              placeholder="Liste todos os medicamentos atuais..."
                              value={formData.medications}
                              onChange={(e) =>
                                setFormData({ ...formData, medications: e.target.value })
                              }
                              rows={2}
                              readOnly={readOnly}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="diseases">Condições médicas</Label>
                            <Textarea
                              id="diseases"
                              placeholder="Doenças crônicas ou condições..."
                              value={formData.diseases}
                              onChange={(e) =>
                                setFormData({ ...formData, diseases: e.target.value })
                              }
                              rows={2}
                              readOnly={readOnly}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Fuma?</Label>
                            <RadioGroup
                              value={formData.smoking}
                              onValueChange={(value) =>
                                !readOnly && setFormData({ ...formData, smoking: value })
                              }
                              disabled={readOnly}
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="no" id="smoking-no" />
                                <Label htmlFor="smoking-no" className="cursor-pointer">
                                  Não
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="yes" id="smoking-yes" />
                                <Label htmlFor="smoking-yes" className="cursor-pointer">
                                  Sim
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="former" id="smoking-former" />
                                <Label htmlFor="smoking-former" className="cursor-pointer">
                                  Ex-fumante
                                </Label>
                              </div>
                            </RadioGroup>
                          </div>

                          <div className="space-y-2">
                            <Label>Consumo de álcool?</Label>
                            <RadioGroup
                              value={formData.alcohol}
                              onValueChange={(value) =>
                                !readOnly && setFormData({ ...formData, alcohol: value })
                              }
                              disabled={readOnly}
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="no" id="alcohol-no" />
                                <Label htmlFor="alcohol-no" className="cursor-pointer">
                                  Não
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="occasional" id="alcohol-occasional" />
                                <Label htmlFor="alcohol-occasional" className="cursor-pointer">
                                  Ocasional
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="regular" id="alcohol-regular" />
                                <Label htmlFor="alcohol-regular" className="cursor-pointer">
                                  Regular
                                </Label>
                              </div>
                            </RadioGroup>
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                )}

                {selectedSpecialties.includes("orthodontics") && (
                  <Collapsible defaultOpen>
                    <Card>
                      <CollapsibleTrigger className="w-full">
                        <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                          <div className="flex items-center justify-between">
                            <CardTitle>Ortodontia</CardTitle>
                            <ChevronDown className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <CardDescription>Alinhamento e mordida</CardDescription>
                        </CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className="space-y-4 pt-0">
                          <div className="space-y-2">
                            <Label>Sente dor na mandíbula?</Label>
                            <RadioGroup
                              value={formData.jawPain}
                              onValueChange={(value) =>
                                !readOnly && setFormData({ ...formData, jawPain: value })
                              }
                              disabled={readOnly}
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="no" id="jaw-no" />
                                <Label htmlFor="jaw-no" className="cursor-pointer">
                                  Não
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="occasional" id="jaw-occasional" />
                                <Label htmlFor="jaw-occasional" className="cursor-pointer">
                                  Ocasional
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="frequent" id="jaw-frequent" />
                                <Label htmlFor="jaw-frequent" className="cursor-pointer">
                                  Frequente
                                </Label>
                              </div>
                            </RadioGroup>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="biteIssues">Problemas de mordida / oclusão</Label>
                            <Textarea
                              id="biteIssues"
                              placeholder="Descreva problemas de alinhamento..."
                              value={formData.biteIssues}
                              onChange={(e) =>
                                setFormData({ ...formData, biteIssues: e.target.value })
                              }
                              rows={2}
                              readOnly={readOnly}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="orthodonticHistory">
                              Tratamento ortodôntico anterior
                            </Label>
                            <Textarea
                              id="orthodonticHistory"
                              placeholder="Aparelhos, contenções etc..."
                              value={formData.orthodonticHistory}
                              onChange={(e) =>
                                setFormData({ ...formData, orthodonticHistory: e.target.value })
                              }
                              rows={2}
                              readOnly={readOnly}
                            />
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                )}

                {selectedSpecialties.includes("implantology") && (
                  <Collapsible defaultOpen>
                    <Card>
                      <CollapsibleTrigger className="w-full">
                        <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                          <div className="flex items-center justify-between">
                            <CardTitle>Implantodontia</CardTitle>
                            <ChevronDown className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <CardDescription>Implantes e estrutura óssea</CardDescription>
                        </CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className="space-y-4 pt-0">
                          <div className="space-y-2">
                            <Label htmlFor="boneDensity">Avaliação de densidade óssea</Label>
                            <Input
                              id="boneDensity"
                              placeholder="ex: Normal, Baixa, Necessita enxerto"
                              value={formData.boneDensity}
                              onChange={(e) =>
                                setFormData({ ...formData, boneDensity: e.target.value })
                              }
                              readOnly={readOnly}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Implantes prévios?</Label>
                            <RadioGroup
                              value={formData.priorImplants}
                              onValueChange={(value) =>
                                !readOnly && setFormData({ ...formData, priorImplants: value })
                              }
                              disabled={readOnly}
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="no" id="implants-no" />
                                <Label htmlFor="implants-no" className="cursor-pointer">
                                  Não
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="yes" id="implants-yes" />
                                <Label htmlFor="implants-yes" className="cursor-pointer">
                                  Sim
                                </Label>
                              </div>
                            </RadioGroup>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="xrayNotes">Notas de radiografia / imagem</Label>
                            <Textarea
                              id="xrayNotes"
                              placeholder="Achados radiográficos..."
                              value={formData.xrayNotes}
                              onChange={(e) =>
                                setFormData({ ...formData, xrayNotes: e.target.value })
                              }
                              rows={3}
                              readOnly={readOnly}
                            />
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                )}

                {selectedSpecialties.includes("endodontics") && (
                  <Collapsible defaultOpen>
                    <Card>
                      <CollapsibleTrigger className="w-full">
                        <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                          <div className="flex items-center justify-between">
                            <CardTitle>Endodontia</CardTitle>
                            <ChevronDown className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <CardDescription>Canal e polpa</CardDescription>
                        </CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className="space-y-4 pt-0">
                          <div className="space-y-2">
                            <Label htmlFor="rootCanalHistory">Histórico de canais</Label>
                            <Textarea
                              id="rootCanalHistory"
                              placeholder="Tratamentos prévios, datas, dentes..."
                              value={formData.rootCanalHistory}
                              onChange={(e) =>
                                setFormData({ ...formData, rootCanalHistory: e.target.value })
                              }
                              rows={2}
                              readOnly={readOnly}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="painSensitivity">Dor / sensibilidade</Label>
                            <Textarea
                              id="painSensitivity"
                              placeholder="Descreva dor ou sensibilidade térmica..."
                              value={formData.painSensitivity}
                              onChange={(e) =>
                                setFormData({ ...formData, painSensitivity: e.target.value })
                              }
                              rows={2}
                              readOnly={readOnly}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="pulpVitality">Vitalidade pulpar</Label>
                            <Input
                              id="pulpVitality"
                              placeholder="ex: Vital, Não-vital, Necrótica"
                              value={formData.pulpVitality}
                              onChange={(e) =>
                                setFormData({ ...formData, pulpVitality: e.target.value })
                              }
                              readOnly={readOnly}
                            />
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                )}

                {!readOnly ? (
                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      {mode === "edit" ? "Salvar alterações" : "Salvar anamnese"}
                    </Button>
                  </div>
                ) : null}
              </form>
            </div>
          )}
        </main>
      </div>
    </SidebarProvider>
  )
}

export default function AnamnesisPage() {
  return (
    <AuthGate>
      <AnamnesisPageInner />
    </AuthGate>
  )
}

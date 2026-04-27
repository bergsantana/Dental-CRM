"use client"

import type React from "react"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Plus, Calendar, DollarSign, Clock, CheckCircle2, Circle, AlertCircle } from "lucide-react"

const mockTreatments = [
  {
    id: 1,
    procedure: "Limpeza Profunda",
    tooth: "Todos",
    status: "Concluído",
    priority: "Baixa",
    estimatedCost: "R$ 250,00",
    estimatedTime: "1 hora",
    scheduledDate: "2024-01-15",
    notes: "Limpeza completa realizada com sucesso",
  },
  {
    id: 2,
    procedure: "Obturação",
    tooth: "16",
    status: "Em Andamento",
    priority: "Média",
    estimatedCost: "R$ 350,00",
    estimatedTime: "1.5 horas",
    scheduledDate: "2024-02-20",
    notes: "Cárie no molar superior direito",
  },
  {
    id: 3,
    procedure: "Canal",
    tooth: "36",
    status: "Planejado",
    priority: "Alta",
    estimatedCost: "R$ 1.200,00",
    estimatedTime: "2 horas",
    scheduledDate: "2024-03-10",
    notes: "Tratamento de canal necessário devido a infecção",
  },
  {
    id: 4,
    procedure: "Coroa",
    tooth: "36",
    status: "Planejado",
    priority: "Média",
    estimatedCost: "R$ 1.800,00",
    estimatedTime: "2 sessões",
    scheduledDate: "2024-03-24",
    notes: "Após conclusão do canal",
  },
]

export default function PlanejamentoPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [treatments, setTreatments] = useState(mockTreatments)
  const [newTreatment, setNewTreatment] = useState({
    procedure: "",
    tooth: "",
    priority: "Média",
    estimatedCost: "",
    estimatedTime: "",
    scheduledDate: "",
    notes: "",
  })

  const handleAddTreatment = (e: React.FormEvent) => {
    e.preventDefault()
    const treatment = {
      id: treatments.length + 1,
      ...newTreatment,
      status: "Planejado",
    }
    setTreatments([...treatments, treatment])
    setIsDialogOpen(false)
    setNewTreatment({
      procedure: "",
      tooth: "",
      priority: "Média",
      estimatedCost: "",
      estimatedTime: "",
      scheduledDate: "",
      notes: "",
    })
    toast({
      title: "Tratamento adicionado",
      description: "O tratamento foi adicionado ao planejamento",
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Concluído":
        return <CheckCircle2 className="w-5 h-5 text-green-600" />
      case "Em Andamento":
        return <Clock className="w-5 h-5 text-blue-600" />
      case "Planejado":
        return <Circle className="w-5 h-5 text-muted-foreground" />
      default:
        return <AlertCircle className="w-5 h-5 text-orange-600" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Alta":
        return "destructive"
      case "Média":
        return "default"
      case "Baixa":
        return "secondary"
      default:
        return "outline"
    }
  }

  const totalCost = treatments.reduce((sum, t) => {
    const cost = Number.parseFloat(t.estimatedCost.replace("R$ ", "").replace(".", "").replace(",", "."))
    return sum + (isNaN(cost) ? 0 : cost)
  }, 0)

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
              <h1 className="text-2xl font-bold text-foreground">Planejamento de Tratamento</h1>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Summary Cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Total de Procedimentos</CardDescription>
                  <CardTitle className="text-3xl">{treatments.length}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Concluídos</CardDescription>
                  <CardTitle className="text-3xl text-green-600">
                    {treatments.filter((t) => t.status === "Concluído").length}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Em Andamento</CardDescription>
                  <CardTitle className="text-3xl text-blue-600">
                    {treatments.filter((t) => t.status === "Em Andamento").length}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Custo Total Estimado</CardDescription>
                  <CardTitle className="text-3xl">
                    {totalCost.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>

            {/* Treatment List */}
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-foreground">Procedimentos Planejados</h2>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Procedimento
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Adicionar Procedimento ao Planejamento</DialogTitle>
                    <DialogDescription>Criar um novo procedimento no plano de tratamento</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddTreatment} className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="procedure">Procedimento *</Label>
                        <Input
                          id="procedure"
                          placeholder="Ex: Obturação, Canal, Limpeza"
                          value={newTreatment.procedure}
                          onChange={(e) => setNewTreatment({ ...newTreatment, procedure: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tooth">Dente</Label>
                        <Input
                          id="tooth"
                          placeholder="Ex: 16, 36, Todos"
                          value={newTreatment.tooth}
                          onChange={(e) => setNewTreatment({ ...newTreatment, tooth: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="priority">Prioridade</Label>
                        <Select
                          value={newTreatment.priority}
                          onValueChange={(value) => setNewTreatment({ ...newTreatment, priority: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Baixa">Baixa</SelectItem>
                            <SelectItem value="Média">Média</SelectItem>
                            <SelectItem value="Alta">Alta</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="scheduledDate">Data Prevista</Label>
                        <Input
                          id="scheduledDate"
                          type="date"
                          value={newTreatment.scheduledDate}
                          onChange={(e) => setNewTreatment({ ...newTreatment, scheduledDate: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="estimatedCost">Custo Estimado</Label>
                        <Input
                          id="estimatedCost"
                          placeholder="R$ 0,00"
                          value={newTreatment.estimatedCost}
                          onChange={(e) => setNewTreatment({ ...newTreatment, estimatedCost: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="estimatedTime">Tempo Estimado</Label>
                        <Input
                          id="estimatedTime"
                          placeholder="Ex: 1 hora, 2 sessões"
                          value={newTreatment.estimatedTime}
                          onChange={(e) => setNewTreatment({ ...newTreatment, estimatedTime: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Observações</Label>
                      <Textarea
                        id="notes"
                        placeholder="Detalhes adicionais sobre o procedimento..."
                        value={newTreatment.notes}
                        onChange={(e) => setNewTreatment({ ...newTreatment, notes: e.target.value })}
                        rows={3}
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit">Adicionar</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-4">
              {treatments.map((treatment) => (
                <Card key={treatment.id}>
                  <CardContent className="pt-6">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start gap-3">
                          {getStatusIcon(treatment.status)}
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-lg text-foreground">{treatment.procedure}</h3>
                              <Badge variant={getPriorityColor(treatment.priority) as any}>{treatment.priority}</Badge>
                              <Badge variant="outline">{treatment.status}</Badge>
                            </div>
                            {treatment.tooth && (
                              <p className="text-sm text-muted-foreground mb-2">Dente: {treatment.tooth}</p>
                            )}
                            <p className="text-muted-foreground">{treatment.notes}</p>
                          </div>
                        </div>
                      </div>

                      <div className="lg:text-right space-y-2 lg:min-w-[200px]">
                        <div className="flex items-center gap-2 lg:justify-end">
                          <DollarSign className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium text-foreground">{treatment.estimatedCost}</span>
                        </div>
                        <div className="flex items-center gap-2 lg:justify-end">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{treatment.estimatedTime}</span>
                        </div>
                        {treatment.scheduledDate && (
                          <div className="flex items-center gap-2 lg:justify-end">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {new Date(treatment.scheduledDate).toLocaleDateString("pt-BR")}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}

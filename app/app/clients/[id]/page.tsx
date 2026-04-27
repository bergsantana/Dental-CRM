"use client"

import type React from "react"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Mail, Phone, Calendar, Plus, Upload, ExternalLink } from "lucide-react"
import Link from "next/link"

const mockClient = {
  id: 1,
  name: "João Silva",
  email: "joao.silva@email.com",
  phone: "(11) 98765-4321",
  birthdate: "1985-03-15",
  lastVisit: "2024-01-15",
  dentist: "Dra. Sarah Johnson",
  specialty: "Gastroenterologia",
  tags: ["Regular", "Convênio"],
}

const mockHistory = [
  {
    id: 1,
    date: "2024-01-15",
    notes: "Limpeza regular e check-up. Nenhum problema encontrado.",
    dentist: "Dra. Sarah Johnson",
    images: 2,
  },
  {
    id: 2,
    date: "2023-10-20",
    notes: "Obturação no molar superior direito. Paciente tolerou bem o procedimento.",
    dentist: "Dr. Mike Davis",
    images: 3,
  },
  {
    id: 3,
    date: "2023-07-10",
    notes: "Limpeza de rotina. Recomendado uso mais regular de fio dental.",
    dentist: "Dra. Sarah Johnson",
    images: 1,
  },
]

const mockImages = [
  { id: 1, url: "/dental-xray.png", date: "2024-01-15", type: "Radiografia" },
  { id: 2, url: "/teeth-before.jpg", date: "2024-01-15", type: "Antes" },
  { id: 3, url: "/teeth-after.jpg", date: "2023-10-20", type: "Depois" },
  { id: 4, url: "/dental-scan.png", date: "2023-10-20", type: "Varredura" },
]

const mockAppointments = [
  { id: 1, date: "2024-02-15", time: "10:00", type: "Limpeza", status: "Agendado" },
  { id: 2, date: "2024-01-15", time: "14:00", type: "Check-up", status: "Concluído" },
  { id: 3, date: "2023-10-20", time: "09:30", type: "Obturação", status: "Concluído" },
]

export default function ClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [isRecordDialogOpen, setIsRecordDialogOpen] = useState(false)
  const [isAppointmentDialogOpen, setIsAppointmentDialogOpen] = useState(false)
  const [newRecord, setNewRecord] = useState({
    date: new Date().toISOString().split("T")[0],
    notes: "",
  })
  const [newAppointment, setNewAppointment] = useState({
    date: "",
    time: "",
    type: "",
  })

  const handleAddRecord = (e: React.FormEvent) => {
    e.preventDefault()
    toast({
      title: "Registro adicionado",
      description: "Registro de tratamento salvo com sucesso",
    })
    setIsRecordDialogOpen(false)
    setNewRecord({ date: new Date().toISOString().split("T")[0], notes: "" })
  }

  const handleAddAppointment = (e: React.FormEvent) => {
    e.preventDefault()
    toast({
      title: "Consulta agendada",
      description: "A consulta foi adicionada ao calendário",
    })
    setIsAppointmentDialogOpen(false)
    setNewAppointment({ date: "", time: "", type: "" })
  }

  const handleSyncCalendar = () => {
    toast({
      title: "Sincronização de calendário",
      description: "Mock: Conectado ao Google Calendar",
    })
  }

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
              <h1 className="text-2xl font-bold text-foreground">{mockClient.name}</h1>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Client Overview Card */}
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div>
                    <CardTitle className="text-2xl mb-2">{mockClient.name}</CardTitle>
                    <CardDescription className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <span>{mockClient.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <span>{mockClient.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>Nascimento: {new Date(mockClient.birthdate).toLocaleDateString("pt-BR")}</span>
                      </div>
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {mockClient.tags.map((tag, i) => (
                      <Badge key={i} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-3 gap-4 pt-4 border-t border-border">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Última Visita</p>
                    <p className="font-medium text-foreground">
                      {new Date(mockClient.lastVisit).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Dentista Responsável</p>
                    <p className="font-medium text-foreground">{mockClient.dentist}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Especialidades</p>
                    <p className="font-medium text-foreground">{mockClient.specialty}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="history" className="space-y-4">
              <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-grid">
                <TabsTrigger value="history">Histórico</TabsTrigger>
                <TabsTrigger value="images">Imagens</TabsTrigger>
                <TabsTrigger value="anamnesis">Anamnese</TabsTrigger>
                <TabsTrigger value="planning">Planejamento</TabsTrigger>
                <TabsTrigger value="odontogram">Odontograma</TabsTrigger>
                <TabsTrigger value="appointments">Consultas</TabsTrigger>
              </TabsList>

              {/* History Tab */}
              <TabsContent value="history" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-foreground">Histórico de Tratamentos</h3>
                  <Dialog open={isRecordDialogOpen} onOpenChange={setIsRecordDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Registro
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Adicionar Registro de Tratamento</DialogTitle>
                        <DialogDescription>Documentar um novo tratamento ou visita</DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleAddRecord} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="recordDate">Data</Label>
                          <Input
                            id="recordDate"
                            type="date"
                            value={newRecord.date}
                            onChange={(e) => setNewRecord({ ...newRecord, date: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="recordNotes">Observações</Label>
                          <Textarea
                            id="recordNotes"
                            placeholder="Detalhes do tratamento, observações, recomendações..."
                            value={newRecord.notes}
                            onChange={(e) => setNewRecord({ ...newRecord, notes: e.target.value })}
                            rows={4}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Upload de Imagens</Label>
                          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
                            <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">Clique para fazer upload ou arraste e solte</p>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="outline" onClick={() => setIsRecordDialogOpen(false)}>
                            Cancelar
                          </Button>
                          <Button type="submit">Salvar Registro</Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="space-y-4">
                  {mockHistory.map((record) => (
                    <Card key={record.id}>
                      <CardContent className="pt-6">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <p className="font-semibold text-foreground">
                                {new Date(record.date).toLocaleDateString("pt-BR")}
                              </p>
                              <Badge variant="outline">{record.images} imagens</Badge>
                            </div>
                            <p className="text-muted-foreground mb-2">{record.notes}</p>
                            <p className="text-sm text-muted-foreground">Dentista: {record.dentist}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Images Tab */}
              <TabsContent value="images" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-foreground">Galeria de Imagens</h3>
                  <Button>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload de Imagens
                  </Button>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {mockImages.map((image) => (
                    <Card key={image.id} className="overflow-hidden">
                      <div className="aspect-square bg-muted relative">
                        <img
                          src={image.url || "/placeholder.svg"}
                          alt={image.type}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <CardContent className="pt-4">
                        <p className="font-medium text-sm text-foreground mb-1">{image.type}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(image.date).toLocaleDateString("pt-BR")}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Anamnesis Tab */}
              <TabsContent value="anamnesis" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-foreground">Anamnese do Paciente</h3>
                  <Link href={`/clients/${params.id}/anamnesis`}>
                    <Button>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Editar Anamnese
                    </Button>
                  </Link>
                </div>

                <Card>
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground text-center py-8">
                      Clique em "Editar Anamnese" para preencher ou atualizar os formulários de histórico médico do
                      paciente
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Planning Tab */}
              <TabsContent value="planning" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-foreground">Planejamento de Tratamento</h3>
                  <Link href={`/clients/${params.id}/planejamento`}>
                    <Button>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Ver Planejamento Completo
                    </Button>
                  </Link>
                </div>

                <Card>
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground text-center py-8">
                      Clique em "Ver Planejamento Completo" para acessar o planejamento detalhado de tratamento do
                      paciente
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Odontogram Tab */}
              <TabsContent value="odontogram" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-foreground">Odontograma</h3>
                  <Link href={`/clients/${params.id}/odontograma`}>
                    <Button>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Editar Odontograma
                    </Button>
                  </Link>
                </div>

                <Card>
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground text-center py-8">
                      Clique em "Editar Odontograma" para registrar procedimentos e detalhes de cada dente do paciente
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Appointments Tab */}
              <TabsContent value="appointments" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-foreground">Consultas</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleSyncCalendar}>
                      <Calendar className="w-4 h-4 mr-2" />
                      Sincronizar Calendário
                    </Button>
                    <Dialog open={isAppointmentDialogOpen} onOpenChange={setIsAppointmentDialogOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="w-4 h-4 mr-2" />
                          Adicionar Consulta
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Agendar Consulta</DialogTitle>
                          <DialogDescription>Criar uma nova consulta para {mockClient.name}</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAddAppointment} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="aptDate">Data</Label>
                            <Input
                              id="aptDate"
                              type="date"
                              value={newAppointment.date}
                              onChange={(e) => setNewAppointment({ ...newAppointment, date: e.target.value })}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="aptTime">Horário</Label>
                            <Input
                              id="aptTime"
                              type="time"
                              value={newAppointment.time}
                              onChange={(e) => setNewAppointment({ ...newAppointment, time: e.target.value })}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="aptType">Tipo</Label>
                            <Input
                              id="aptType"
                              placeholder="Limpeza, Check-up, Obturação, etc."
                              value={newAppointment.type}
                              onChange={(e) => setNewAppointment({ ...newAppointment, type: e.target.value })}
                              required
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setIsAppointmentDialogOpen(false)}>
                              Cancelar
                            </Button>
                            <Button type="submit">Agendar</Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                <div className="space-y-3">
                  {mockAppointments.map((apt) => (
                    <Card key={apt.id}>
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-foreground">
                              {new Date(apt.date).toLocaleDateString("pt-BR")} às {apt.time}
                            </p>
                            <p className="text-sm text-muted-foreground">{apt.type}</p>
                          </div>
                          <Badge variant={apt.status === "Concluído" ? "secondary" : "default"}>{apt.status}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}

"use client"

import type React from "react"

import { useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { TopNav } from "@/components/top-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Calendar, Clock, Plus, ChevronLeft, ChevronRight, User, MapPin, Filter } from "lucide-react"

const mockAppointments = [
  {
    id: 1,
    patient: "João Silva",
    dentist: "Dr. Carlos Mendes",
    clinic: "Clínica Centro",
    date: "2024-01-15",
    time: "09:00",
    duration: "60 min",
    type: "Limpeza",
    status: "Confirmado",
  },
  {
    id: 2,
    patient: "Maria Santos",
    dentist: "Dra. Ana Paula",
    clinic: "Clínica Jardins",
    date: "2024-01-15",
    time: "10:30",
    duration: "90 min",
    type: "Canal",
    status: "Confirmado",
  },
  {
    id: 3,
    patient: "Pedro Costa",
    dentist: "Dr. Carlos Mendes",
    clinic: "Clínica Centro",
    date: "2024-01-15",
    time: "14:00",
    duration: "45 min",
    type: "Consulta",
    status: "Pendente",
  },
  {
    id: 4,
    patient: "Ana Oliveira",
    dentist: "Dra. Beatriz Lima",
    clinic: "Clínica Vila Mariana",
    date: "2024-01-16",
    time: "11:00",
    duration: "120 min",
    type: "Implante",
    status: "Confirmado",
  },
]

export default function AgendamentosPage() {
  const { toast } = useToast()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [filterClinic, setFilterClinic] = useState("todas")
  const [newAppointment, setNewAppointment] = useState({
    patient: "",
    dentist: "",
    clinic: "",
    date: "",
    time: "",
    duration: "60",
    type: "",
    notes: "",
  })

  const filteredAppointments =
    filterClinic === "todas" ? mockAppointments : mockAppointments.filter((apt) => apt.clinic === filterClinic)

  const handleCreateAppointment = (e: React.FormEvent) => {
    e.preventDefault()
    setIsDialogOpen(false)
    toast({
      title: "Agendamento criado!",
      description: `Consulta agendada para ${newAppointment.patient}`,
    })
    setNewAppointment({
      patient: "",
      dentist: "",
      clinic: "",
      date: "",
      time: "",
      duration: "60",
      type: "",
      notes: "",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Confirmado":
        return "bg-primary/10 text-primary"
      case "Pendente":
        return "bg-yellow-500/10 text-yellow-700"
      case "Cancelado":
        return "bg-destructive/10 text-destructive"
      default:
        return "bg-secondary text-secondary-foreground"
    }
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 bg-gradient-to-b from-white to-secondary">
          <div className="border-b border-border bg-white/80 backdrop-blur-sm sticky top-0 z-10">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <h1 className="text-2xl font-bold text-foreground">Agendamentos</h1>
              </div>
              <TopNav />
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Stats Cards */}
            <div className="grid md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Hoje</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">12</div>
                  <p className="text-xs text-muted-foreground mt-1">consultas agendadas</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Esta Semana</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">48</div>
                  <p className="text-xs text-muted-foreground mt-1">consultas agendadas</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Pendentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">8</div>
                  <p className="text-xs text-muted-foreground mt-1">aguardando confirmação</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Taxa de Ocupação</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">78%</div>
                  <p className="text-xs text-muted-foreground mt-1">horários preenchidos</p>
                </CardContent>
              </Card>
            </div>

            {/* Filters and Actions */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex gap-2 items-center">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Select value={filterClinic} onValueChange={setFilterClinic}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas as Clínicas</SelectItem>
                    <SelectItem value="Clínica Centro">Clínica Centro</SelectItem>
                    <SelectItem value="Clínica Jardins">Clínica Jardins</SelectItem>
                    <SelectItem value="Clínica Vila Mariana">Clínica Vila Mariana</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Agendamento
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Criar Novo Agendamento</DialogTitle>
                    <DialogDescription>Agendar uma nova consulta para um paciente</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateAppointment} className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="patient">Paciente *</Label>
                        <Input
                          id="patient"
                          placeholder="Nome do paciente"
                          value={newAppointment.patient}
                          onChange={(e) => setNewAppointment({ ...newAppointment, patient: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dentist">Dentista *</Label>
                        <Select
                          value={newAppointment.dentist}
                          onValueChange={(value) => setNewAppointment({ ...newAppointment, dentist: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o dentista" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Dr. Carlos Mendes">Dr. Carlos Mendes</SelectItem>
                            <SelectItem value="Dra. Ana Paula">Dra. Ana Paula</SelectItem>
                            <SelectItem value="Dra. Beatriz Lima">Dra. Beatriz Lima</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="clinic">Clínica *</Label>
                      <Select
                        value={newAppointment.clinic}
                        onValueChange={(value) => setNewAppointment({ ...newAppointment, clinic: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a clínica" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Clínica Centro">Clínica Centro</SelectItem>
                          <SelectItem value="Clínica Jardins">Clínica Jardins</SelectItem>
                          <SelectItem value="Clínica Vila Mariana">Clínica Vila Mariana</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="date">Data *</Label>
                        <Input
                          id="date"
                          type="date"
                          value={newAppointment.date}
                          onChange={(e) => setNewAppointment({ ...newAppointment, date: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="time">Horário *</Label>
                        <Input
                          id="time"
                          type="time"
                          value={newAppointment.time}
                          onChange={(e) => setNewAppointment({ ...newAppointment, time: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="duration">Duração</Label>
                        <Select
                          value={newAppointment.duration}
                          onValueChange={(value) => setNewAppointment({ ...newAppointment, duration: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="30">30 min</SelectItem>
                            <SelectItem value="45">45 min</SelectItem>
                            <SelectItem value="60">60 min</SelectItem>
                            <SelectItem value="90">90 min</SelectItem>
                            <SelectItem value="120">120 min</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="type">Tipo de Consulta *</Label>
                      <Input
                        id="type"
                        placeholder="Ex: Limpeza, Canal, Consulta"
                        value={newAppointment.type}
                        onChange={(e) => setNewAppointment({ ...newAppointment, type: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Observações</Label>
                      <Textarea
                        id="notes"
                        placeholder="Observações adicionais..."
                        value={newAppointment.notes}
                        onChange={(e) => setNewAppointment({ ...newAppointment, notes: e.target.value })}
                        rows={3}
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit">Criar Agendamento</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Appointments List */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Próximos Agendamentos</CardTitle>
                    <CardDescription>Lista de consultas agendadas</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon">
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm font-medium px-4">Janeiro 2024</span>
                    <Button variant="outline" size="icon">
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:border-primary transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <Calendar className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-foreground">{appointment.patient}</p>
                            <Badge variant="outline" className="text-xs">
                              {appointment.type}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              <span>{appointment.dentist}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              <span>{appointment.clinic}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{appointment.duration}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-4">
                        <div>
                          <p className="font-medium text-foreground">
                            {new Date(appointment.date).toLocaleDateString("pt-BR")}
                          </p>
                          <p className="text-sm text-muted-foreground">{appointment.time}</p>
                        </div>
                        <Badge className={getStatusColor(appointment.status)}>{appointment.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}

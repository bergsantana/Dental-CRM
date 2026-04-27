"use client"

import type React from "react"

import { useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { Plus, ChevronLeft, ChevronRight, CalendarIcon, Filter } from "lucide-react"

// Mock appointments data
const mockAppointments = [
  {
    id: 1,
    date: "2024-01-15",
    time: "09:00",
    patient: "João Silva",
    dentist: "Dra. Sarah Johnson",
    type: "Limpeza",
    duration: 60,
  },
  {
    id: 2,
    date: "2024-01-15",
    time: "10:30",
    patient: "Emma Wilson",
    dentist: "Dr. Mike Davis",
    type: "Canal",
    duration: 90,
  },
  {
    id: 3,
    date: "2024-01-15",
    time: "14:00",
    patient: "Maria Santos",
    dentist: "Dra. Sarah Johnson",
    type: "Consulta",
    duration: 30,
  },
  {
    id: 4,
    date: "2024-01-16",
    time: "09:00",
    patient: "Pedro Costa",
    dentist: "Dr. Mike Davis",
    type: "Restauração",
    duration: 45,
  },
  {
    id: 5,
    date: "2024-01-16",
    time: "11:00",
    patient: "Ana Oliveira",
    dentist: "Dra. Sarah Johnson",
    type: "Checkup",
    duration: 30,
  },
]

const dentists = ["Todos os Dentistas", "Dra. Sarah Johnson", "Dr. Mike Davis"]

export default function CalendarPage() {
  const { toast } = useToast()
  const [currentDate, setCurrentDate] = useState(new Date(2024, 0, 15)) // January 15, 2024
  const [view, setView] = useState<"week" | "month">("week")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSyncEnabled, setIsSyncEnabled] = useState(false)
  const [selectedDentist, setSelectedDentist] = useState("Todos os Dentistas")
  const [newAppointment, setNewAppointment] = useState({
    patient: "",
    dentist: "",
    date: "",
    time: "",
    type: "",
    notes: "",
  })

  const handlePreviousWeek = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() - 7)
    setCurrentDate(newDate)
  }

  const handleNextWeek = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() + 7)
    setCurrentDate(newDate)
  }

  const handleToday = () => {
    setCurrentDate(new Date(2024, 0, 15))
  }

  const handleAddAppointment = (e: React.FormEvent) => {
    e.preventDefault()
    toast({
      title: "Consulta criada",
      description: `Consulta agendada para ${newAppointment.patient}`,
    })
    setIsDialogOpen(false)
    setNewAppointment({
      patient: "",
      dentist: "",
      date: "",
      time: "",
      type: "",
      notes: "",
    })
  }

  const handleSyncToggle = () => {
    setIsSyncEnabled(!isSyncEnabled)
    toast({
      title: isSyncEnabled ? "Sincronização desativada" : "Sincronização ativada",
      description: isSyncEnabled
        ? "As consultas não serão mais sincronizadas com o Google Calendar"
        : "Mock: As consultas serão sincronizadas com o Google Calendar",
    })
  }

  // Generate week days
  const getWeekDays = () => {
    const days = []
    const startOfWeek = new Date(currentDate)
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek)
      day.setDate(startOfWeek.getDate() + i)
      days.push(day)
    }
    return days
  }

  const weekDays = getWeekDays()

  const getAppointmentsForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0]
    return mockAppointments.filter((apt) => {
      const matchesDate = apt.date === dateStr
      const matchesDentist = selectedDentist === "Todos os Dentistas" || apt.dentist === selectedDentist
      return matchesDate && matchesDentist
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
              <h1 className="text-2xl font-bold text-foreground">Agenda Geral</h1>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Controls */}
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handlePreviousWeek}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleToday}>
                  Hoje
                </Button>
                <Button variant="outline" size="sm" onClick={handleNextWeek}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <span className="ml-4 font-semibold text-foreground">
                  {currentDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg bg-card">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <Select value={selectedDentist} onValueChange={setSelectedDentist}>
                    <SelectTrigger className="border-0 h-auto p-0 focus:ring-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {dentists.map((dentist) => (
                        <SelectItem key={dentist} value={dentist}>
                          {dentist}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg bg-card">
                  <Switch checked={isSyncEnabled} onCheckedChange={handleSyncToggle} />
                  <Label className="cursor-pointer text-sm" onClick={handleSyncToggle}>
                    Sincronizar Google Calendar
                  </Label>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Consulta
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Agendar Consulta</DialogTitle>
                      <DialogDescription>Criar uma nova consulta para um paciente</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddAppointment} className="space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="patient">Nome do Paciente *</Label>
                          <Input
                            id="patient"
                            placeholder="João Silva"
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
                              <SelectItem value="Dra. Sarah Johnson">Dra. Sarah Johnson</SelectItem>
                              <SelectItem value="Dr. Mike Davis">Dr. Mike Davis</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="aptDate">Data *</Label>
                          <Input
                            id="aptDate"
                            type="date"
                            value={newAppointment.date}
                            onChange={(e) => setNewAppointment({ ...newAppointment, date: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="aptTime">Horário *</Label>
                          <Input
                            id="aptTime"
                            type="time"
                            value={newAppointment.time}
                            onChange={(e) => setNewAppointment({ ...newAppointment, time: e.target.value })}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="aptType">Tipo de Consulta *</Label>
                        <Input
                          id="aptType"
                          placeholder="Limpeza, Checkup, Restauração, etc."
                          value={newAppointment.type}
                          onChange={(e) => setNewAppointment({ ...newAppointment, type: e.target.value })}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="aptNotes">Observações</Label>
                        <Textarea
                          id="aptNotes"
                          placeholder="Observações adicionais ou instruções especiais..."
                          value={newAppointment.notes}
                          onChange={(e) => setNewAppointment({ ...newAppointment, notes: e.target.value })}
                          rows={3}
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                          Cancelar
                        </Button>
                        <Button type="submit">Agendar Consulta</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Week View Calendar */}
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((day, index) => {
                const appointments = getAppointmentsForDate(day)
                const isToday = day.toDateString() === new Date(2024, 0, 15).toDateString()

                return (
                  <Card key={index} className={isToday ? "border-2 border-primary" : ""}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-center">
                        <div className="text-xs text-muted-foreground mb-1">
                          {day.toLocaleDateString("pt-BR", { weekday: "short" })}
                        </div>
                        <div className={`text-lg ${isToday ? "text-primary font-bold" : "text-foreground"}`}>
                          {day.getDate()}
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 min-h-[200px]">
                      {appointments.map((apt) => (
                        <div
                          key={apt.id}
                          className="p-2 rounded-lg bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-colors cursor-pointer"
                        >
                          <p className="text-xs font-semibold text-foreground mb-1">{apt.time}</p>
                          <p className="text-xs text-foreground font-medium mb-1">{apt.patient}</p>
                          <p className="text-xs text-muted-foreground">{apt.type}</p>
                          <Badge variant="secondary" className="text-xs mt-1">
                            {apt.duration}min
                          </Badge>
                        </div>
                      ))}
                      {appointments.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-4">Sem consultas</p>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Upcoming Appointments List */}
            <Card>
              <CardHeader>
                <CardTitle>Todas as Consultas da Semana</CardTitle>
                <CardDescription>Lista completa de consultas agendadas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockAppointments
                    .filter((apt) => {
                      const matchesDentist = selectedDentist === "Todos os Dentistas" || apt.dentist === selectedDentist
                      return matchesDentist
                    })
                    .map((apt) => (
                      <div
                        key={apt.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-border rounded-lg hover:border-primary transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                            <p className="font-semibold text-foreground">
                              {new Date(apt.date).toLocaleDateString("pt-BR")} às {apt.time}
                            </p>
                          </div>
                          <p className="text-sm text-foreground mb-1">
                            <span className="font-medium">Paciente:</span> {apt.patient}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            <span className="font-medium">Dentista:</span> {apt.dentist}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 mt-3 sm:mt-0">
                          <Badge>{apt.type}</Badge>
                          <Badge variant="secondary">{apt.duration} min</Badge>
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

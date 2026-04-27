"use client"
import { useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { CalendarIcon, MapPin, Clock, User, Building2, ChevronLeft, ChevronRight } from "lucide-react"

// Mock data for appointments across different clinics
const mockClinics = [
  { id: 1, name: "Clínica Centro", color: "#4A90E2" },
  { id: 2, name: "Clínica Zona Sul", color: "#6DD4C0" },
  { id: 3, name: "Clínica Norte", color: "#9B59B6" },
]

const mockSchedule = [
  {
    id: 1,
    clinicId: 1,
    clinicName: "Clínica Centro",
    date: "2024-01-15",
    time: "09:00",
    patient: "João Silva",
    type: "Limpeza",
    duration: 60,
    status: "confirmed",
  },
  {
    id: 2,
    clinicId: 2,
    clinicName: "Clínica Zona Sul",
    date: "2024-01-15",
    time: "14:00",
    patient: "Maria Santos",
    type: "Canal",
    duration: 90,
    status: "confirmed",
  },
  {
    id: 3,
    clinicId: 1,
    clinicName: "Clínica Centro",
    date: "2024-01-16",
    time: "10:00",
    patient: "Pedro Costa",
    type: "Consulta",
    duration: 30,
    status: "pending",
  },
  {
    id: 4,
    clinicId: 3,
    clinicName: "Clínica Norte",
    date: "2024-01-16",
    time: "15:30",
    patient: "Ana Oliveira",
    type: "Restauração",
    duration: 45,
    status: "confirmed",
  },
  {
    id: 5,
    clinicId: 2,
    clinicName: "Clínica Zona Sul",
    date: "2024-01-17",
    time: "09:00",
    patient: "Carlos Ferreira",
    type: "Checkup",
    duration: 30,
    status: "confirmed",
  },
  {
    id: 6,
    clinicId: 1,
    clinicName: "Clínica Centro",
    date: "2024-01-17",
    time: "11:00",
    patient: "Juliana Lima",
    type: "Ortodontia",
    duration: 60,
    status: "confirmed",
  },
  {
    id: 7,
    clinicId: 3,
    clinicName: "Clínica Norte",
    date: "2024-01-18",
    time: "08:30",
    patient: "Roberto Alves",
    type: "Implante",
    duration: 120,
    status: "confirmed",
  },
  {
    id: 8,
    clinicId: 2,
    clinicName: "Clínica Zona Sul",
    date: "2024-01-18",
    time: "16:00",
    patient: "Fernanda Rocha",
    type: "Limpeza",
    duration: 60,
    status: "pending",
  },
]

export default function MinhaAgendaPage() {
  const [currentDate, setCurrentDate] = useState(new Date(2024, 0, 15))
  const [selectedClinics, setSelectedClinics] = useState<number[]>([1, 2, 3])

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

  const toggleClinic = (clinicId: number) => {
    setSelectedClinics((prev) => (prev.includes(clinicId) ? prev.filter((id) => id !== clinicId) : [...prev, clinicId]))
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
    return mockSchedule
      .filter((apt) => apt.date === dateStr && selectedClinics.includes(apt.clinicId))
      .sort((a, b) => a.time.localeCompare(b.time))
  }

  const getClinicColor = (clinicId: number) => {
    return mockClinics.find((c) => c.id === clinicId)?.color || "#4A90E2"
  }

  const getTotalHours = () => {
    const filteredAppointments = mockSchedule.filter((apt) => selectedClinics.includes(apt.clinicId))
    const totalMinutes = filteredAppointments.reduce((sum, apt) => sum + apt.duration, 0)
    return (totalMinutes / 60).toFixed(1)
  }

  const getAppointmentCount = () => {
    return mockSchedule.filter((apt) => selectedClinics.includes(apt.clinicId)).length
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 bg-gradient-to-b from-white to-secondary">
          <div className="border-b border-border bg-white/80 backdrop-blur-sm sticky top-0 z-10">
            <div className="flex items-center gap-4 px-6 py-4">
              <SidebarTrigger />
              <h1 className="text-2xl font-bold text-foreground">Minha Agenda</h1>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Stats Cards */}
            <div className="grid sm:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Total de Consultas</CardDescription>
                  <CardTitle className="text-3xl text-primary">{getAppointmentCount()}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Horas Agendadas</CardDescription>
                  <CardTitle className="text-3xl text-accent">{getTotalHours()}h</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Clínicas Ativas</CardDescription>
                  <CardTitle className="text-3xl text-foreground">{selectedClinics.length}</CardTitle>
                </CardHeader>
              </Card>
            </div>

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

              {/* Clinic Filters */}
              <Card className="p-4">
                <div className="flex flex-wrap items-center gap-4">
                  <Label className="text-sm font-semibold text-foreground">Filtrar por clínica:</Label>
                  {mockClinics.map((clinic) => (
                    <div key={clinic.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`clinic-${clinic.id}`}
                        checked={selectedClinics.includes(clinic.id)}
                        onCheckedChange={() => toggleClinic(clinic.id)}
                      />
                      <Label htmlFor={`clinic-${clinic.id}`} className="text-sm cursor-pointer flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: clinic.color }} />
                        {clinic.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Week View */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
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
                          className="p-3 rounded-lg border-l-4 bg-card hover:bg-accent/5 transition-colors cursor-pointer"
                          style={{ borderLeftColor: getClinicColor(apt.clinicId) }}
                        >
                          <div className="flex items-center gap-1 mb-2">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            <p className="text-xs font-semibold text-foreground">{apt.time}</p>
                          </div>
                          <p className="text-sm text-foreground font-medium mb-1">{apt.patient}</p>
                          <p className="text-xs text-muted-foreground mb-2">{apt.type}</p>
                          <div className="flex items-center gap-1 mb-2">
                            <Building2 className="w-3 h-3 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">{apt.clinicName}</p>
                          </div>
                          <Badge variant={apt.status === "confirmed" ? "default" : "secondary"} className="text-xs">
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

            {/* Detailed List */}
            <Card>
              <CardHeader>
                <CardTitle>Todas as Consultas da Semana</CardTitle>
                <CardDescription>Lista completa de consultas agendadas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockSchedule
                    .filter((apt) => selectedClinics.includes(apt.clinicId))
                    .sort((a, b) => {
                      const dateCompare = a.date.localeCompare(b.date)
                      if (dateCompare !== 0) return dateCompare
                      return a.time.localeCompare(b.time)
                    })
                    .map((apt) => (
                      <div
                        key={apt.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-l-4 rounded-lg hover:bg-accent/5 transition-colors"
                        style={{ borderLeftColor: getClinicColor(apt.clinicId) }}
                      >
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                            <p className="font-semibold text-foreground">
                              {new Date(apt.date).toLocaleDateString("pt-BR", {
                                day: "2-digit",
                                month: "short",
                              })}{" "}
                              às {apt.time}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <p className="text-sm text-foreground">
                              <span className="font-medium">Paciente:</span> {apt.patient}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium">Local:</span> {apt.clinicName}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-3 sm:mt-0">
                          <Badge>{apt.type}</Badge>
                          <Badge variant="secondary">{apt.duration} min</Badge>
                          <Badge variant={apt.status === "confirmed" ? "default" : "outline"}>
                            {apt.status === "confirmed" ? "Confirmado" : "Pendente"}
                          </Badge>
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

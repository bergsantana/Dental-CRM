"use client"

import { useEffect, useMemo, useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Calendar as CalIcon, ChevronLeft, ChevronRight, Loader2, User } from "lucide-react"
import { AuthGate } from "@/lib/auth-gate"
import {
  appointmentsApi,
  clinicsApi,
  patientsApi,
  type AppointmentRecord,
  type DentistSummary,
  type PatientSummary,
} from "@/lib/api-client"
import { errorMessage } from "@/lib/errors"

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
}

function CalendarPageInner() {
  const { toast } = useToast()
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()))
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([])
  const [patients, setPatients] = useState<PatientSummary[]>([])
  const [dentists, setDentists] = useState<DentistSummary[]>([])
  const [loading, setLoading] = useState(true)

  const patientById = useMemo(() => {
    const m = new Map<string, PatientSummary>()
    patients.forEach((p) => m.set(p.id, p))
    return m
  }, [patients])

  const dentistById = useMemo(() => {
    const m = new Map<string, DentistSummary>()
    dentists.forEach((d) => m.set(d.id, d))
    return m
  }, [dentists])

  useEffect(() => {
    let alive = true
    setLoading(true)
    const from = startOfMonth(cursor).toISOString()
    const to = endOfMonth(cursor).toISOString()
    Promise.all([
      appointmentsApi.list({ from, to }),
      patientsApi.list().catch(() => [] as PatientSummary[]),
      clinicsApi.listDentists().catch(() => [] as DentistSummary[]),
    ])
      .then(([appts, ps, ds]) => {
        if (!alive) return
        setAppointments(appts)
        setPatients(ps)
        setDentists(ds)
      })
      .catch((err) => {
        if (!alive) return
        toast({
          title: "Falha ao carregar agenda",
          description: errorMessage(err),
          variant: "destructive",
        })
      })
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursor])

  const days = useMemo(() => {
    const map = new Map<string, AppointmentRecord[]>()
    for (const a of appointments) {
      const key = new Date(a.startsAt).toISOString().slice(0, 10)
      const arr = map.get(key) ?? []
      arr.push(a)
      map.set(key, arr)
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [appointments])

  const monthLabel = cursor.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  })

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
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))
                }
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="flex-1 text-center font-semibold capitalize">{monthLabel}</div>
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))
                }
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button variant="ghost" onClick={() => setCursor(startOfMonth(new Date()))}>
                Hoje
              </Button>
            </div>

            {loading ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                </CardContent>
              </Card>
            ) : days.length === 0 ? (
              <Card className="border-dashed border-2">
                <CardContent className="py-12 text-center text-muted-foreground">
                  Nenhum agendamento neste mês.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {days.map(([dateKey, list]) => (
                  <div key={dateKey}>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <CalIcon className="w-4 h-4" />
                      {new Date(dateKey).toLocaleDateString()}
                    </h3>
                    <div className="space-y-2">
                      {list
                        .slice()
                        .sort(
                          (a, b) =>
                            new Date(a.startsAt).getTime() -
                            new Date(b.startsAt).getTime(),
                        )
                        .map((appt) => {
                          const patient = patientById.get(appt.patientId)
                          const dentist = dentistById.get(appt.dentistId)
                          return (
                            <Card key={appt.id}>
                              <CardHeader className="py-3">
                                <div className="flex items-center justify-between">
                                  <CardTitle className="text-sm">
                                    {new Date(appt.startsAt).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </CardTitle>
                                  <Badge variant="secondary">{appt.status}</Badge>
                                </div>
                                <CardDescription className="flex items-center gap-2 flex-wrap">
                                  <User className="w-3 h-3" />
                                  {patient?.fullName ?? "Paciente"}
                                  <span>·</span>
                                  <span>{dentist?.fullName ?? "Dentista"}</span>
                                  {appt.reason ? (
                                    <>
                                      <span>·</span>
                                      <span>{appt.reason}</span>
                                    </>
                                  ) : null}
                                </CardDescription>
                              </CardHeader>
                            </Card>
                          )
                        })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}

export default function CalendarPage() {
  return (
    <AuthGate>
      <CalendarPageInner />
    </AuthGate>
  )
}

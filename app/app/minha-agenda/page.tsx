"use client"

import { useEffect, useMemo, useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Calendar as CalIcon, Clock, Loader2, User } from "lucide-react"
import { AuthGate } from "@/lib/auth-gate"
import {
  appointmentsApi,
  patientsApi,
  type AppointmentRecord,
  type PatientSummary,
} from "@/lib/api-client"
import { errorMessage } from "@/lib/errors"

function MinhaAgendaInner() {
  const { toast } = useToast()
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([])
  const [patients, setPatients] = useState<PatientSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    Promise.all([
      appointmentsApi.listMine(),
      patientsApi.list().catch(() => [] as PatientSummary[]),
    ])
      .then(([appts, ps]) => {
        if (!alive) return
        setAppointments(appts)
        setPatients(ps)
      })
      .catch((err) => {
        if (!alive) return
        toast({
          title: "Falha ao carregar minha agenda",
          description: errorMessage(err),
          variant: "destructive",
        })
      })
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const patientById = useMemo(() => {
    const m = new Map<string, PatientSummary>()
    patients.forEach((p) => m.set(p.id, p))
    return m
  }, [patients])

  const sorted = useMemo(
    () =>
      appointments
        .slice()
        .sort(
          (a, b) =>
            new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
        ),
    [appointments],
  )

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 bg-gradient-to-b from-white to-secondary">
          <div className="border-b border-border bg-white/80 backdrop-blur-sm sticky top-0 z-10">
            <div className="flex items-center gap-4 px-6 py-4">
              <SidebarTrigger />
              <h1 className="text-2xl font-bold text-foreground">Minha agenda</h1>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {loading ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                </CardContent>
              </Card>
            ) : sorted.length === 0 ? (
              <Card className="border-dashed border-2">
                <CardContent className="py-12 text-center text-muted-foreground">
                  Você não tem agendamentos.
                </CardContent>
              </Card>
            ) : (
              sorted.map((appt) => {
                const startsAt = new Date(appt.startsAt)
                const patient = patientById.get(appt.patientId)
                return (
                  <Card key={appt.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          <CalIcon className="w-4 h-4" />
                          {startsAt.toLocaleDateString()}
                          <Clock className="w-4 h-4 ml-2" />
                          {startsAt.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </CardTitle>
                        <Badge variant="secondary">{appt.status}</Badge>
                      </div>
                      <CardDescription className="flex items-center gap-2 flex-wrap">
                        <User className="w-3 h-3" />
                        {patient?.fullName ?? "Paciente"}
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
              })
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}

export default function MinhaAgendaPage() {
  return (
    <AuthGate>
      <MinhaAgendaInner />
    </AuthGate>
  )
}

"use client";

import { AppSidebar } from "@/components/app-sidebar";
import {
  AppointmentDialog,
  statusLabel,
  statusVariant,
} from "@/components/appointment-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";
import {
  appointmentsApi,
  clinicsApi,
  patientsApi,
  type AppointmentRecord,
  type AppointmentStatus,
  type DentistSummary,
  type PatientSummary,
} from "@/lib/api-client";
import { AuthGate } from "@/lib/auth-gate";
import { errorMessage } from "@/lib/errors";
import { Calendar, Check, Clock, Loader2, Plus, User, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

function AgendamentosPageInner() {
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [dentists, setDentists] = useState<DentistSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<AppointmentRecord | null>(null);
  const [filterDentist, setFilterDentist] = useState<string>("all");
  const [busyId, setBusyId] = useState<string | null>(null);

  const patientById = useMemo(() => {
    const m = new Map<string, PatientSummary>();
    patients.forEach((p) => m.set(p.id, p));
    return m;
  }, [patients]);

  const dentistById = useMemo(() => {
    const m = new Map<string, DentistSummary>();
    dentists.forEach((d) => m.set(d.userId, d));
    return m;
  }, [dentists]);

  async function refresh() {
    try {
      const params =
        filterDentist !== "all" ? { dentistId: filterDentist } : undefined;
      const [list, ps, ds] = await Promise.all([
        appointmentsApi.list(params),
        patientsApi.list().catch(() => [] as PatientSummary[]),
        clinicsApi.listDentists().catch(() => [] as DentistSummary[]),
      ]);
      setAppointments(list);
      setPatients(ps);
      setDentists(ds);
    } catch (err) {
      toast({
        title: "Falha ao carregar agendamentos",
        description: errorMessage(err),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterDentist]);

  function upsertLocal(saved: AppointmentRecord) {
    setAppointments((prev) => {
      const idx = prev.findIndex((a) => a.id === saved.id);
      if (idx === -1) return [...prev, saved];
      const copy = prev.slice();
      copy[idx] = saved;
      return copy;
    });
  }

  async function approve(id: string) {
    setBusyId(id);
    try {
      const saved = await appointmentsApi.approve(id);
      upsertLocal(saved);
      toast({ title: "Solicitação confirmada" });
    } catch (err) {
      toast({
        title: "Falha ao confirmar",
        description: errorMessage(err),
        variant: "destructive",
      });
    } finally {
      setBusyId(null);
    }
  }

  async function reject(id: string) {
    setBusyId(id);
    try {
      const saved = await appointmentsApi.reject(id);
      upsertLocal(saved);
      toast({ title: "Solicitação recusada" });
    } catch (err) {
      toast({
        title: "Falha ao recusar",
        description: errorMessage(err),
        variant: "destructive",
      });
    } finally {
      setBusyId(null);
    }
  }

  const sorted = useMemo(
    () =>
      appointments
        .slice()
        .sort(
          (a, b) =>
            new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
        ),
    [appointments],
  );

  const pending = sorted.filter((a) => a.status === "requested");
  const others = sorted.filter((a) => a.status !== "requested");

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 bg-gradient-to-b from-white to-secondary">
          <div className="border-b border-border bg-white/80 backdrop-blur-sm sticky top-0 z-10">
            <div className="flex items-center gap-4 px-6 py-4">
              <SidebarTrigger />
              <h1 className="text-2xl font-bold text-foreground">
                Agendamentos
              </h1>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <Select value={filterDentist} onValueChange={setFilterDentist}>
                <SelectTrigger className="w-full sm:w-64">
                  <SelectValue placeholder="Filtrar por dentista" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os dentistas</SelectItem>
                  {dentists.map((d) => (
                    <SelectItem key={d.userId} value={d.userId}>
                      {d.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Novo agendamento
              </Button>
            </div>

            {loading ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                </CardContent>
              </Card>
            ) : (
              <>
                {pending.length > 0 && (
                  <section className="space-y-3">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold">
                        Solicitações pendentes
                      </h2>
                      <Badge variant="outline">{pending.length}</Badge>
                    </div>
                    <div className="grid gap-3">
                      {pending.map((appt) => {
                        const startsAt = new Date(appt.startsAt);
                        const patient = patientById.get(appt.patientId);
                        const dentist = dentistById.get(appt.dentistId);
                        return (
                          <Card
                            key={appt.id}
                            className="border-dashed border-2"
                          >
                            <CardHeader>
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <CardTitle className="text-base flex items-center gap-2">
                                  <Calendar className="w-4 h-4" />
                                  {startsAt.toLocaleDateString()}{" "}
                                  <Clock className="w-4 h-4 ml-2" />
                                  {startsAt.toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </CardTitle>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      approve(appt.id);
                                    }}
                                    disabled={busyId === appt.id}
                                  >
                                    <Check className="w-4 h-4 mr-1" />
                                    Confirmar
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      reject(appt.id);
                                    }}
                                    disabled={busyId === appt.id}
                                  >
                                    <X className="w-4 h-4 mr-1" />
                                    Recusar
                                  </Button>
                                </div>
                              </div>
                              <CardDescription
                                className="flex items-center gap-2 flex-wrap cursor-pointer"
                                onClick={() => setEditing(appt)}
                              >
                                <User className="w-3 h-3" />
                                {patient?.fullName ??
                                  appt.patientId.slice(0, 8)}
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
                        );
                      })}
                    </div>
                  </section>
                )}

                {others.length === 0 && pending.length === 0 ? (
                  <Card className="border-dashed border-2">
                    <CardContent className="py-12 text-center text-muted-foreground">
                      Nenhum agendamento encontrado.
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-3">
                    {others.map((appt) => {
                      const startsAt = new Date(appt.startsAt);
                      const patient = patientById.get(appt.patientId);
                      const dentist = dentistById.get(appt.dentistId);
                      return (
                        <Card
                          key={appt.id}
                          className="cursor-pointer transition-colors hover:bg-muted/40"
                          onClick={() => setEditing(appt)}
                        >
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                {startsAt.toLocaleDateString()}{" "}
                                <Clock className="w-4 h-4 ml-2" />
                                {startsAt.toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </CardTitle>
                              <Badge
                                variant={statusVariant(
                                  appt.status as AppointmentStatus,
                                )}
                              >
                                {statusLabel(
                                  appt.status as AppointmentStatus,
                                )}
                              </Badge>
                            </div>
                            <CardDescription className="flex items-center gap-2 flex-wrap">
                              <User className="w-3 h-3" />
                              {patient?.fullName ??
                                appt.patientId.slice(0, 8)}
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
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      <AppointmentDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
        patients={patients}
        dentists={dentists}
        onSaved={(a) => upsertLocal(a)}
      />

      <AppointmentDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        mode="edit"
        appointment={editing}
        patients={patients}
        dentists={dentists}
        onSaved={(a) => upsertLocal(a)}
        onCancelled={(a) => upsertLocal(a)}
      />
    </SidebarProvider>
  );
}

export default function AgendamentosPage() {
  return (
    <AuthGate>
      <AgendamentosPageInner />
    </AuthGate>
  );
}

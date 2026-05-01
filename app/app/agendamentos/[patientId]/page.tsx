"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import {
  AppointmentDialog,
  statusLabel,
  statusVariant,
} from "@/components/appointment-dialog";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Calendar,
  Check,
  Clock,
  Copy,
  Link2,
  Loader2,
  Plus,
  User,
  X,
} from "lucide-react";
import { AuthGate } from "@/lib/auth-gate";
import { useActiveClinic } from "@/lib/use-active-clinic";
import {
  appointmentsApi,
  bookingApi,
  clinicsApi,
  patientsApi,
  type AppointmentRecord,
  type AppointmentStatus,
  type DentistSummary,
  type PatientSummary,
} from "@/lib/api-client";
import { errorMessage } from "@/lib/errors";

function PatientAppointmentsInner() {
  const params = useParams<{ patientId: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const patientId = params.patientId;
  const { clinic } = useActiveClinic();

  const [patient, setPatient] = useState<PatientSummary | null>(null);
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [dentists, setDentists] = useState<DentistSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [editingAppt, setEditingAppt] = useState<AppointmentRecord | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingUrl, setBookingUrl] = useState<string | null>(null);
  const [generatingToken, setGeneratingToken] = useState(false);

  async function loadAll() {
    try {
      const [p, appts, ds] = await Promise.all([
        patientsApi.get(patientId),
        appointmentsApi.listForPatient(patientId).catch(() => [] as AppointmentRecord[]),
        clinicsApi.listDentists().catch(() => [] as DentistSummary[]),
      ]);
      setPatient(p);
      setAppointments(appts);
      setDentists(ds);
    } catch (err) {
      toast({
        title: "Falha ao carregar dados",
        description: errorMessage(err),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  const dentistById = useMemo(() => {
    const m = new Map<string, DentistSummary>();
    dentists.forEach((d) => m.set(d.userId, d));
    return m;
  }, [dentists]);

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

  async function handleGenerateBookingLink() {
    if (!clinic) return;
    setGeneratingToken(true);
    try {
      const issued = await bookingApi.createToken(clinic.id, patientId);
      setBookingUrl(issued.url);
    } catch (err) {
      toast({
        title: "Falha ao gerar link",
        description: errorMessage(err),
        variant: "destructive",
      });
    } finally {
      setGeneratingToken(false);
    }
  }

  async function copyBookingUrl() {
    if (!bookingUrl) return;
    try {
      await navigator.clipboard.writeText(bookingUrl);
      toast({ title: "Link copiado" });
    } catch {
      toast({
        title: "Não foi possível copiar",
        description: "Copie manualmente abaixo.",
        variant: "destructive",
      });
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
  const historyStatuses = ["completed", "cancelled", "no_show"];
  const now = new Date().getTime();
  
  const upcoming = sorted.filter(
    (a) =>
      a.status !== "requested" &&
      !historyStatuses.includes(a.status) &&
      new Date(a.startsAt).getTime() >= now,
  );
  const history = sorted.filter(
    (a) =>
      a.status !== "requested" &&
      (historyStatuses.includes(a.status) ||
        new Date(a.startsAt).getTime() < now),
  ).sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime());

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
    );
  }

  if (!patient) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <main className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-4">
            <p>Paciente não encontrado.</p>
            <Button variant="outline" onClick={() => router.push("/clients")}>
              Voltar para Pacientes
            </Button>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 bg-gradient-to-b from-white to-secondary">
          <div className="border-b border-border bg-white/80 backdrop-blur-sm sticky top-0 z-10">
            <div className="flex items-center gap-4 px-6 py-4">
              <SidebarTrigger />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/clients/${patientId}`)}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Ficha do Paciente
              </Button>
              <h1 className="text-2xl font-bold text-foreground">
                Agendamentos — {patient.fullName}
              </h1>
            </div>
          </div>

          <div className="p-6 space-y-8">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <p className="text-muted-foreground">
                Gerencie todas as consultas e solicitações deste paciente.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setBookingUrl(null);
                    setBookingOpen(true);
                  }}
                >
                  <Link2 className="w-4 h-4 mr-2" />
                  Gerar link de agendamento
                </Button>
                <Button onClick={() => setCreateOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova consulta
                </Button>
              </div>
            </div>

            {pending.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                    Solicitações pendentes
                  </h2>
                  <Badge variant="outline" className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
                    {pending.length}
                  </Badge>
                </div>
                <div className="grid gap-3">
                  {pending.map((appt) => {
                    const startsAt = new Date(appt.startsAt);
                    const dentist = dentistById.get(appt.dentistId);
                    return (
                      <Card key={appt.id} className="border-orange-200 dark:border-orange-900 shadow-sm bg-orange-50/50 dark:bg-orange-950/20">
                        <CardHeader>
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <CardTitle className="text-base flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-orange-500" />
                              {startsAt.toLocaleDateString()}{" "}
                              <Clock className="w-4 h-4 ml-2 text-orange-500" />
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
                            className="flex items-center gap-2 flex-wrap cursor-pointer mt-1"
                            onClick={() => setEditingAppt(appt)}
                          >
                            <User className="w-3 h-3" />
                            <span>Dentista: {dentist?.fullName ?? "Não atribuído"}</span>
                            {appt.reason ? (
                              <>
                                <span>·</span>
                                <span>Motivo: {appt.reason}</span>
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

            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Próximas consultas</h2>
              {upcoming.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-8 text-center text-muted-foreground text-sm">
                    Nenhuma consulta futura agendada.
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-3">
                  {upcoming.map((appt) => {
                    const startsAt = new Date(appt.startsAt);
                    const dentist = dentistById.get(appt.dentistId);
                    return (
                      <Card
                        key={appt.id}
                        className="cursor-pointer transition-colors hover:bg-muted/40 hover:border-primary/50"
                        onClick={() => setEditingAppt(appt)}
                      >
                        <CardHeader>
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <CardTitle className="text-base flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-primary" />
                              {startsAt.toLocaleDateString()}{" "}
                              <Clock className="w-4 h-4 ml-2 text-primary" />
                              {startsAt.toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </CardTitle>
                            <Badge variant={statusVariant(appt.status as AppointmentStatus)}>
                              {statusLabel(appt.status as AppointmentStatus)}
                            </Badge>
                          </div>
                          <CardDescription className="flex items-center gap-2 flex-wrap mt-1">
                            <User className="w-3 h-3" />
                            <span>Dentista: {dentist?.fullName ?? "Não atribuído"}</span>
                            {appt.reason ? (
                              <>
                                <span>·</span>
                                <span>Motivo: {appt.reason}</span>
                              </>
                            ) : null}
                          </CardDescription>
                        </CardHeader>
                        {appt.notes ? (
                          <CardContent className="pt-0">
                            <p className="text-sm text-muted-foreground bg-muted/30 p-2 rounded-md">
                              {appt.notes}
                            </p>
                          </CardContent>
                        ) : null}
                      </Card>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Histórico</h2>
              {history.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-8 text-center text-muted-foreground text-sm">
                    Nenhum histórico de consultas.
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-3 opacity-80 hover:opacity-100 transition-opacity">
                  {history.map((appt) => {
                    const startsAt = new Date(appt.startsAt);
                    const dentist = dentistById.get(appt.dentistId);
                    return (
                      <Card
                        key={appt.id}
                        className="cursor-pointer transition-colors hover:bg-muted/40 bg-muted/10"
                        onClick={() => setEditingAppt(appt)}
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
                            <Badge variant={statusVariant(appt.status as AppointmentStatus)}>
                              {statusLabel(appt.status as AppointmentStatus)}
                            </Badge>
                          </div>
                          <CardDescription className="flex items-center gap-2 flex-wrap mt-1">
                            <User className="w-3 h-3" />
                            <span>Dentista: {dentist?.fullName ?? "Não atribuído"}</span>
                            {appt.reason ? (
                              <>
                                <span>·</span>
                                <span>Motivo: {appt.reason}</span>
                              </>
                            ) : null}
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </main>
      </div>

      <AppointmentDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
        patients={patient ? [patient] : []}
        dentists={dentists}
        lockPatientId={patientId}
        onSaved={(a) => upsertLocal(a)}
      />

      <AppointmentDialog
        open={!!editingAppt}
        onOpenChange={(o) => !o && setEditingAppt(null)}
        mode="edit"
        appointment={editingAppt}
        patients={patient ? [patient] : []}
        dentists={dentists}
        lockPatientId={patientId}
        onSaved={(a) => upsertLocal(a)}
        onCancelled={(a) => upsertLocal(a)}
      />

      <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link de agendamento do paciente</DialogTitle>
            <DialogDescription>
              Gere um link único para o paciente solicitar um horário. A
              solicitação ficará pendente para confirmação da clínica.
            </DialogDescription>
          </DialogHeader>
          {bookingUrl ? (
            <div className="space-y-2">
              <Label>URL</Label>
              <div className="flex gap-2">
                <Input value={bookingUrl} readOnly />
                <Button type="button" variant="outline" onClick={copyBookingUrl}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Válido por 7 dias. Pode ser usado uma única vez.
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Clique em &quot;Gerar link&quot; para criar uma URL única.
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setBookingOpen(false)}>
              Fechar
            </Button>
            <Button onClick={handleGenerateBookingLink} disabled={generatingToken || !clinic}>
              {generatingToken ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Link2 className="w-4 h-4 mr-2" />
              )}
              {bookingUrl ? "Gerar outro" : "Gerar link"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}

export default function PatientAppointmentsPage() {
  return (
    <AuthGate>
      <PatientAppointmentsInner />
    </AuthGate>
  );
}

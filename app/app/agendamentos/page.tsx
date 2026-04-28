"use client";

import type React from "react";

import { AppSidebar } from "@/components/app-sidebar";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  appointmentsApi,
  clinicsApi,
  patientsApi,
  type AppointmentRecord,
  type DentistSummary,
  type PatientSummary,
} from "@/lib/api-client";
import { AuthGate } from "@/lib/auth-gate";
import { errorMessage } from "@/lib/errors";
import { Calendar, Clock, Loader2, Plus, User } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

function statusVariant(s: string) {
  switch (s) {
    case "confirmed":
    case "completed":
      return "default" as const;
    case "cancelled":
    case "no_show":
      return "destructive" as const;
    default:
      return "secondary" as const;
  }
}

function AgendamentosPageInner() {
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [dentists, setDentists] = useState<DentistSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filterDentist, setFilterDentist] = useState<string>("all");
  const [form, setForm] = useState({
    patientId: "",
    dentistId: "",
    date: "",
    time: "",
    durationMinutes: 60,
    reason: "",
    notes: "",
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.date || !form.time) return;
    setSubmitting(true);
    try {
      const startsAt = new Date(`${form.date}T${form.time}:00`).toISOString();
      const endsAt = new Date(
        new Date(startsAt).getTime() + form.durationMinutes * 60_000,
      ).toISOString();
      const created = await appointmentsApi.create({
        patientId: form.patientId,
        dentistId: form.dentistId,
        startsAt,
        endsAt,
        reason: form.reason || undefined,
        notes: form.notes || undefined,
      });
      setAppointments((prev) => [...prev, created]);
      setIsDialogOpen(false);
      setForm({
        patientId: "",
        dentistId: "",
        date: "",
        time: "",
        durationMinutes: 60,
        reason: "",
        notes: "",
      });
      toast({ title: "Agendamento criado" });
    } catch (err) {
      toast({
        title: "Falha ao criar",
        description: errorMessage(err),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

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

              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Novo agendamento
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Novo agendamento</DialogTitle>
                    <DialogDescription>
                      Selecione paciente, dentista e horário
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Paciente</Label>
                      <Select
                        value={form.patientId}
                        onValueChange={(v) =>
                          setForm({ ...form, patientId: v })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {patients.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.fullName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Dentista</Label>
                      <Select
                        value={form.dentistId}
                        onValueChange={(v) =>
                          setForm({ ...form, dentistId: v })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {dentists.map((d) => (
                            <SelectItem key={d.userId} value={d.userId}>
                              {d.fullName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-2">
                        <Label>Data</Label>
                        <Input
                          type="date"
                          value={form.date}
                          onChange={(e) =>
                            setForm({ ...form, date: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Hora</Label>
                        <Input
                          type="time"
                          value={form.time}
                          onChange={(e) =>
                            setForm({ ...form, time: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Duração (min)</Label>
                        <Input
                          type="number"
                          min={15}
                          step={15}
                          value={form.durationMinutes}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              durationMinutes: Number(e.target.value),
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Motivo</Label>
                      <Input
                        value={form.reason}
                        onChange={(e) =>
                          setForm({ ...form, reason: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Observações</Label>
                      <Textarea
                        value={form.notes}
                        onChange={(e) =>
                          setForm({ ...form, notes: e.target.value })
                        }
                        rows={3}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        disabled={
                          submitting || !form.patientId || !form.dentistId
                        }
                      >
                        {submitting ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : null}
                        Criar
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {loading ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                </CardContent>
              </Card>
            ) : appointments.length === 0 ? (
              <Card className="border-dashed border-2">
                <CardContent className="py-12 text-center text-muted-foreground">
                  Nenhum agendamento encontrado.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {appointments
                  .slice()
                  .sort(
                    (a, b) =>
                      new Date(a.startsAt).getTime() -
                      new Date(b.startsAt).getTime(),
                  )
                  .map((appt) => {
                    const startsAt = new Date(appt.startsAt);
                    const patient = patientById.get(appt.patientId);
                    const dentist = dentistById.get(appt.dentistId);
                    return (
                      <Card key={appt.id}>
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
                            <Badge variant={statusVariant(appt.status)}>
                              {appt.status}
                            </Badge>
                          </div>
                          <CardDescription className="flex items-center gap-2 flex-wrap">
                            <User className="w-3 h-3" />
                            {patient?.fullName ?? appt.patientId.slice(0, 8)}
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
          </div>
        </main>
      </div>
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

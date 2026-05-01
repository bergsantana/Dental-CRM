"use client";

import { useEffect, useState, useRef, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import {
  appointmentsApi,
  type AppointmentRecord,
  type AppointmentStatus,
  type DentistSummary,
  type PatientSummary,
} from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { errorMessage } from "@/lib/errors";

export const ALLOWED_TRANSITIONS: Record<
  AppointmentStatus,
  ReadonlyArray<AppointmentStatus>
> = {
  requested: ["confirmed", "cancelled"],
  scheduled: ["confirmed", "completed", "cancelled", "no_show"],
  confirmed: ["completed", "cancelled", "no_show"],
  completed: [],
  cancelled: [],
  no_show: [],
};

export function statusLabel(s: AppointmentStatus): string {
  switch (s) {
    case "requested":
      return "Solicitado";
    case "scheduled":
      return "Agendado";
    case "confirmed":
      return "Confirmado";
    case "completed":
      return "Concluído";
    case "cancelled":
      return "Cancelado";
    case "no_show":
      return "Faltou";
  }
}

export function statusVariant(
  s: AppointmentStatus,
): "default" | "destructive" | "secondary" | "outline" {
  switch (s) {
    case "confirmed":
    case "completed":
      return "default";
    case "cancelled":
    case "no_show":
      return "destructive";
    case "requested":
      return "outline";
    default:
      return "secondary";
  }
}

function toLocalDateTimeInputs(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

export type AppointmentDialogMode = "create" | "edit";

export interface AppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: AppointmentDialogMode;
  appointment?: AppointmentRecord | null;
  patients: PatientSummary[];
  dentists: DentistSummary[];
  /** Lock the patient select (e.g. on a patient detail page). */
  lockPatientId?: string;
  /** Lock the dentist select (e.g. on minha-agenda). */
  lockDentistId?: string;
  onSaved?: (appt: AppointmentRecord) => void;
  onCancelled?: (appt: AppointmentRecord) => void;
  /** Permission flag — hides the "Cancelar" button when false. */
  canCancel?: boolean;
}

interface FormState {
  patientId: string;
  dentistId: string;
  date: string;
  time: string;
  durationMinutes: number;
  reason: string;
  notes: string;
  status?: AppointmentStatus;
}

const EMPTY_FORM: FormState = {
  patientId: "",
  dentistId: "",
  date: "",
  time: "",
  durationMinutes: 30,
  reason: "",
  notes: "",
  status: undefined,
};

export function AppointmentDialog({
  open,
  onOpenChange,
  mode,
  appointment,
  patients,
  dentists,
  lockPatientId,
  lockDentistId,
  onSaved,
  onCancelled,
  canCancel = true,
}: AppointmentDialogProps) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [patientSearch, setPatientSearch] = useState("");

  const lastApptRef = useRef<AppointmentRecord | null>(null);
  if (appointment) {
    lastApptRef.current = appointment;
  }
  const activeAppt = appointment || lastApptRef.current;

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && appointment) {
      const { date, time } = toLocalDateTimeInputs(appointment.startsAt);
      const durationMinutes = Math.max(
        5,
        Math.round(
          (new Date(appointment.endsAt).getTime() -
            new Date(appointment.startsAt).getTime()) /
            60000,
        ),
      );
      setForm({
        patientId: appointment.patientId,
        dentistId: appointment.dentistId,
        date,
        time,
        durationMinutes,
        reason: appointment.reason ?? "",
        notes: appointment.notes ?? "",
        status: appointment.status as AppointmentStatus,
      });
    } else {
      setForm({
        ...EMPTY_FORM,
        patientId: lockPatientId ?? "",
        dentistId: lockDentistId ?? "",
      });
    }
    setPatientSearch("");
  }, [open, mode, appointment, lockPatientId, lockDentistId]);

  const isTerminal =
    mode === "edit" && activeAppt
      ? ALLOWED_TRANSITIONS[activeAppt.status as AppointmentStatus].length === 0
      : false;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.date || !form.time || !form.patientId || !form.dentistId) return;
    setSubmitting(true);
    try {
      const startsAt = new Date(`${form.date}T${form.time}:00`).toISOString();
      const endsAt = new Date(
        new Date(startsAt).getTime() + form.durationMinutes * 60_000,
      ).toISOString();
      let saved: AppointmentRecord;
      if (mode === "create") {
        saved = await appointmentsApi.create({
          patientId: form.patientId,
          dentistId: form.dentistId,
          startsAt,
          endsAt,
          reason: form.reason || undefined,
          notes: form.notes || undefined,
        });
        toast({ title: "Agendamento criado" });
      } else if (appointment) {
        saved = await appointmentsApi.update(appointment.id, {
          dentistId: form.dentistId,
          startsAt,
          endsAt,
          reason: form.reason || undefined,
          notes: form.notes || undefined,
          status: form.status,
        });
        toast({ title: "Agendamento atualizado" });
      } else {
        return;
      }
      onSaved?.(saved);
      onOpenChange(false);
    } catch (err) {
      toast({
        title: mode === "create" ? "Falha ao criar" : "Falha ao atualizar",
        description: errorMessage(err),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };



  const handleConfirmCancel = async () => {
    if (!appointment) return;
    setSubmitting(true);
    try {
      const saved = await appointmentsApi.cancel(
        appointment.id,
        cancelReason || undefined,
      );
      onCancelled?.(saved);
      toast({ title: "Agendamento cancelado" });
      setCancelOpen(false);
      setCancelReason("");
      onOpenChange(false);
    } catch (err) {
      toast({
        title: "Falha ao cancelar",
        description: errorMessage(err),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const statusesToShow: AppointmentStatus[] =
    mode === "edit" && activeAppt
      ? Array.from(new Set([
          activeAppt.status as AppointmentStatus,
          ...ALLOWED_TRANSITIONS[activeAppt.status as AppointmentStatus].filter(
            (s) => s !== "cancelled",
          )
        ]))
      : [];

  const patientSelectDisabled = mode === "edit" || !!lockPatientId || isTerminal;
  const searchDigits = patientSearch.replace(/\D+/g, "");
  const searchTermLc = patientSearch.trim().toLowerCase();
  const filteredPatients = patientSearch.trim()
    ? patients.filter((p) => {
        const nameMatch = p.fullName.toLowerCase().includes(searchTermLc);
        const cpfDigits = (p.cpf ?? "").replace(/\D+/g, "");
        const cpfMatch =
          searchDigits.length > 0 && cpfDigits.includes(searchDigits);
        return nameMatch || cpfMatch;
      })
    : patients;
  // Always include the currently selected patient so the Select can resolve
  // its value to a label even when filtered out by the search box.
  const selectedPatient = patients.find((p) => p.id === form.patientId);
  const visiblePatients =
    selectedPatient && !filteredPatients.some((p) => p.id === selectedPatient.id)
      ? [selectedPatient, ...filteredPatients]
      : filteredPatients;

  const formatPatientLabel = (p: PatientSummary) =>
    p.cpf ? `${p.fullName} — CPF ${p.cpf}` : p.fullName;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {mode === "create" ? "Novo agendamento" : "Editar agendamento"}
            </DialogTitle>
            <DialogDescription>
              {mode === "create"
                ? "Selecione paciente, dentista e horário"
                : isTerminal
                  ? `Status atual: ${statusLabel(activeAppt!.status as AppointmentStatus)} (não editável)`
                  : "Altere horário, motivo ou status"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Paciente</Label>
              {!patientSelectDisabled && (
                <Input
                  placeholder="Buscar por nome ou CPF"
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                />
              )}
              <Select
                value={form.patientId}
                onValueChange={(v) => setForm({ ...form, patientId: v })}
                disabled={patientSelectDisabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {visiblePatients.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      Nenhum paciente encontrado
                    </div>
                  ) : (
                    visiblePatients.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {formatPatientLabel(p)}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Dentista</Label>
              <Select
                value={form.dentistId}
                onValueChange={(v) => setForm({ ...form, dentistId: v })}
                disabled={!!lockDentistId || isTerminal}
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
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  disabled={isTerminal}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Hora</Label>
                <Input
                  type="time"
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                  disabled={isTerminal}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Duração (min)</Label>
                <Input
                  type="number"
                  min={5}
                  step={5}
                  value={form.durationMinutes}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      durationMinutes: Number(e.target.value),
                    })
                  }
                  disabled={isTerminal}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Motivo</Label>
              <Input
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                disabled={isTerminal}
              />
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
                disabled={isTerminal}
              />
            </div>

            {mode === "edit" && !isTerminal && statusesToShow.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2 border-t">
                {statusesToShow.map((s) => (
                  <Button
                    key={s}
                    type="button"
                    size="sm"
                    variant={form.status === s ? "default" : "outline"}
                    disabled={submitting}
                    onClick={() => setForm({ ...form, status: s })}
                  >
                    Marcar como {statusLabel(s).toLowerCase()}
                  </Button>
                ))}
              </div>
            )}

            <DialogFooter className="gap-2">
              {mode === "edit" && canCancel && !isTerminal && (
                <Button
                  type="button"
                  variant="destructive"
                  disabled={submitting}
                  onClick={() => setCancelOpen(true)}
                >
                  Cancelar agendamento
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Fechar
              </Button>
              {!isTerminal && (
                <Button
                  type="submit"
                  disabled={
                    submitting || !form.patientId || !form.dentistId
                  }
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  {mode === "create" ? "Criar" : "Salvar"}
                </Button>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar este agendamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação marca o agendamento como cancelado. Você pode informar
              um motivo opcional abaixo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Motivo (opcional)"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            rows={2}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCancel}
              disabled={submitting}
            >
              Confirmar cancelamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

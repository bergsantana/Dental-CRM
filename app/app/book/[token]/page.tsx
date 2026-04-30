"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import {
  bookingApi,
  type BookingPublicPayload,
} from "@/lib/api-client"
import { errorMessage, isApiError } from "@/lib/errors"
import { CheckCircle2, Loader2 } from "lucide-react"

interface FatalState {
  title: string
  description: string
}

function PublicBookingPage() {
  const params = useParams<{ token: string }>()
  const token = params.token
  const { toast } = useToast()

  const [data, setData] = useState<BookingPublicPayload | null>(null)
  const [fatal, setFatal] = useState<FatalState | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState<{
    when: string
    dentist: string
  } | null>(null)

  const [dentistId, setDentistId] = useState<string>("")
  const [date, setDate] = useState<string>("")
  const [time, setTime] = useState<string>("")
  const [durationMinutes, setDurationMinutes] = useState<number>(30)
  const [reason, setReason] = useState<string>("")

  useEffect(() => {
    let alive = true
    bookingApi
      .getPublic(token)
      .then((p) => {
        if (!alive) return
        setData(p)
      })
      .catch((err) => {
        if (!alive) return
        if (isApiError(err)) {
          if (err.status === 404) {
            setFatal({
              title: "Link inválido",
              description: "Este link de agendamento não foi encontrado.",
            })
            return
          }
          if (err.status === 410) {
            setFatal({
              title: "Link expirado ou já utilizado",
              description:
                "Solicite um novo link à clínica para continuar com o agendamento.",
            })
            return
          }
        }
        setFatal({
          title: "Falha ao carregar",
          description: errorMessage(err),
        })
      })
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [token])

  const busyForDentist = useMemo(() => {
    if (!data || !dentistId) return [] as { startsAt: Date; endsAt: Date }[]
    return data.busySlots
      .filter((s) => s.dentistId === dentistId)
      .map((s) => ({
        startsAt: new Date(s.startsAt),
        endsAt: new Date(s.endsAt),
      }))
  }, [data, dentistId])

  const proposedRange = useMemo(() => {
    if (!date || !time) return null
    const start = new Date(`${date}T${time}:00`)
    if (Number.isNaN(start.getTime())) return null
    const end = new Date(start.getTime() + durationMinutes * 60_000)
    return { start, end }
  }, [date, time, durationMinutes])

  const overlapsBusy = useMemo(() => {
    if (!proposedRange) return false
    return busyForDentist.some(
      (b) =>
        b.startsAt < proposedRange.end && b.endsAt > proposedRange.start,
    )
  }, [busyForDentist, proposedRange])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!proposedRange || !dentistId) return
    setSubmitting(true)
    try {
      const res = await bookingApi.submit(token, {
        dentistId,
        startsAt: proposedRange.start.toISOString(),
        durationMinutes,
        reason: reason || undefined,
      })
      const dentist =
        data?.dentists.find((d) => d.id === dentistId)?.fullName ?? ""
      setSuccess({
        when: new Date(res.appointment.startsAt).toLocaleString(),
        dentist,
      })
    } catch (err) {
      if (isApiError(err)) {
        if (err.status === 410) {
          setFatal({
            title: "Link expirado ou já utilizado",
            description:
              "Este link não está mais disponível. Solicite um novo link à clínica.",
          })
          return
        }
        if (err.status === 409) {
          toast({
            title: "Horário indisponível",
            description:
              "Este horário acabou de ser ocupado. Escolha outro horário.",
            variant: "destructive",
          })
          return
        }
      }
      toast({
        title: "Falha ao enviar solicitação",
        description: errorMessage(err),
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (fatal) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-secondary">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>{fatal.title}</CardTitle>
            <CardDescription>{fatal.description}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-secondary">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Solicitação enviada
            </CardTitle>
            <CardDescription>
              {data?.clinic.name} receberá sua solicitação para{" "}
              <strong>{success.when}</strong>
              {success.dentist ? (
                <>
                  {" "}
                  com <strong>{success.dentist}</strong>
                </>
              ) : null}
              . Você receberá uma confirmação em breve.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="min-h-screen p-6 bg-secondary">
      <div className="mx-auto max-w-xl">
        <Card>
          <CardHeader>
            <CardTitle>Agendar consulta — {data.clinic.name}</CardTitle>
            <CardDescription>
              Olá, <strong>{data.patient.fullName}</strong>. Selecione um
              dentista e horário desejado. Sua solicitação será confirmada
              pela clínica.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Dentista</Label>
                <Select value={dentistId} onValueChange={setDentistId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {data.dentists.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.fullName}
                        {d.cro ? ` · CRO ${d.cro}` : ""}
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
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hora</Label>
                  <Input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Duração (min)</Label>
                  <Input
                    type="number"
                    min={5}
                    step={5}
                    value={durationMinutes}
                    onChange={(e) =>
                      setDurationMinutes(Number(e.target.value))
                    }
                  />
                </div>
              </div>

              {dentistId && busyForDentist.length > 0 && (
                <div className="text-xs text-muted-foreground space-y-1">
                  <p className="font-medium">
                    Horários já ocupados nas próximas 2 semanas:
                  </p>
                  <ul className="list-disc pl-5">
                    {busyForDentist.slice(0, 8).map((s, i) => (
                      <li key={i}>
                        {s.startsAt.toLocaleString()} —{" "}
                        {s.endsAt.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </li>
                    ))}
                    {busyForDentist.length > 8 && (
                      <li>… e mais {busyForDentist.length - 8}</li>
                    )}
                  </ul>
                </div>
              )}

              {overlapsBusy && (
                <p className="text-sm text-destructive">
                  Este horário conflita com um agendamento existente. Por
                  favor escolha outro horário.
                </p>
              )}

              <div className="space-y-2">
                <Label>Motivo (opcional)</Label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  maxLength={500}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={
                  submitting ||
                  !dentistId ||
                  !date ||
                  !time ||
                  overlapsBusy
                }
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Solicitar agendamento
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default PublicBookingPage

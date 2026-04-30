import type {
  ChatActionArgs,
  ChatActionKind,
  ChatActionPayload,
} from "@/lib/api-client"

export interface ParsedCommand {
  kind: "action" | "help" | "unknown" | "error"
  /** PT-BR text shown as the assistant's response when no API call is needed. */
  message?: string
  payload?: ChatActionPayload
}

const HELP_TEXT = `Comandos disponíveis:
• /ajuda — exibe esta mensagem
• /listar [n] — mostra próximos agendamentos do paciente (até n, padrão 5)
• /criar dentista=<uuid> data=<YYYY-MM-DD HH:mm> duracao=<min> [motivo="..."]
• /remarcar <appointmentId> data=<YYYY-MM-DD HH:mm> [duracao=<min>]
• /cancelar <appointmentId> [motivo="..."]
• /confirmar <appointmentId>
• /recusar <appointmentId> [motivo="..."]

Toda criação/alteração via chat passa por um passo de confirmação (preview).`

const KIND_BY_ALIAS: Record<string, ChatActionKind> = {
  listar: "list_upcoming",
  criar: "create",
  agendar: "create",
  remarcar: "reschedule",
  cancelar: "cancel",
  confirmar: "approve",
  aprovar: "approve",
  recusar: "reject",
  rejeitar: "reject",
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/**
 * Tokenize args supporting `key=value` and `key="value with spaces"`.
 * Bare positional tokens are returned in `positional`.
 */
function tokenize(rest: string): {
  positional: string[]
  kv: Record<string, string>
} {
  const positional: string[] = []
  const kv: Record<string, string> = {}
  // Match either key="..." or key=word or bare word.
  const re = /(\w+)=("([^"]*)"|(\S+))|(\S+)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(rest)) !== null) {
    if (m[1]) {
      kv[m[1].toLowerCase()] = m[3] !== undefined ? m[3] : m[4] ?? ""
    } else if (m[5]) {
      positional.push(m[5])
    }
  }
  return { positional, kv }
}

/**
 * Parses a `YYYY-MM-DD HH:mm` (or ISO8601) date string. Returns ISO string
 * in UTC, or null if invalid.
 */
function parseDateTime(raw: string): string | null {
  // Support both `YYYY-MM-DD HH:mm` and `YYYY-MM-DDTHH:mm[:ss][Z|±hh:mm]`.
  const normalized = raw.includes("T") ? raw : raw.replace(" ", "T")
  const d = new Date(normalized)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}

function parseInt5to480(raw: string | undefined): number | undefined {
  if (raw == null) return undefined
  const n = Number(raw)
  if (!Number.isFinite(n) || !Number.isInteger(n)) return undefined
  if (n < 5 || n > 480) return undefined
  return n
}

function parseLimit(raw: string | undefined): number | undefined {
  if (raw == null) return undefined
  const n = Number(raw)
  if (!Number.isFinite(n) || !Number.isInteger(n)) return undefined
  if (n < 1 || n > 50) return undefined
  return n
}

export function parseChatCommand(input: string): ParsedCommand {
  const text = input.trim()
  if (!text.startsWith("/")) {
    return { kind: "unknown" }
  }
  const space = text.indexOf(" ")
  const cmd = (space === -1 ? text.slice(1) : text.slice(1, space)).toLowerCase()
  const rest = space === -1 ? "" : text.slice(space + 1).trim()

  if (cmd === "ajuda" || cmd === "help") {
    return { kind: "help", message: HELP_TEXT }
  }

  const action = KIND_BY_ALIAS[cmd]
  if (!action) {
    return {
      kind: "error",
      message: `Comando desconhecido: /${cmd}. Use /ajuda para ver os comandos.`,
    }
  }

  const { positional, kv } = tokenize(rest)
  const args: ChatActionArgs = {}

  if (action === "list_upcoming") {
    const limit =
      parseLimit(kv.limite) ??
      parseLimit(kv.limit) ??
      (positional[0] ? parseLimit(positional[0]) : undefined)
    if (limit) args.limit = limit
    return {
      kind: "action",
      payload: { kind: "list_upcoming", mode: "preview", args },
    }
  }

  // Commands below require some args.
  if (action === "create") {
    if (!kv.dentista && !kv.dentistid) {
      return {
        kind: "error",
        message:
          "Falta dentista=<uuid>. Ex: /criar dentista=<uuid> data=2026-05-02 14:00 duracao=30",
      }
    }
    const dentistId = (kv.dentista ?? kv.dentistid).trim()
    if (!UUID_RE.test(dentistId)) {
      return {
        kind: "error",
        message: "dentista deve ser um UUID válido.",
      }
    }
    const dataRaw = kv.data ?? kv.startsat
    if (!dataRaw) {
      return {
        kind: "error",
        message:
          "Falta data=<YYYY-MM-DD HH:mm>. Ex: data=2026-05-02 14:00 (use aspas se houver espaços).",
      }
    }
    const startsAt = parseDateTime(dataRaw)
    if (!startsAt) {
      return { kind: "error", message: `Data inválida: ${dataRaw}` }
    }
    const durationMinutes = parseInt5to480(kv.duracao ?? kv.duration)
    if (!durationMinutes) {
      return {
        kind: "error",
        message: "Falta duracao=<minutos>, valor inteiro entre 5 e 480.",
      }
    }
    args.dentistId = dentistId
    args.startsAt = startsAt
    args.durationMinutes = durationMinutes
    if (kv.motivo) args.reason = kv.motivo
    return {
      kind: "action",
      payload: { kind: "create", mode: "preview", args },
    }
  }

  // Commands that target a specific appointment by UUID.
  const appointmentId = positional[0] ?? kv.id
  if (!appointmentId || !UUID_RE.test(appointmentId)) {
    return {
      kind: "error",
      message: `Informe o ID do agendamento. Ex: /${cmd} <appointmentId>`,
    }
  }
  args.appointmentId = appointmentId

  if (action === "reschedule") {
    const dataRaw = kv.data ?? kv.startsat
    if (!dataRaw) {
      return {
        kind: "error",
        message: "Falta data=<YYYY-MM-DD HH:mm>.",
      }
    }
    const startsAt = parseDateTime(dataRaw)
    if (!startsAt) {
      return { kind: "error", message: `Data inválida: ${dataRaw}` }
    }
    args.startsAt = startsAt
    const dur = parseInt5to480(kv.duracao ?? kv.duration)
    if (dur) args.durationMinutes = dur
    return {
      kind: "action",
      payload: { kind: "reschedule", mode: "preview", args },
    }
  }

  if (action === "cancel" || action === "reject") {
    if (kv.motivo) args.reason = kv.motivo
    return {
      kind: "action",
      payload: { kind: action, mode: "preview", args },
    }
  }

  // approve
  return {
    kind: "action",
    payload: { kind: "approve", mode: "preview", args },
  }
}

export const CHAT_HELP_TEXT = HELP_TEXT

/**
 * Thin typed client for the Dental-CRM API.
 *
 * - JWT is read from localStorage (`dental.token`).
 * - The active clinic is read from localStorage (`dental.clinicId`) and sent
 *   as `X-Clinic-Id`.
 * - `streamChat` opens an SSE stream for assistant responses.
 *
 * The frontend NEVER calls the rag-pipeline directly — every chat / ingest
 * call is proxied through the API.
 */

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"
const VERSION = "v1"

const TOKEN_KEY = "dental.token"
const CLINIC_KEY = "dental.clinicId"

function getToken(): string | null {
  if (typeof window === "undefined") return null
  return window.localStorage.getItem(TOKEN_KEY)
}

function getClinicId(): string | null {
  if (typeof window === "undefined") return null
  return window.localStorage.getItem(CLINIC_KEY)
}

export const auth = {
  setToken(token: string) {
    window.localStorage.setItem(TOKEN_KEY, token)
  },
  setClinicId(id: string) {
    window.localStorage.setItem(CLINIC_KEY, id)
  },
  getClinicId,
  getToken,
  clear() {
    window.localStorage.removeItem(TOKEN_KEY)
    window.localStorage.removeItem(CLINIC_KEY)
  },
  isLoggedIn() {
    return !!getToken()
  },
}

export interface ApiError extends Error {
  status: number
  body: unknown
}

// ─── pending-request tracker ────────────────────────────────────────────
// Lets UI render a global spinner / progress bar whenever any API call is
// in flight. Components subscribe via `subscribeApiLoading`.
let pendingCount = 0
const loadingListeners = new Set<(count: number) => void>()

function notifyLoading() {
  for (const l of loadingListeners) l(pendingCount)
}

function startRequest() {
  pendingCount += 1
  notifyLoading()
}

function endRequest() {
  pendingCount = Math.max(0, pendingCount - 1)
  notifyLoading()
}

export function subscribeApiLoading(cb: (count: number) => void): () => void {
  loadingListeners.add(cb)
  cb(pendingCount)
  return () => {
    loadingListeners.delete(cb)
  }
}

export function getApiPendingCount(): number {
  return pendingCount
}

function buildHeaders(
  extra?: Record<string, string>,
  withClinic = true,
  withJsonContentType = true,
): HeadersInit {
  const headers: Record<string, string> = { ...extra }
  if (withJsonContentType) headers["content-type"] = "application/json"
  const token = getToken()
  if (token) headers["authorization"] = `Bearer ${token}`
  if (withClinic) {
    const clinicId = getClinicId()
    if (clinicId) headers["x-clinic-id"] = clinicId
  }
  return headers
}

function extractMessage(body: unknown, fallback: string): string {
  if (typeof body === "object" && body && "message" in body) {
    const m = (body as { message: unknown }).message
    if (Array.isArray(m)) return (m as string[]).join(", ")
    return String(m)
  }
  return fallback
}

async function request<T>(
  path: string,
  init: RequestInit & { withClinic?: boolean } = {},
): Promise<T> {
  const { withClinic = true, headers, ...rest } = init
  startRequest()
  try {
    const res = await fetch(`${BASE}/${VERSION}${path}`, {
      ...rest,
      headers: buildHeaders(headers as Record<string, string>, withClinic),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      const err = new Error(
        extractMessage(body, `Request failed with ${res.status}`),
      ) as ApiError
      err.status = res.status
      err.body = body
      throw err
    }
    if (res.status === 204) return undefined as T
    return (await res.json()) as T
  } finally {
    endRequest()
  }
}

// ----- Auth -----
export interface LoggedUser {
  id: string
  email: string
  fullName: string
  cro?: string | null
  phone?: string | null
}

export interface ClinicSummary {
  id: string
  name: string
  cnpj?: string | null
  address?: string | null
  phone?: string | null
}

export const authApi = {
  signup(payload: {
    email: string
    password: string
    fullName: string
    clinicName: string
    cro?: string
    phone?: string
  }) {
    return request<{ token: string; user: LoggedUser; clinic: ClinicSummary }>(
      "/auth/signup",
      { method: "POST", body: JSON.stringify(payload), withClinic: false },
    )
  },
  login(email: string, password: string) {
    return request<{ token: string; user: LoggedUser }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
      withClinic: false,
    })
  },
  me() {
    return request<LoggedUser>("/auth/me", { withClinic: false })
  },
}

// ----- Clinics -----
export type ClinicRole = "owner" | "dentist" | "assistant" | "receptionist"

export interface ClinicMembership extends ClinicSummary {
  role: ClinicRole
  isActive: boolean
  pending: boolean
}

export interface ClinicMember {
  membershipId: string
  role: ClinicRole
  isActive: boolean
  acceptedAt: string | null
  invitedAt: string | null
  userId: string
  email: string
  fullName: string
  cro?: string | null
}

export interface DentistSummary {
  userId: string
  fullName: string
  cro?: string | null
}

export interface PendingInvitation {
  id: string
  clinicId: string
  clinicName: string
  role: ClinicRole
  invitedAt: string | null
}

export const clinicsApi = {
  list() {
    return request<ClinicMembership[]>("/clinics", { withClinic: false })
  },
  create(payload: { name: string; cnpj?: string; address?: string; phone?: string }) {
    return request<ClinicSummary>("/clinics", {
      method: "POST",
      body: JSON.stringify(payload),
      withClinic: false,
    })
  },
  members() {
    return request<ClinicMember[]>("/clinics/current/members")
  },
  listDentists() {
    return request<DentistSummary[]>("/clinics/current/dentists")
  },
  inviteMember(payload: { email: string; role: ClinicRole }) {
    return request<unknown>("/clinics/current/members/invite", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },
  listInvitations() {
    return request<PendingInvitation[]>("/invitations", { withClinic: false })
  },
  acceptInvitation(id: string) {
    return request<unknown>(`/invitations/${id}/accept`, {
      method: "POST",
      withClinic: false,
    })
  },
  declineInvitation(id: string) {
    return request<unknown>(`/invitations/${id}/decline`, {
      method: "POST",
      withClinic: false,
    })
  },
}

// ----- Patients -----
export interface PatientSummary {
  id: string
  clinicId: string
  fullName: string
  birthDate?: string | null
  gender?: string | null
  cpf?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
  notes?: string | null
  specialties: string[]
  createdAt: string
  updatedAt: string
}

export interface CreatePatientPayload {
  fullName: string
  birthDate?: string
  gender?: string
  cpf?: string
  email?: string
  phone?: string
  address?: string
  notes?: string
  specialties?: string[]
}

export type UpdatePatientPayload = Partial<CreatePatientPayload>

export type TimelineEntry =
  | { type: "appointment"; at: string; data: AppointmentRecord }
  | { type: "anamnesis"; at: string; data: AnamnesisRecord }
  | { type: "document"; at: string; data: PatientDocument }

export const patientsApi = {
  list(params?: { search?: string; specialty?: string }) {
    const q = new URLSearchParams()
    if (params?.search) q.set("search", params.search)
    if (params?.specialty) q.set("specialty", params.specialty)
    const suffix = q.toString() ? `?${q.toString()}` : ""
    return request<PatientSummary[]>(`/patients${suffix}`)
  },
  get(id: string) {
    return request<PatientSummary>(`/patients/${id}`)
  },
  create(payload: CreatePatientPayload) {
    return request<PatientSummary>("/patients", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },
  update(id: string, payload: UpdatePatientPayload) {
    return request<PatientSummary>(`/patients/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    })
  },
  remove(id: string) {
    return request<{ id: string; deleted: boolean }>(`/patients/${id}`, {
      method: "DELETE",
    })
  },
  timeline(id: string) {
    return request<TimelineEntry[]>(`/patients/${id}/timeline`)
  },
}

// ----- Anamneses -----
export interface AnamnesisRecord {
  id: string
  clinicId: string
  patientId: string
  recordedBy: string
  recordedAt: string
  specialties: string[]
  chiefComplaint?: string | null
  presentIllnessHistory?: string | null
  allergiesSummary?: string | null
  medicationsSummary?: string | null
  underMedicalTreatment: boolean
  pregnant?: boolean | null
  gestationalWeeks?: number | null
  lactating?: boolean | null
  smoker: boolean
  alcoholUse?: string | null
  bruxism: boolean
  lastDentalVisit?: string | null
  answers: Record<string, unknown>
  consentSigned: boolean
  consentSignedAt?: string | null
  signatureUrl?: string | null
  schemaVersion: number
  createdAt: string
}

export interface CreateAnamnesisPayload {
  specialties: string[]
  chiefComplaint?: string
  presentIllnessHistory?: string
  allergiesSummary?: string
  medicationsSummary?: string
  underMedicalTreatment?: boolean
  pregnant?: boolean
  gestationalWeeks?: number
  lactating?: boolean
  smoker?: boolean
  alcoholUse?: string
  bruxism?: boolean
  lastDentalVisit?: string
  answers: Record<string, unknown>
  consentSigned: boolean
  signatureUrl?: string
}

export const anamnesesApi = {
  listByPatient(patientId: string) {
    return request<AnamnesisRecord[]>(`/patients/${patientId}/anamneses`)
  },
  create(patientId: string, payload: CreateAnamnesisPayload) {
    return request<AnamnesisRecord>(`/patients/${patientId}/anamneses`, {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },
  update(id: string, payload: Partial<CreateAnamnesisPayload>) {
    return request<AnamnesisRecord>(`/anamneses/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    })
  },
  get(id: string) {
    return request<AnamnesisRecord>(`/anamneses/${id}`)
  },
}

// ----- Appointments -----
export type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show"

export interface AppointmentRecord {
  id: string
  clinicId: string
  patientId: string
  dentistId: string
  createdBy: string
  startsAt: string
  endsAt: string
  status: AppointmentStatus
  reason?: string | null
  notes?: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateAppointmentPayload {
  patientId: string
  dentistId: string
  startsAt: string
  endsAt: string
  reason?: string
  notes?: string
}

export type UpdateAppointmentPayload = Partial<
  Omit<CreateAppointmentPayload, "patientId">
> & { status?: AppointmentStatus }

export const appointmentsApi = {
  list(params?: { from?: string; to?: string; dentistId?: string }) {
    const q = new URLSearchParams()
    if (params?.from) q.set("from", params.from)
    if (params?.to) q.set("to", params.to)
    if (params?.dentistId) q.set("dentistId", params.dentistId)
    const suffix = q.toString() ? `?${q.toString()}` : ""
    return request<AppointmentRecord[]>(`/appointments${suffix}`)
  },
  listMine(params?: { from?: string; to?: string }) {
    const q = new URLSearchParams()
    if (params?.from) q.set("from", params.from)
    if (params?.to) q.set("to", params.to)
    const suffix = q.toString() ? `?${q.toString()}` : ""
    return request<AppointmentRecord[]>(`/me/appointments${suffix}`, {
      withClinic: false,
    })
  },
  create(payload: CreateAppointmentPayload) {
    return request<AppointmentRecord>("/appointments", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },
  update(id: string, payload: UpdateAppointmentPayload) {
    return request<AppointmentRecord>(`/appointments/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    })
  },
}

// ----- Documents -----
export type IngestStatus = "pending" | "processing" | "ready" | "failed"

export interface PatientDocument {
  id: string
  clinicId: string
  patientId: string
  uploadedBy: string
  filename: string
  mimeType: string
  sizeBytes: number
  storageUrl: string
  ingestStatus: IngestStatus
  ingestError?: string | null
  chunkCount?: number | null
  ingestedAt?: string | null
  createdAt: string
  updatedAt: string
}

export const documentsApi = {
  list(patientId: string) {
    return request<PatientDocument[]>(`/patients/${patientId}/documents`)
  },
  async upload(patientId: string, files: File[]): Promise<PatientDocument[]> {
    const fd = new FormData()
    for (const f of files) fd.append("files", f, f.name)
    startRequest()
    try {
      const res = await fetch(
        `${BASE}/${VERSION}/patients/${patientId}/documents`,
        {
          method: "POST",
          // No JSON content-type so the browser sets the multipart boundary.
          headers: buildHeaders(undefined, true, false),
          body: fd,
        },
      )
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        const err = new Error(
          extractMessage(body, `Upload failed with ${res.status}`),
        ) as ApiError
        err.status = res.status
        err.body = body
        throw err
      }
      return (await res.json()) as PatientDocument[]
    } finally {
      endRequest()
    }
  },
  remove(patientId: string, documentId: string) {
    return request<{ id: string; deleted: boolean }>(
      `/patients/${patientId}/documents/${documentId}`,
      { method: "DELETE" },
    )
  },
}

// ----- Chat -----
export interface ChatSession {
  id: string
  patientId: string
  createdAt: string
}

export interface ChatMessage {
  id: string
  sessionId: string
  role: "user" | "assistant"
  content: string
  sources?: unknown
  createdAt: string
}

export const chatApi = {
  health() {
    return request<{ ok: boolean }>("/chat/health")
  },
  createSession(patientId: string) {
    return request<ChatSession>("/chat/sessions", {
      method: "POST",
      body: JSON.stringify({ patientId }),
    })
  },
  listSessions(patientId?: string) {
    const suffix = patientId ? `?patientId=${patientId}` : ""
    return request<ChatSession[]>(`/chat/sessions${suffix}`)
  },
  listMessages(sessionId: string) {
    return request<ChatMessage[]>(`/chat/sessions/${sessionId}/messages`)
  },
}

export interface SourceRef {
  source: string
  index?: number
  distance?: number
}

export interface StreamHandlers {
  onSources?: (sources: SourceRef[]) => void
  onToken?: (token: string) => void
  onDone?: () => void
  onError?: (message: string) => void
}

/**
 * Stream a chat answer via SSE. Returns an `AbortController` that the caller
 * can use to cancel mid-stream.
 *
 * Implements its own SSE parser on top of `fetch` because EventSource cannot
 * carry an `Authorization` header.
 */
export function streamChat(
  sessionId: string,
  question: string,
  handlers: StreamHandlers,
): AbortController {
  const controller = new AbortController()

  ;(async () => {
    try {
      const res = await fetch(
        `${BASE}/${VERSION}/chat/sessions/${sessionId}/messages`,
        {
          method: "POST",
          headers: buildHeaders({ accept: "text/event-stream" }),
          body: JSON.stringify({ question }),
          signal: controller.signal,
        },
      )
      if (!res.ok || !res.body) {
        const text = await res.text().catch(() => "")
        handlers.onError?.(`HTTP ${res.status}: ${text}`)
        return
      }
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        let idx: number
        while ((idx = buffer.indexOf("\n\n")) !== -1) {
          const evt = buffer.slice(0, idx)
          buffer = buffer.slice(idx + 2)
          handleEvent(evt, handlers)
        }
      }
      handlers.onDone?.()
    } catch (err) {
      if ((err as Error).name === "AbortError") return
      handlers.onError?.((err as Error).message)
    }
  })()

  return controller
}

function handleEvent(raw: string, handlers: StreamHandlers) {
  const lines = raw.split("\n")
  let event: string | undefined
  const dataLines: string[] = []
  for (const line of lines) {
    if (line.startsWith("event:")) event = line.slice(6).trim()
    else if (line.startsWith("data:")) dataLines.push(line.slice(5).trimStart())
  }
  if (dataLines.length === 0) return
  const data = dataLines.join("\n")

  if (event === "sources") {
    try {
      handlers.onSources?.(JSON.parse(data) as SourceRef[])
    } catch {
      /* ignore */
    }
    return
  }
  if (event === "done") {
    handlers.onDone?.()
    return
  }
  if (event === "error") {
    try {
      const obj = JSON.parse(data) as { message?: string }
      handlers.onError?.(obj.message ?? data)
    } catch {
      handlers.onError?.(data)
    }
    return
  }
  // default token chunk — server sends `data: <JSON-stringified token>`
  try {
    const parsed = JSON.parse(data) as unknown
    if (typeof parsed === "string") handlers.onToken?.(parsed)
    else handlers.onToken?.(data)
  } catch {
    handlers.onToken?.(data)
  }
}

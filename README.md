# Dental-CRM

> Intelligent CRM for dental clinics with a per-patient RAG-powered chatbot.

Dental-CRM is a clinic + patient management web app paired with a private
Retrieval-Augmented Generation service. The CRM handles clinics, dentists,
patients, scheduling, anamnesis, odontograma and treatment planning. The RAG
service runs locally (Ollama + ChromaDB) and exposes a small REST API that the
app calls to answer clinical questions grounded on a single patient's
documents.

This repository is an academic project ("Oficina 2").

## Repository layout

| Path | Description |
|---|---|
| [`app/`](app) | Next.js 15 / React 19 / TypeScript / Tailwind v4 / shadcn-ui frontend. Contains the CRM UI: dashboard, pacientes, agenda, odontograma, anamnese, planejamento, financeiro, companies. |
| [`rag-pipeline/`](rag-pipeline) | Node/TypeScript Fastify service: document ingestion, embeddings, Chroma vector store, LLaMA 3 chat, per-patient isolation. Consumed by the app as a **pure REST service**. See [rag-pipeline/README.md](rag-pipeline/README.md) for the deep dive. |

## Key features

Status legend: ✅ done · 🟡 WIP · 🔭 planned

- ✅ **Multi-tenant clinic membership.** A user can simultaneously **own one or
  more clinics** AND **be a member of (or hold permissions on) clinics owned by
  other users**. Roles per clinic (owner, dentist, staff) are independent — the
  same person can be the owner of clinic A while working as a dentist in
  clinic B.
- ✅ **Multi-clinic management UI** — `/companies`. Switch between the clinics
  the current user belongs to.
- ✅ **Scheduling on behalf of any dentist in the clinic.** An owner can book
  appointments for themselves and for any dentist registered to one of their
  clinics. Surfaces: `/calendar` (general agenda), `/minha-agenda` (personal),
  `/agendamentos`.
- ✅ **Patient registry** with profile, anamnesis, odontograma and treatment
  planning — `/clients/[id]`, `/clients/[id]/anamnesis`,
  `/clients/[id]/odontograma`, `/clients/[id]/planejamento`.
- 🟡 **Patient history tracking** — extended longitudinal history beyond the
  current anamnesis snapshot.
- 🟡 **Financial tracking** — `/financeiro`.
- 🔭 **Per-patient RAG chatbot** _(focus of current development)_ — see below.
  The chatbot answers questions grounded on the selected patient's records via
  the RAG REST service. Booking appointments through the chatbot is **not**
  part of this feature; appointment booking remains a separate, app-side
  capability.

## Architecture

```
┌──────────────────────┐   HTTP / SSE   ┌───────────────────────┐
│  Next.js app (app/)  │ ─────────────▶ │  RAG service          │
│  • CRM UI            │                │  Fastify  :3000       │
│  • Patient chat UI   │ ◀───────────── │  (rag-pipeline/)      │
└──────────────────────┘   tokens +     └───────┬───────────────┘
                           sources              │ embed / chat
                                                ▼
                                       ┌────────────────────┐
                                       │  Ollama  :11434    │
                                       │  llama3:8b         │
                                       │  nomic-embed-text  │
                                       └────────────────────┘
                                                ▲
                                                │ upsert / query
                                       ┌────────┴───────────┐
                                       │  ChromaDB  :8000   │
                                       └────────────────────┘
```

Per-patient isolation is enforced server-side in the RAG service through a
Chroma metadata filter on `patientId`. The app always supplies the current
patient's id; the chat UI does not let the user override it.

## Tech stack

**Frontend (`app/`)** — Next.js 15, React 19, TypeScript 5, Tailwind v4,
shadcn-ui, Radix primitives, lucide-react, react-hook-form + zod, sonner.

**RAG service (`rag-pipeline/`)** — Fastify, langchain text splitters,
chromadb client, `@xenova/transformers` (optional cross-encoder reranker),
Ollama (`llama3:8b` + `nomic-embed-text`), pdf-parse, cheerio.

## Quickstart

### 1. RAG service

```bash
cd rag-pipeline
docker compose up -d

# Ingest the bundled sample patient
docker compose run --rm rag-app pnpm ingest \
  --dir data/sample/patient-001 --patient 001
```

Full configuration, REST contract and verification steps live in
[rag-pipeline/README.md](rag-pipeline/README.md).

### 2. Frontend

```bash
cd app
pnpm install
pnpm dev
```

The app expects the RAG service to be reachable at `http://localhost:3000` by
default (configurable). If both run on the same port locally, override one of
them.

## Roadmap

- 🟡 Patient longitudinal history tracking
- 🟡 Financial module
- 🔭 Per-patient RAG chatbot (see task list below)
- 🔭 Appointment booking polish (separate from the chatbot)

---

## Focus feature: Patient-Aware Chatbot (RAG over REST)

The chatbot is scoped to **one patient at a time**. It uses the RAG service as
a **pure REST API** — the app sends `{patientId, question}` and consumes a
streamed answer with citations. There is no tool calling and no booking
integration on the RAG side; appointment booking will be implemented later as
a separate Next.js feature and will not depend on the chatbot.

The work is split into two independent tracks. Once the REST contract (R1.1)
is frozen, both tracks can progress in parallel.

### Track 1 — RAG service (`rag-pipeline/`)

#### R1. REST hardening
- [ ] R1.1. Freeze and version the public REST contract: `POST /v1/ingest`,
  `POST /v1/chat` (SSE), `GET /v1/health`. Document request/response shapes.
- [ ] R1.2. CORS configuration so the Next.js app can call the service
  directly during development.
- [ ] R1.3. Per-request `patientId` enforcement on every retrieval (already
  enforced via Chroma metadata filter — add a regression test).
- [ ] R1.4. Structured error responses (`{error, code, message}`) and request
  IDs in logs.
- [ ] R1.5. Optional `GET /v1/patients/:id/sources` listing ingested
  documents/chunks for a patient (the UI uses this to show "what the
  assistant can see").

#### R2. Retrieval quality
- [ ] R2.1. Enable re-ranker (`RERANK=true`) for clinical queries; benchmark
  on the sample patient.
- [ ] R2.2. Eval harness under `rag-pipeline/eval/` with 10–20 Q/A pairs over
  `patient-001`; measure recall@k and faithfulness.
- [ ] R2.3. Tune `TOP_K` and chunk size if the eval shows misses; document
  the chosen values in `rag-pipeline/README.md`.
- [ ] R2.4. Enforce citation discipline in the system prompt: every clinical
  claim must reference a chunk index returned in the `sources` SSE event.

#### R3. Safety & observability (service side)
- [ ] R3.1. Shared-secret auth header validated by the RAG service.
- [ ] R3.2. Rate limit `/v1/chat` per `patientId`.
- [ ] R3.3. PII-aware logging (mask CPF, phone) in request logs.
- [ ] R3.4. Extend `GET /v1/health` with Ollama + Chroma reachability checks.

#### R4. Verification (service)
- [ ] R4.1. E2E test: ingest `patient-001` → `POST /v1/chat` returns streamed
  tokens and a `sources` event.
- [ ] R4.2. Negative test: while scoped to `patient-001`, query referencing
  another patient → no sources, refusal.
- [ ] R4.3. Contract tests for the error envelope and SSE event ordering
  (`sources` first, tokens, `done` last).

### Track 2 — Frontend chat UI (`app/`)

#### U1. Client + route
- [ ] U1.1. Typed REST/SSE client `app/lib/rag-client.ts` wrapping
  `POST /v1/chat` (tokens + `sources` + `done`) and `POST /v1/ingest`.
- [ ] U1.2. Route `app/app/clients/[id]/chat/page.tsx` — chat panel scoped to
  the patient; `patientId` is taken from the URL and is not user-editable.
- [ ] U1.3. Sidebar entry "Assistente" in `components/app-sidebar.tsx` and an
  inline "Perguntar ao assistente" button on the patient detail page.

#### U2. Chat component
- [ ] U2.1. `<PatientChat />` using shadcn `card`, `scroll-area`, `input`,
  `button`.
- [ ] U2.2. Render streamed tokens incrementally.
- [ ] U2.3. Collapsible "Sources" section listing cited chunks with snippet
  on hover.
- [ ] U2.4. Loading and empty states (no ingestion yet → suggest ingesting).
- [ ] U2.5. Error states (RAG service down, network error, auth failure) with
  clear messages and retry.
- [ ] U2.6. Pinned "Não é orientação médica" disclaimer at the top of the
  chat.

#### U3. Patient document ingestion UX
- [ ] U3.1. "Documentos do paciente" section on `/clients/[id]` listing what
  has been ingested (uses R1.5).
- [ ] U3.2. Upload UI calling `POST /v1/ingest` for the current `patientId`
  (PDF / TXT / JSON).
- [ ] U3.3. Re-index / refresh action and last-ingested timestamp.

#### U4. Status & polish
- [ ] U4.1. Surface RAG `GET /v1/health` status in the chat header
  (green/red dot).
- [ ] U4.2. Keyboard shortcuts (Enter to send, Shift+Enter newline) and
  accessibility pass.

#### U5. Verification (UI)
- [ ] U5.1. Manual demo: open `/clients/001/chat`, ask "O paciente tem alguma
  alergia?" → tokens stream and sources render.
- [ ] U5.2. Service-down test: stop the RAG service → UI shows a clear error
  and does not crash.
- [ ] U5.3. (Optional) Playwright test for streaming + sources rendering.

> **Out of scope for the chatbot:** appointment booking, calendar integration
> and any action execution. Those will be implemented as a separate Next.js
> feature and will not call the RAG service.

---

## License

Academic project — Oficina 2.

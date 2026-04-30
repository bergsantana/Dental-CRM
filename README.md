# Dental-CRM

> Intelligent CRM for dental clinics with a per-patient RAG-powered assistant.

Dental-CRM is a clinic and patient management web app integrated with a private **Retrieval-Augmented Generation (RAG)** service. The CRM handles clinics, dentists, patients, scheduling, anamnesis, odontogram and treatment planning. The RAG service runs locally (Ollama + ChromaDB) and exposes a small REST API that the NestJS backend proxies, allowing the assistant to answer questions grounded exclusively on a **single patient's** records.

> **Academic project** — Oficina 2 / UEA.

---

## Table of Contents

- [Overview](#overview)
- [Repository layout](#repository-layout)
- [Architecture](#architecture)
  - [Component diagram](#component-diagram)
  - [RAG pipeline in detail](#rag-pipeline-in-detail)
  - [Data model](#data-model)
- [Tech stack](#tech-stack)
- [Features](#features)
- [Installation & running](#installation--running)
  - [Prerequisites](#prerequisites)
  - [One-shot bootstrap](#one-shot-bootstrap)
  - [Frontend (Next.js)](#frontend-nextjs)
  - [Ingest the sample patient](#ingest-the-sample-patient)
  - [Useful commands](#useful-commands)
  - [Environment variables](#environment-variables)
  - [Troubleshooting](#troubleshooting)
- [RAG service REST API](#rag-service-rest-api)
- [Technical decisions](#technical-decisions)
- [Known limitations](#known-limitations)
- [License](#license)

---

## Overview

| Aspect | Detail |
|---|---|
| Type | Micro SaaS / Academic project |
| Domain | Dentistry — clinic management, patient records, and clinical assistant |
| Tenancy model | Multi-tenant (per clinic), with data isolation enforced at both the database and vector store layers |
| Execution | Fully local — no paid external API calls. LLMs served via Ollama |

---

## Repository layout

```
Dental-CRM/
├── app/              # Next.js 15 / React 19 / TypeScript / Tailwind v4 frontend
├── api/              # NestJS 11 / Drizzle / Postgres backend — trust boundary
├── rag-pipeline/     # Fastify service — ingestion, embeddings, ChromaDB, LLM chat
├── scripts/
│   └── start.sh      # Idempotent full-stack bootstrap
├── docker-compose.yml
└── docker-compose.override.yml
```

| Path | Description |
|---|---|
| [`app/`](app) | CRM UI: dashboard, clients, calendar, odontogram, anamnesis, treatment planning, financials, companies, assistant. |
| [`api/`](api) | JWT auth, clinic membership, patients, appointments, anamneses, documents, chat, RAG proxy. |
| [`rag-pipeline/`](rag-pipeline) | Document ingestion, embeddings (`nomic-embed-text`), ChromaDB, LLaMA / phi3 chat, RAG-Triad metrics. |

---

## Architecture

### Component diagram

```
┌──────────────────────┐  HTTP   ┌──────────────────────┐  HTTP / SSE  ┌───────────────────────┐
│  Next.js app (app/)  │ ──────▶ │  NestJS API (api/)   │ ───────────▶ │  RAG service          │
│  • CRM UI            │         │  • auth / clinics    │              │  Fastify  :3000       │
│  • Patient chat UI   │ ◀────── │  • patients / docs   │ ◀─────────── │  (rag-pipeline/)      │
└──────────────────────┘  JWT    │  • chat proxy        │  tokens +    └───────┬───────────────┘
                                 └──────────┬───────────┘  sources             │ embed / chat
                                            │                                  ▼
                                            ▼                         ┌────────────────────┐
                                    ┌──────────────┐                  │  Ollama  :11434    │
                                    │ Postgres :5432│                  │  phi3:mini         │
                                    └──────────────┘                  │  nomic-embed-text  │
                                                                      └────────────────────┘
                                                                               ▲
                                                                               │ upsert / query
                                                                      ┌────────┴───────────┐
                                                                      │  ChromaDB  :8000   │
                                                                      └────────────────────┘
```

> The frontend **never** talks to the RAG service directly. Per-patient isolation is enforced server-side via a Chroma metadata filter on `patientId`.

### RAG pipeline in detail

```
Document (PDF / TXT / JSON / HTML)
        │
        ▼
  [Loader]  pdf-parse | cheerio | fs
        │
        ▼
  [Chunker]  RecursiveCharacterTextSplitter
             • Prose:  500 chars / 75 overlap (~15%)
             • JSON:   1 chunk per record (atomic)
        │
        ▼
  [Embeddings]  nomic-embed-text via Ollama /api/embeddings
        │
        ▼
  [Vector Store]  ChromaDB — cosine distance
                  metadata: { patientId, source, chunkIndex }
        │
   user question
        │
        ▼
  [Retrieval]  top-k semantic search (k=8 default)
        │
        ▼ (optional)
  [Re-ranker]  Xenova/bge-reranker-base (cross-encoder)
               keeps top-3 chunks
        │
        ▼
  [Generation]  phi3:mini via Ollama /api/chat — streamed SSE
        │
        ▼
  [RAG-Triad Evaluation]  (post-generation, non-blocking)
       • Context Relevance  — cosine(question_emb, chunk_embs)
       • Groundedness       — cosine per answer sentence vs chunks
       • Answer Relevance   — cosine(question_emb, answer_emb)
```

### Data model

Core tables (Postgres 16, managed by Drizzle ORM):

| Table | Description |
|---|---|
| `users` | System users (dentists, assistants, receptionists) |
| `clinics` | Registered clinics (soft-delete) |
| `clinic_members` | Membership + roles (`owner`, `dentist`, `assistant`, `receptionist`) |
| `patients` | Patient registry per clinic (soft-delete, CPF unique per clinic) |
| `appointments` | Appointments with status (`scheduled`, `confirmed`, `completed`, `cancelled`, `no_show`) |
| `anamneses` | Structured anamnesis form (allergies, medications, history, consent) |
| `patient_documents` | Uploaded files with RAG ingest status (`pending`, `processing`, `ready`, `failed`) |
| `chat_sessions` | Chat sessions scoped per patient / user / clinic |
| `chat_messages` | Messages with sources, token counts, and per-message RAG-Triad metrics |

---

## Tech stack

### Frontend (`app/`)

| Technology | Version | Use |
|---|---|---|
| Next.js | 15 | App Router, RSC, SSE consumer |
| React | 19 | UI |
| TypeScript | 5 | Static typing |
| Tailwind CSS | v4 | Styling |
| shadcn-ui / Radix | latest | Accessible component primitives |
| react-hook-form + zod | latest | Forms and validation |
| lucide-react | latest | Icons |
| sonner | latest | Toast notifications |

### API (`api/`)

| Technology | Version | Use |
|---|---|---|
| NestJS | 11 | HTTP framework / module system |
| Drizzle ORM | latest | Type-safe queries + migrations |
| Postgres | 16 | Primary relational database |
| JWT (Passport) | — | Stateless authentication |
| class-validator | latest | DTO validation |

### RAG Pipeline (`rag-pipeline/`)

| Technology | Version | Use |
|---|---|---|
| Fastify | 4 | RAG service HTTP server |
| ChromaDB (client) | latest | Vector store with metadata filtering |
| Ollama | host | Local LLM server |
| phi3:mini | ~2.3 GB | Generation model (LLM) |
| nomic-embed-text | ~270 MB | Embedding model |
| langchain text splitters | latest | `RecursiveCharacterTextSplitter` |
| @xenova/transformers | latest | Cross-encoder reranker (optional) |
| pdf-parse | latest | PDF text extraction |
| cheerio | latest | HTML parser |
| zod | latest | API payload validation |

---

## Features

- **Multi-tenant clinic membership.** A user can own clinics and simultaneously be a member of clinics owned by others. Per-clinic roles (`owner`, `dentist`, `assistant`, `receptionist`) are independent.
- **Multi-clinic management UI** — `/companies`. Switch between clinics.
- **Scheduling on behalf of any dentist in the clinic** — `/calendar`, `/minha-agenda`, `/agendamentos`.
- **Patient registry** with profile, anamnesis, odontogram and treatment planning — `/clients`, `/clients/[id]/...`.
- **Document upload + auto-ingest.** PDF / TXT / JSON / HTML files attached to a patient are stored under `api/data/documents/patients/<id>/` and pushed into the RAG index in the background.
- **Anamnesis auto-ingest.** Saving or editing an anamnesis writes a JSON snapshot alongside the patient documents and re-indexes it, so the assistant always sees the latest answers.
- **Per-patient assistant** — `/assistant`. Streamed answers via SSE with source citations, scoped strictly to the selected patient.
- **RAG-Triad metrics** persisted per message (`context_relevance`, `groundedness`, `answer_relevance`).
- **Financial tracking** — `/financeiro` (in progress).

---

## Installation & running

### Prerequisites

| Requirement | Notes |
|---|---|
| Docker + Docker Compose | The full backend stack runs via compose |
| [Ollama](https://ollama.com/) | Installed **on the host** (not in Docker by default). The bootstrap script ensures it listens on `0.0.0.0:11434`. |
| Node.js ≥ 20 + pnpm | Required only for the Next.js frontend (runs outside compose) |

> **GPU (optional):** Edit `docker-compose.yml` and uncomment the `deploy.resources` block under the `ollama` service. Requires the [NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html).

### One-shot bootstrap

```bash
./scripts/start.sh
```

The script is **idempotent** and:

1. Verifies tooling (`docker`, `ollama`, `curl`).
2. Restarts Ollama on `0.0.0.0:11434` if it's bound to loopback.
3. Pulls `phi3:mini` (~2.3 GB) and `nomic-embed-text` (~270 MB) if missing.
4. Seeds `api/.env` and `rag-pipeline/.env` from `*.env.example` on first run.
5. Builds images and starts the stack.
6. Waits for Postgres / API / RAG health checks and prints all URLs.

Database migrations run automatically on `api` container start.

### Frontend (Next.js)

The Next.js app runs **on the host**, outside compose:

```bash
cd app
pnpm install
pnpm dev
```

Open [http://localhost:3567](http://localhost:3567). Sign up to create your first clinic, then add patients, documents and anamneses — uploads and anamneses are auto-ingested into the patient's RAG index, so the **Assistant** page can immediately answer questions about that patient.

### Ingest the sample patient

```bash
docker compose run --rm rag pnpm ingest --dir data/sample/patient-001 --patient 001
```

### Useful commands

| Command | Purpose |
|---|---|
| `./scripts/start.sh` | Bootstrap or refresh the stack |
| `docker compose logs -f api rag` | Tail API and RAG logs |
| `docker compose down` | Stop the stack |
| `docker compose down -v` | Stop and **drop volumes** (resets DB and Chroma) |
| `docker exec dental-crm-api-1 pnpm db:migrate` | Manually apply pending migrations |
| `cd api && pnpm db:generate` | Generate a new Drizzle migration from schema changes |

### Environment variables

#### `api/.env` (generated from `api/.env.example`)

| Variable | Default | Description |
|---|---|---|
| `PORT` | `4000` | NestJS API port |
| `APP_ORIGIN` | `http://localhost:3567` | Frontend origin (CORS) |
| `DATABASE_URL` | `postgres://dental:dental@localhost:5432/dental_crm` | Postgres connection URL |
| `JWT_SECRET` | `change-me-in-prod` | JWT signing secret |
| `JWT_EXPIRES_IN` | `7d` | Token expiry |
| `RAG_URL` | `http://localhost:3000` | Internal RAG service URL |
| `RAG_AUTH_TOKEN` | `change-me-in-prod` | Shared token between API and RAG |
| `DOCUMENTS_DIR` | `./data/documents` | Patient documents storage directory |

#### `rag-pipeline/.env` (generated from `rag-pipeline/.env.example`)

| Variable | Default | Description |
|---|---|---|
| `OLLAMA_URL` | `http://ollama:11434` | Ollama server URL |
| `CHROMA_URL` | `http://chroma:8000` | ChromaDB server URL |
| `LLM_MODEL` | `phi3:mini` | Generation model |
| `EMBED_MODEL` | `nomic-embed-text` | Embedding model |
| `PORT` | `3000` | RAG service port |
| `TOP_K` | `8` | Number of chunks retrieved per query |
| `RERANK` | `false` | Enable cross-encoder reranker |
| `RAG_AUTH_TOKEN` | `changeme` | Must match the value in `api/.env` |

To use a different model:
```bash
LLM_MODEL=llama3.2:3b docker compose up -d
```

### Troubleshooting

| Symptom | Fix |
|---|---|
| `rag` can't reach Ollama (`ECONNREFUSED 172.17.0.1:11434`) | Ollama is bound to loopback. Re-run `./scripts/start.sh` (auto-fixes) or `OLLAMA_HOST=0.0.0.0:11434 ollama serve`. |
| `401 Unauthorized` from the RAG service | `RAG_AUTH_TOKEN` must be identical in `api/.env` and `rag-pipeline/.env`. |
| `column "..." does not exist` | Pending migration. Run `docker exec dental-crm-api-1 pnpm db:migrate`. |
| Port collisions | Frontend defaults to `3567`; RAG holds `3000`. Stop the conflicting process or change `PORT` in `app/.env.local`. |
| Re-ranker slow on first use | `bge-reranker-base` (~270 MB) is downloaded on first activation and cached in the container layer. |

---

## RAG service REST API

Base URL: `http://localhost:3000`

### `GET /v1/health`

Returns connection info for Ollama and ChromaDB.

```json
{ "ok": true, "ollama": "http://...", "chroma": "http://...", "model": "phi3:mini" }
```

### `POST /v1/ingest`

Ingests patient documents into ChromaDB.

```json
{ "patientId": "uuid", "dir": "data/sample/patient-001" }
```

Either `dir`, `file`, or `files[]` is required. Returns `{ "docs": N, "chunks": M }`.

### `POST /v1/chat` — SSE

Answers a question with Server-Sent Events streaming.

```json
{ "patientId": "uuid", "question": "...", "k": 8, "rerank": false }
```

Emitted events:

| Event | Payload | Description |
|---|---|---|
| `event: sources` | `[{source, index, distance}]` | Retrieved chunks |
| `data: "<token>"` | string | LLM-generated tokens |
| `event: metrics` | `{contextRelevance, groundedness, answerRelevance, perChunk}` | Post-generation RAG-Triad |
| `event: done` | `{}` | Stream end |
| `event: error` | `{message}` | Error during generation |

---

## Technical decisions

### Why Ollama on the host and not in Docker?

Ollama with GPU requires the NVIDIA driver and Container Toolkit on the host. Running it directly on the host eliminates that complexity for the academic use-case and lets you share already-downloaded models across projects. The `docker-compose.yml` keeps the `ollama` service commented out with instructions to enable it when needed.

### Why ChromaDB as the vector store?

ChromaDB offers native metadata filtering (used for per-`patientId` isolation), zero extra infrastructure configuration, and an official JavaScript client. Alternatives like pgvector would require a Postgres extension and lose the separation of concerns between the relational database and the vector store.

### Chunking strategy: 500 chars / 75 overlap

Clinical notes are short and dense. **500 characters** ≈ 1–2 short paragraphs: large enough to retain context for a single finding, small enough that top-k retrieval stays focused on the question. **75 chars (~15%) overlap** preserves sentence continuity across chunk boundaries so a fact split between two chunks is still recoverable. JSON records (anamnesis, appointments) are semantically atomic — each becomes its own chunk to avoid destroying meaning.

### Why phi3:mini as the default LLM?

`phi3:mini` (~2.3 GB) runs on modern CPUs without a dedicated GPU, delivers acceptable quality for clinical-domain queries in both Portuguese and English, and downloads quickly on the first `./scripts/start.sh`. The model is configurable via the `LLM_MODEL` environment variable for users who want `llama3.2:3b` or larger models.

### RAG-Triad evaluation without LLM-as-judge

Instead of a second LLM evaluator (expensive and slow), the system computes three metrics via embedding similarity:
- **Context Relevance**: `cosine(question_emb, chunk_embs)` — measures whether retrieved chunks are pertinent to the question.
- **Groundedness**: `cosine(sentence_embs, chunk_embs)` per answer sentence — measures whether each claim in the answer is supported by context.
- **Answer Relevance**: `cosine(question_emb, answer_emb)` — measures whether the answer addresses the question.

These metrics are persisted in `chat_messages` for historical analysis.

### Why NestJS as API gateway instead of direct RAG access?

NestJS acts as the security boundary: it validates the user's JWT, verifies that the patient belongs to the user's clinic, injects the `RAG_AUTH_TOKEN`, and only then forwards the request to the RAG service. The frontend never sees the RAG auth token and cannot access data from other patients.

### Drizzle ORM over Prisma or TypeORM

Drizzle ORM provides 100% TypeScript type inference without code generation, type-safe queries close to plain SQL, and versioned SQL migration files. Prisma requires a separately generated client; TypeORM's decorators conflict with NestJS 11's module system.

---

## Known limitations

| Limitation | Detail |
|---|---|
| **No OCR support** | Only text-extractable PDFs work. Scanned PDFs (images) are silently skipped by `pdf-parse`. |
| **Simple auth token for RAG** | `RAG_AUTH_TOKEN` is a plain bearer token with no automatic rotation. Do not expose port `3000` publicly. |
| **No explicit multi-language handling** | The system prompt is in Portuguese. English queries work but quality may vary with `phi3:mini`. |
| **Financials incomplete** | The `/financeiro` route is under development — only a UI scaffold exists. |
| **Re-ranker is CPU-intensive** | `bge-reranker-base` significantly increases latency on CPU. Disable (`RERANK=false`) if latency is critical. |
| **Synchronous ingestion** | Ingesting large directories blocks the `POST /v1/ingest` endpoint until complete. |
| **Shared volume between API and RAG** | `api/data` is mounted in both containers. For production, replace with object storage (S3 / MinIO). |
| **Non-revocable JWTs** | Tokens expire in 7 days. There is no blacklist — logout simply discards the token client-side. |
| **Ollama on host networking** | The RAG container connects to Ollama via `host.docker.internal` / `0.0.0.0:11434`. On Linux this requires `--add-host=host.docker.internal:host-gateway` (already set in compose). |

---

## License

Academic project — Oficina 2 / UEA. No open-source license defined.

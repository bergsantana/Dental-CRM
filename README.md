# Dental-CRM

> Intelligent CRM for dental clinics with a per-patient RAG-powered chatbot.

Dental-CRM is a clinic + patient management web app paired with a private
Retrieval-Augmented Generation service. The CRM handles clinics, dentists,
patients, scheduling, anamnesis, odontograma and treatment planning. The RAG
service runs locally (Ollama + ChromaDB) and exposes a small REST API that the
NestJS API proxies so the assistant can answer questions grounded on a single
patient's records.

This repository is an academic project ("Oficina 2").

## Repository layout

| Path | Description |
|---|---|
| [`app/`](app) | Next.js 15 / React 19 / TypeScript / Tailwind v4 / shadcn-ui frontend. CRM UI: dashboard, clientes, agenda, odontograma, anamnese, planejamento, financeiro, companies, assistente. |
| [`api/`](api) | NestJS 11 / Drizzle / Postgres backend. Auth, multi-clinic membership, patients, appointments, anamneses, documents, chat. Acts as the trust boundary in front of the RAG service. |
| [`rag-pipeline/`](rag-pipeline) | Node / Fastify service. Document ingestion, embeddings (Ollama `nomic-embed-text`), Chroma vector store, LLaMA 3 chat, per-patient isolation. See [rag-pipeline/README.md](rag-pipeline/README.md). |

## Architecture

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
                                                                      ┌───────┴────────────┐
                                                                      │  ChromaDB  :8000   │
                                                                      └────────────────────┘
```

The frontend never talks to the RAG service directly. Per-patient isolation is
enforced server-side via a Chroma metadata filter on `patientId`.

## Tech stack

- **Frontend** — Next.js 15, React 19, TypeScript 5, Tailwind v4, shadcn-ui,
  Radix, lucide-react, react-hook-form + zod, sonner.
- **API** — NestJS 11, Drizzle ORM, Postgres 16, JWT, class-validator.
- **RAG** — Fastify, langchain text splitters, chromadb client,
  `@xenova/transformers` (optional cross-encoder reranker), Ollama
  (`phi3:mini` + `nomic-embed-text`), pdf-parse, cheerio.

## Running the project

The whole stack (Postgres, Chroma, Adminer, API, RAG) runs via
`docker-compose`. Hot reload is enabled for `api` and `rag` so editing files
on the host is enough.

### Prerequisites

- Docker + Docker Compose.
- [Ollama](https://ollama.com/) installed on the host. The bootstrap script
  ensures it listens on `0.0.0.0:11434` so the `rag` container can reach it
  through `host.docker.internal`.

### One-shot bootstrap

```bash
./scripts/start.sh
```

The script is idempotent and:

1. Verifies tooling (`docker`, `ollama`, `curl`).
2. Restarts Ollama on `0.0.0.0:11434` if it's bound to loopback.
3. Pulls `phi3:mini` and `nomic-embed-text` if missing.
4. Seeds `api/.env` and `rag-pipeline/.env` from `*.env.example` on first run.
5. Builds images and starts the stack.
6. Waits for Postgres / API / RAG health and prints all URLs.

Database migrations run automatically on api container start.

### Start the frontend

The Next.js app runs on the host (not in compose):

```bash
cd app
pnpm install
pnpm dev
```

Open [http://localhost:3567](http://localhost:3567). Sign up to create your
first clinic, then add patients, documents and anamneses — uploads and
anamneses are auto-ingested into the patient's RAG index, so the
**Assistente** page can immediately answer questions about that patient.

### Optional: ingest the bundled sample patient

```bash
docker compose run --rm rag pnpm ingest --dir data/sample/patient-001 --patient 001
```

### Useful commands

| Command | Purpose |
|---|---|
| `./scripts/start.sh` | Bootstrap or refresh the stack. |
| `docker compose logs -f api rag` | Tail API and RAG logs. |
| `docker compose down` | Stop the stack. |
| `docker compose down -v` | Stop and **drop volumes** (resets DB and Chroma). |
| `docker exec dental-crm-api-1 pnpm db:migrate` | Manually apply pending migrations. |
| `cd api && pnpm db:generate` | Generate a new Drizzle migration from schema changes. |

### Troubleshooting

- **`rag` container can't reach Ollama (`ECONNREFUSED 172.17.0.1:11434`)** —
  Ollama is bound to loopback. Re-run `./scripts/start.sh` (it auto-fixes) or
  start Ollama manually with `OLLAMA_HOST=0.0.0.0:11434 ollama serve`.
- **`401 unauthorized` from the RAG service** — `RAG_AUTH_TOKEN` must match in
  both `api/.env` and `rag-pipeline/.env` (or use the compose default).
- **`column "..." does not exist`** — pending migration. Run
  `docker exec dental-crm-api-1 pnpm db:migrate`.
- **Port collisions** — the frontend defaults to `3567`; the RAG service holds
  `3000`. Stop the conflicting process or change `PORT` in `app/.env.local`.

## Features

- **Multi-tenant clinic membership.** A user can own clinics and simultaneously
  be a member of clinics owned by others. Per-clinic roles (owner, dentist,
  assistant, receptionist) are independent.
- **Multi-clinic management UI** — `/companies`. Switch between clinics.
- **Scheduling on behalf of any dentist in the clinic** — `/calendar`,
  `/minha-agenda`, `/agendamentos`.
- **Patient registry** with profile, anamnesis, odontograma and treatment
  planning — `/clients`, `/clients/[id]`, `/clients/[id]/anamnesis`,
  `/clients/[id]/odontograma`, `/clients/[id]/planejamento`.
- **Document upload + auto-ingest.** PDF / TXT / JSON / HTML files attached to
  a patient are stored under `api/data/documents/patients/<id>/` and pushed
  into the RAG index in the background.
- **Anamnesis auto-ingest.** Saving or editing an anamnesis writes a JSON
  snapshot alongside the patient documents and re-indexes it, so the assistant
  always sees the latest answers.
- **Per-patient assistant** — `/assistant`. Streamed answers via SSE with
  citations, scoped strictly to the selected patient.
- **Financial tracking** — `/financeiro` (in progress).

## License

Academic project — Oficina 2.

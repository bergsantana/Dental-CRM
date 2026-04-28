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
                                    │ Postgres :5432│                  │  llama3:8b         │
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
  (`llama3:8b` + `nomic-embed-text`), pdf-parse, cheerio.

## Running the project

Everything is wired through `docker-compose`. The override file enables hot
reload for `api` and `rag` so editing files on the host is enough.

### Prerequisites

- Docker + Docker Compose.
- [Ollama](https://ollama.com/) running on the host (`ollama serve`). The
  containerised `ollama` service is commented out by default — running it on
  the host is faster and avoids re-downloading models. Pull the models once:

  ```bash
  ollama pull llama3:8b
  ollama pull nomic-embed-text
  ```

  The `rag` container reaches the host through `host.docker.internal` (set up
  in [docker-compose.override.yml](docker-compose.override.yml)).

### 1. Configure environment

Copy the example env files (defaults work for local dev):

```bash
cp api/.env.example api/.env
cp rag-pipeline/.env.example rag-pipeline/.env
```

Optionally create `.env` at the repo root to override compose defaults:

```env
POSTGRES_USER=dental
POSTGRES_PASSWORD=dental
POSTGRES_DB=dental_crm
JWT_SECRET=dev-secret-change-me
RAG_AUTH_TOKEN=changeme
APP_ORIGIN=http://localhost:3567
```

### 2. Start the backing services

```bash
docker compose up -d postgres chroma adminer
```

- Postgres → `localhost:5432`
- Chroma → `localhost:8000`
- Adminer (DB UI) → `http://localhost:8080`

### 3. Run database migrations

```bash
cd api
pnpm install
pnpm drizzle:migrate
cd ..
```

### 4. Start the API and RAG service

```bash
docker compose up api rag
```

Both run with hot reload. Logs:

```bash
docker compose logs -f api rag
```

The API listens on `http://localhost:4000` and the RAG service on
`http://localhost:3000`.

### 5. Start the frontend

The frontend runs on the host (not in compose):

```bash
cd app
pnpm install
pnpm dev
```

Open [http://localhost:3567](http://localhost:3567) (or whatever port Next.js
picks). Sign up to create your first clinic, then start adding patients,
documents and anamneses — uploads and anamneses are auto-ingested into the
patient's RAG index, so the **Assistente** page can immediately answer
questions about that patient.

### Optional: ingest the bundled sample patient

```bash
docker compose run --rm rag pnpm ingest --dir data/sample/patient-001 --patient 001
```

### Useful commands

| Command | Purpose |
|---|---|
| `docker compose up -d postgres chroma` | Start only the storage layer. |
| `docker compose logs -f api rag` | Tail API and RAG logs. |
| `docker compose down -v` | Stop everything and **drop volumes** (resets DB and Chroma). |
| `cd api && pnpm drizzle:generate` | Generate a new Drizzle migration. |
| `cd api && pnpm drizzle:migrate` | Apply pending migrations. |
| `cd app && pnpm dev` | Run the Next.js dev server. |

### Troubleshooting

- **`rag` container can't reach Ollama** — confirm `ollama serve` is up on the
  host and that `OLLAMA_URL=http://host.docker.internal:11434` (set by the
  override file).
- **`401 unauthorized` from the RAG service** — `RAG_AUTH_TOKEN` must match in
  both `api/.env` and `rag-pipeline/.env` (or use the compose default).
- **Port collisions** — the frontend defaults try `3567`/`3000`; the RAG
  service holds `3000` in compose. Stop one or change `PORT` in
  `app/.env.local`.

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

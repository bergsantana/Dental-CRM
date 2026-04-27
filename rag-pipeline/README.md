# Dental-CRM RAG pipeline

A minimal Retrieval-Augmented Generation service for querying patient data with
**Ollama + LLaMA 3** and **ChromaDB**. Everything runs in Docker; one
`docker compose up` boots the whole stack.

## Components

| Stage | Implementation |
|---|---|
| Document ingestion | PDF (`pdf-parse`), TXT/MD (fs), HTML (`cheerio`), JSON records (one record = one chunk) |
| Chunking | `RecursiveCharacterTextSplitter` — **500 chars / 75 overlap (~15%)** for prose; **1 chunk per record** for structured JSON |
| Embeddings | `nomic-embed-text` via Ollama `/api/embeddings` |
| Vector DB | ChromaDB (server) with cosine distance, metadata filter on `patientId` |
| Retrieval | top-k semantic search (k=8 default) |
| Re-ranking (optional) | `Xenova/bge-reranker-base` cross-encoder via `@xenova/transformers` |
| Generation | `llama3:8b` via Ollama `/api/chat`, streamed |

### Why these chunk sizes?

Clinical notes are short and dense. **500 characters** ≈ 1–2 short paragraphs:
big enough to retain context for a single finding, small enough that top-k
retrieval stays focused on the question. **75 chars (~15%) overlap** preserves
sentence continuity across boundaries so a fact split between two chunks is
still recoverable. JSON records are already semantically atomic (one
appointment, one finding), so each becomes its own chunk — splitting them
would destroy meaning.

## Architecture

```
┌────────────┐   pull     ┌────────────────────┐
│ ollama-    │──models──▶ │  ollama (LLM)      │◀────┐
│ bootstrap  │            │  :11434            │     │
└────────────┘            └────────────────────┘     │ embed / chat
                                                     │
                          ┌────────────────────┐     │
                          │  rag-app (Node/TS) │─────┘
                          │  Fastify :3000     │─────┐
                          └────────────────────┘     │ upsert / query
                                                     │
                          ┌────────────────────┐     │
                          │  chroma :8000      │◀────┘
                          └────────────────────┘
```

## Quickstart

```bash
cd rag-pipeline

# 1. Bring everything up. First run pulls llama3:8b (~4.7 GB) and
#    nomic-embed-text (~270 MB) into a named volume — be patient.
docker compose up -d

# 2. Watch model pulls (optional)
## docker compose logs -f ollama-bootstrap

# 3. Ingest the sample patient
docker compose run --rm rag-app pnpm ingest \
  --dir data/sample/patient-001 --patient 001

# 4a. Ask via REST (streams Server-Sent Events)
curl -N -X POST http://localhost:3000/chat \
  -H 'content-type: application/json' \
  -d '{"patientId":"001","question":"O paciente tem alguma alergia?"}'

# 4b. Or use the interactive CLI inside the container
docker compose exec rag-app pnpm chat --patient 001
```

## REST API

### `POST /ingest`
```json
{ "patientId": "001", "dir": "data/sample/patient-001" }
```
Either `dir` or `file` is required. Path is resolved inside the container
(`./data` on the host is mounted to `/app/data`).

### `POST /chat` — streams SSE
```json
{ "patientId": "001", "question": "...", "k": 8, "rerank": false }
```
Events:
- `event: sources` — JSON array of `{source, index, distance}`
- `data: "<token>"` — repeated; one per generated piece
- `event: done` — terminal

### `GET /health`
Returns connection info.

## Configuration

Environment variables (defaults shown in [`.env.example`](.env.example)):

| Var | Default | Purpose |
|---|---|---|
| `OLLAMA_URL` | `http://ollama:11434` | Ollama host |
| `CHROMA_URL` | `http://chroma:8000` | Chroma host |
| `LLM_MODEL` | `llama3:8b` | Generation model |
| `EMBED_MODEL` | `nomic-embed-text` | Embedding model |
| `TOP_K` | `8` | Default `nResults` |
| `RERANK` | `false` | Enable cross-encoder re-rank |

To use a different model, set it in your shell before `docker compose up`:
```bash
LLM_MODEL=llama3.1:8b docker compose up -d
```

## Verification

```bash
# All services up
docker compose ps

# Models pulled
docker compose exec ollama ollama list

# Chroma reachable from rag-app
docker compose exec rag-app wget -qO- http://chroma:8000/api/v1/heartbeat

# End-to-end
curl -N -X POST http://localhost:3000/chat \
  -H 'content-type: application/json' \
  -d '{"patientId":"001","question":"What medications is the patient taking?"}'
```

## GPU (optional)

Edit `docker-compose.yml` and uncomment the `deploy.resources` block under
`ollama`. Requires the
[NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html).

## Tear down

```bash
docker compose down            # stop containers, keep volumes (ingested data + models)
docker compose down -v         # also wipe ingested data and downloaded models
```

## Notes / limitations

- Patient isolation is enforced via Chroma metadata filter on `patientId`.
  Do not bypass that filter in custom queries.
- Answers are **not medical advice**; the system prompt enforces this.
- OCR for scanned PDFs is out of scope; only text-extractable PDFs work.
- Re-ranker downloads ~270 MB on first use (cached in the container layer).

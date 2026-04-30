# Dental-CRM

> CRM inteligente para clínicas odontológicas com assistente RAG por paciente.

Dental-CRM é uma aplicação web de gestão clínica e de pacientes integrada a um serviço privado de **Geração Aumentada por Recuperação (RAG)**. O CRM gerencia clínicas, dentistas, pacientes, agendamentos, anamneses, odontograma e planejamentos de tratamento. O serviço RAG executa localmente (Ollama + ChromaDB) e expõe uma pequena API REST que o backend NestJS proxia, permitindo ao assistente responder perguntas fundamentadas exclusivamente nos registros de **um único paciente**.

> **Projeto acadêmico** — Oficina 2 / UEA.

---

## Índice

- [Visão geral](#visão-geral)
- [Layout do repositório](#layout-do-repositório)
- [Arquitetura](#arquitetura)
  - [Diagrama de componentes](#diagrama-de-componentes)
  - [Pipeline RAG detalhado](#pipeline-rag-detalhado)
  - [Modelo de dados](#modelo-de-dados)
- [Stack tecnológico](#stack-tecnológico)
- [Funcionalidades](#funcionalidades)
- [Gerenciando agendamentos pelo chat](#gerenciando-agendamentos-pelo-chat)
- [Instalação e execução](#instalação-e-execução)
  - [Pré-requisitos](#pré-requisitos)
  - [Bootstrap com um comando](#bootstrap-com-um-comando)
  - [Frontend (Next.js)](#frontend-nextjs)
  - [Ingestão do paciente de exemplo](#ingestão-do-paciente-de-exemplo)
  - [Comandos úteis](#comandos-úteis)
  - [Variáveis de ambiente](#variáveis-de-ambiente)
  - [Solução de problemas](#solução-de-problemas)
- [API REST do serviço RAG](#api-rest-do-serviço-rag)
- [Decisões técnicas](#decisões-técnicas)
- [Limitações conhecidas](#limitações-conhecidas)
- [Licença](#licença)

---

## Visão geral

| Aspecto | Detalhe |
|---|---|
| Tipo | Micro SaaS / Projeto acadêmico |
| Domínio | Odontologia — gestão de clínicas, pacientes e assistente clínico |
| Modelo de tenancy | Multi-tenant (por clínica), com isolamento de dados garantido na camada de banco e no vetor store |
| Execução | Totalmente local — sem chamadas a APIs externas pagas. LLMs via Ollama |

---

## Layout do repositório

```
Dental-CRM/
├── app/              # Frontend Next.js 15 / React 19 / TypeScript / Tailwind v4
├── api/              # Backend NestJS 11 / Drizzle / Postgres — trust boundary
├── rag-pipeline/     # Serviço Fastify — ingestão, embeddings, ChromaDB, chat LLM
├── scripts/
│   └── start.sh      # Bootstrap idempotente do stack completo
├── docker-compose.yml
└── docker-compose.override.yml
```

| Caminho | Descrição |
|---|---|
| [`app/`](app) | Interface CRM: dashboard, clientes, agenda, odontograma, anamnese, planejamento, financeiro, empresas, assistente. |
| [`api/`](api) | Auth JWT, membros de clínica, pacientes, agendamentos, anamneses, documentos, chat, proxy RAG. |
| [`rag-pipeline/`](rag-pipeline) | Ingestão de documentos, embeddings (`nomic-embed-text`), ChromaDB, chat LLaMA / phi3, métricas RAG-Triad. |

---

## Arquitetura

### Diagrama de componentes

```
┌──────────────────────┐  HTTP   ┌──────────────────────┐  HTTP / SSE  ┌────────────────────────┐
│  Next.js app (app/)  │ ──────▶ │  NestJS API (api/)   │ ───────────▶ │  RAG service           │
│  • UI do CRM         │         │  • auth / clínicas   │              │  Fastify  :3000        │
│  • Chat por paciente │ ◀────── │  • pacientes / docs  │ ◀─────────── │  (rag-pipeline/)       │
└──────────────────────┘  JWT    │  • proxy do chat RAG │  tokens +    └────────┬───────────────┘
                                 └──────────┬───────────┘  sources              │ embed / chat
                                            │                                   ▼
                                            ▼                          ┌────────────────────┐
                                    ┌──────────────┐                   │  Ollama  :11434    │
                                    │ Postgres :5432│                   │  phi3:mini         │
                                    └──────────────┘                   │  nomic-embed-text  │
                                                                       └────────────────────┘
                                                                                ▲
                                                                                │ upsert / query
                                                                       ┌────────┴───────────┐
                                                                       │  ChromaDB  :8000   │
                                                                       └────────────────────┘
```

> O frontend **nunca** se comunica diretamente com o serviço RAG. O isolamento por paciente é aplicado no servidor via filtro de metadados `patientId` no ChromaDB.

### Pipeline RAG detalhado

```
Documento (PDF/TXT/JSON/HTML)
        │
        ▼
  [Loader]  pdf-parse | cheerio | fs
        │
        ▼
  [Chunker]  RecursiveCharacterTextSplitter
             • Prosa:  500 chars / 75 overlap (~15%)
             • JSON:   1 chunk por registro (atomico)
        │
        ▼
  [Embeddings]  nomic-embed-text via Ollama /api/embeddings
        │
        ▼
  [Vector Store]  ChromaDB — cosine distance
                  metadata: { patientId, source, chunkIndex }
        │
   pergunta do usuário
        │
        ▼
  [Retrieval]  top-k semântico (k=8 padrão)
        │
        ▼ (opcional)
  [Re-ranker]  Xenova/bge-reranker-base (cross-encoder)
               mantém top-3 chunks
        │
        ▼
  [Geração]  phi3:mini via Ollama /api/chat — streamed SSE
        │
        ▼
  [Avaliação RAG-Triad]  (pós-geração, não-bloqueante)
       • Context Relevance  — cosine(question_emb, chunk_embs)
       • Groundedness       — cosine por sentença da resposta vs chunks
       • Answer Relevance   — cosine(question_emb, answer_emb)
```

### Modelo de dados

Tabelas principais (Postgres 16, gerenciadas pelo Drizzle ORM):

| Tabela | Descrição |
|---|---|
| `users` | Usuários do sistema (dentistas, assistentes, recepcionistas) |
| `clinics` | Clínicas cadastradas (soft-delete) |
| `clinic_members` | Membership + roles (`owner`, `dentist`, `assistant`, `receptionist`) |
| `patients` | Cadastro de pacientes por clínica (soft-delete, CPF único por clínica) |
| `appointments` | Agendamentos com status (`requested`, `scheduled`, `confirmed`, `completed`, `cancelled`, `no_show`) |
| `anamneses` | Ficha anamnésica estruturada (alergias, medicações, histórico, consentimento) |
| `patient_documents` | Documentos enviados com status de ingestão RAG (`pending`, `processing`, `ready`, `failed`) |
| `chat_sessions` | Sessões de chat por paciente / usuário / clínica |
| `chat_messages` | Mensagens com fontes, tokens e métricas RAG-Triad por mensagem |
| `booking_tokens` | Tokens single-use (sha256) para auto-agendamento de pacientes via link público |

---

## Stack tecnológico

### Frontend (`app/`)

| Tecnologia | Versão | Uso |
|---|---|---|
| Next.js | 15 | App Router, RSC, SSE consumer |
| React | 19 | UI |
| TypeScript | 5 | Tipagem estática |
| Tailwind CSS | v4 | Estilização |
| shadcn-ui / Radix | latest | Componentes acessíveis |
| react-hook-form + zod | latest | Formulários e validação |
| lucide-react | latest | Ícones |
| sonner | latest | Notificações toast |

### API (`api/`)

| Tecnologia | Versão | Uso |
|---|---|---|
| NestJS | 11 | Framework HTTP / módulos |
| Drizzle ORM | latest | Queries type-safe + migrações |
| Postgres | 16 | Banco relacional principal |
| JWT (Passport) | — | Autenticação stateless |
| class-validator | latest | Validação de DTOs |

### RAG Pipeline (`rag-pipeline/`)

| Tecnologia | Versão | Uso |
|---|---|---|
| Fastify | 4 | HTTP server do serviço RAG |
| ChromaDB (client) | latest | Vetor store com filtro de metadados |
| Ollama | host | Servidor de LLMs locais |
| phi3:mini | ~2.3 GB | Modelo de geração (LLM) |
| nomic-embed-text | ~270 MB | Modelo de embeddings |
| langchain text splitters | latest | `RecursiveCharacterTextSplitter` |
| @xenova/transformers | latest | Cross-encoder reranker (opcional) |
| pdf-parse | latest | Extração de texto de PDFs |
| cheerio | latest | Parser HTML |
| zod | latest | Validação de payloads da API |

---

## Funcionalidades

- **Multi-tenant por clínica.** Um usuário pode possuir clínicas e ser membro de clínicas de outros. Roles por clínica (`owner`, `dentist`, `assistant`, `receptionist`) são independentes.
- **Gestão de clínicas** — `/companies`. Troca de contexto entre clínicas.
- **Agenda** — `/calendar`, `/minha-agenda`, `/agendamentos`. Agendamento em nome de qualquer dentista da clínica. Solicitações pendentes (status `requested`) aparecem no topo de `/agendamentos` com ações **Confirmar** / **Recusar**.
- **Auto-agendamento de paciente** — Em `/clients/[id]`, na aba **Consultas**, gere um link single-use (válido por 7 dias). O paciente acessa `/book/<token>` (público), escolhe dentista, data e duração, e cria uma solicitação em status `requested` que a recepção aprova ou recusa.
- **Cadastro de pacientes** com perfil, anamnese, odontograma e planejamento de tratamento — `/clients`, `/clients/[id]/...`.
- **Upload de documentos + ingestão automática.** PDFs, TXT, JSON e HTML anexados a um paciente são armazenados em `api/data/documents/patients/<id>/` e indexados no RAG em background.
- **Anamnese auto-ingerida.** Salvar ou editar uma anamnese grava um snapshot JSON e re-indexa, garantindo que o assistente sempre veja as respostas mais recentes.
- **Assistente por paciente** — `/assistant`. Respostas streamadas via SSE com citações de fontes, escopo estritamente por paciente. Comandos para gerenciar agendamentos diretamente no chat: `/listar`, `/criar`, `/remarcar`, `/cancelar`, `/confirmar`, `/recusar`, `/ajuda`. Cada ação passa por um passo de confirmação (preview → Confirmar) e é registrada no histórico da conversa.
- **Métricas RAG-Triad** persistidas por mensagem (`context_relevance`, `groundedness`, `answer_relevance`).
- **Financeiro** — `/financeiro` (em desenvolvimento).

---

## Gerenciando agendamentos pelo chat

A página `/assistant` aceita **comandos com barra (`/`)** que executam ações no módulo de agendamentos sem sair da conversa. O fluxo é sempre **preview → confirmar**: o chat primeiro mostra um resumo da ação proposta, e a operação só é gravada no banco quando você clica em **Confirmar**.

> **Escopo.** Os comandos atuam exclusivamente sobre o paciente da sessão de chat ativa (selecionado no painel lateral). Não é possível operar em agendamentos de outro paciente pelo chat — o backend rejeita.

### Como usar

1. Abra `/assistant` e selecione um paciente.
2. Digite um comando começando com `/` no campo de mensagem (ex.: `/listar`).
3. O assistente responde com o **preview** da ação.
4. Para ações que alteram dados (criar / remarcar / cancelar / confirmar / recusar), clique em **Confirmar** ou **Cancelar** nos botões inline.
5. Após confirmar, o chat acrescenta uma mensagem do assistente registrando o resultado e gravando `metadata.action` no histórico.

Mensagens que **não** começam com `/` continuam usando o RAG SSE normal (perguntas livres sobre anamnese, alergias, medicações, etc.).

### Referência de comandos

| Comando | Argumentos | Descrição |
|---|---|---|
| `/ajuda` | — | Lista todos os comandos disponíveis. Aliases: `/help`. |
| `/listar` | `[limite=N]` ou `[N]` (1–50, padrão 5) | Mostra os próximos agendamentos do paciente. **Não exige confirmação.** |
| `/criar` | `dentista=<uuid>` `data=<YYYY-MM-DD HH:mm>` `duracao=<min>` `[motivo="..."]` | Cria uma nova solicitação (status `requested`). Aliases: `/agendar`. |
| `/remarcar` | `<appointmentId>` `data=<YYYY-MM-DD HH:mm>` `[duracao=<min>]` | Move o horário de um agendamento existente (não-terminal). |
| `/cancelar` | `<appointmentId>` `[motivo="..."]` | Cancela um agendamento (soft-cancel). |
| `/confirmar` | `<appointmentId>` | Aprova uma solicitação pendente (`requested` → `confirmed`). Aliases: `/aprovar`. |
| `/recusar` | `<appointmentId>` `[motivo="..."]` | Recusa uma solicitação pendente. Aliases: `/rejeitar`. |

**Convenções de argumentos**

- `key=value` para todos os parâmetros nomeados.
- Valores com espaço precisam de aspas: `motivo="paciente desistiu"`, `data="2026-05-02 14:00"`.
- `appointmentId` e `dentista` aceitam UUIDs v4 (formato com hífens).
- `data` aceita `YYYY-MM-DD HH:mm` (interpretado no fuso do navegador) **ou** ISO-8601 (`2026-05-02T17:00:00Z`).
- `duracao` é em minutos, inteiro entre 5 e 480.

### Exemplos

```text
/listar
/listar limite=10

/criar dentista=33333333-3333-4333-8333-333333333333 data="2026-05-02 14:00" duracao=30 motivo="limpeza"

/remarcar 44444444-4444-4444-8444-444444444444 data="2026-05-02 15:30" duracao=45

/cancelar 22222222-2222-4222-8222-222222222222 motivo="paciente desistiu"

/confirmar 11111111-1111-4111-8111-111111111111
/recusar   55555555-5555-4555-8555-555555555555 motivo="dentista indisponível"
```

### Como obter os UUIDs

- **`appointmentId`**: rode `/listar` — cada linha do preview inclui o ID. Alternativamente, copie da página `/agendamentos` (clicando em uma linha, o ID aparece na URL/dialog).
- **`dentista`**: na página `/calendar` ou `/minha-agenda`, ou via `GET /clinics/:id/dentists` na API.

### Erros comuns

| Mensagem | Causa | Como resolver |
|---|---|---|
| `Comando desconhecido: /xyz` | Comando não existe | Use `/ajuda` para ver a lista. |
| `dentista deve ser um UUID válido.` | UUID malformado | Confira o formato `xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx`. |
| `Falta data=<YYYY-MM-DD HH:mm>.` | Argumento ausente | Inclua o argumento; lembre das aspas se houver espaço. |
| `Horário indisponível` (409) | Conflito de overlap com outro agendamento do mesmo dentista | Escolha outro horário e rode o `/criar` ou `/remarcar` novamente. |
| `Este agendamento já está cancelado.` | Operação em registro terminal | Não há ação a fazer; o registro está finalizado. |
| `Falha ao confirmar: ...` | Erro no commit (BE retornou erro) | A mensagem inline mostra o motivo (validação, permissão ou conflito). |

### Endpoint subjacente

Os comandos do chat chamam `POST /chat/sessions/:id/actions` com `{ kind, mode: "preview" | "commit", args }`. Esse endpoint é **separado** do streaming SSE (`POST /chat/sessions/:id/messages`) — assim a digitação livre continua respondendo via Ollama enquanto as ações de agendamento são síncronas e transacionais.

---

## Instalação e execução

### Pré-requisitos

| Requisito | Notas |
|---|---|
| Docker + Docker Compose | Stack completo roda via compose |
| [Ollama](https://ollama.com/) | Instalado **no host** (não no Docker por padrão). O script de bootstrap garante que ele escute em `0.0.0.0:11434`. |
| Node.js ≥ 20 + pnpm | Necessário apenas para o frontend Next.js (roda fora do compose) |

> **GPU (opcional):** Edite `docker-compose.yml` e descomente o bloco `deploy.resources` sob o serviço `ollama`. Requer o [NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html).

### Bootstrap com um comando

```bash
./scripts/start.sh
```

O script é **idempotente** e executa:

1. Verifica dependências (`docker`, `ollama`, `curl`).
2. Reinicia o Ollama em `0.0.0.0:11434` se estiver vinculado ao loopback.
3. Faz pull de `phi3:mini` (~2.3 GB) e `nomic-embed-text` (~270 MB) se ausentes.
4. Cria `api/.env` e `rag-pipeline/.env` a partir dos arquivos `*.env.example` na primeira execução.
5. Builda as imagens e sobe o stack.
6. Aguarda Postgres / API / RAG ficarem saudáveis e exibe todas as URLs.

As migrações do banco de dados são aplicadas automaticamente na inicialização do container `api`.

### Frontend (Next.js)

O app Next.js roda **no host**, fora do compose:

```bash
cd app
pnpm install
pnpm dev
```

Acesse [http://localhost:3567](http://localhost:3567). Faça cadastro para criar sua primeira clínica, depois adicione pacientes, documentos e anamneses — uploads e anamneses são auto-ingeridos no índice RAG do paciente, então a página **Assistente** pode imediatamente responder perguntas sobre ele.

### Ingestão do paciente de exemplo

```bash
docker compose run --rm rag pnpm ingest --dir data/sample/patient-001 --patient 001
```

### Comandos úteis

| Comando | Finalidade |
|---|---|
| `./scripts/start.sh` | Bootstrap ou refresh do stack |
| `docker compose logs -f api rag` | Acompanhar logs da API e do RAG |
| `docker compose down` | Parar o stack |
| `docker compose down -v` | Parar e **apagar volumes** (reseta DB e ChromaDB) |
| `docker exec dental-crm-api-1 pnpm db:migrate` | Aplicar migrações pendentes manualmente |
| `cd api && pnpm db:generate` | Gerar nova migração Drizzle a partir de mudanças no schema |

### Variáveis de ambiente

#### `api/.env` (gerado a partir de `api/.env.example`)

| Variável | Padrão | Descrição |
|---|---|---|
| `PORT` | `4000` | Porta da API NestJS |
| `APP_ORIGIN` | `http://localhost:3567` | Origem do frontend (CORS) |
| `DATABASE_URL` | `postgres://dental:dental@localhost:5432/dental_crm` | URL de conexão com o Postgres |
| `JWT_SECRET` | `change-me-in-prod` | Segredo para assinar tokens JWT |
| `JWT_EXPIRES_IN` | `7d` | Expiração dos tokens |
| `RAG_URL` | `http://localhost:3000` | URL interna do serviço RAG |
| `RAG_AUTH_TOKEN` | `change-me-in-prod` | Token compartilhado API ↔ RAG |
| `DOCUMENTS_DIR` | `./data/documents` | Diretório de documentos dos pacientes |

#### `rag-pipeline/.env` (gerado a partir de `rag-pipeline/.env.example`)

| Variável | Padrão | Descrição |
|---|---|---|
| `OLLAMA_URL` | `http://ollama:11434` | URL do servidor Ollama |
| `CHROMA_URL` | `http://chroma:8000` | URL do servidor ChromaDB |
| `LLM_MODEL` | `phi3:mini` | Modelo de geração |
| `EMBED_MODEL` | `nomic-embed-text` | Modelo de embeddings |
| `PORT` | `3000` | Porta do serviço RAG |
| `TOP_K` | `8` | Número de chunks recuperados por consulta |
| `RERANK` | `false` | Ativar cross-encoder reranker |
| `RAG_AUTH_TOKEN` | `changeme` | Deve coincidir com o valor na `api/.env` |

Para usar um modelo diferente:
```bash
LLM_MODEL=llama3.2:3b docker compose up -d
```

### Solução de problemas

| Sintoma | Solução |
|---|---|
| `rag` não alcança Ollama (`ECONNREFUSED 172.17.0.1:11434`) | Ollama está vinculado ao loopback. Execute `./scripts/start.sh` (corrige automaticamente) ou `OLLAMA_HOST=0.0.0.0:11434 ollama serve`. |
| `401 Unauthorized` do serviço RAG | `RAG_AUTH_TOKEN` deve ser idêntico em `api/.env` e `rag-pipeline/.env`. |
| `column "..." does not exist` | Migração pendente. Execute `docker exec dental-crm-api-1 pnpm db:migrate`. |
| Colisão de portas | O frontend usa `3567`; o RAG usa `3000`. Finalize o processo conflitante ou altere `PORT` em `app/.env.local`. |
| Re-ranker lento no primeiro uso | O modelo `bge-reranker-base` (~270 MB) é baixado na primeira ativação e cacheado na camada do container. |

---

## API REST do serviço RAG

Base URL: `http://localhost:3000`

### `GET /v1/health`

Retorna status da conexão com Ollama e ChromaDB.

```json
{ "ok": true, "ollama": "http://...", "chroma": "http://...", "model": "phi3:mini" }
```

### `POST /v1/ingest`

Ingere documentos de um paciente no ChromaDB.

```json
{ "patientId": "uuid", "dir": "data/sample/patient-001" }
```

`dir` ou `file` ou `files[]` é obrigatório. Retorna `{ "docs": N, "chunks": M }`.

### `POST /v1/chat` — SSE

Responde a uma pergunta com streaming Server-Sent Events.

```json
{ "patientId": "uuid", "question": "...", "k": 8, "rerank": false }
```

Eventos emitidos:

| Evento | Payload | Descrição |
|---|---|---|
| `event: sources` | `[{source, index, distance}]` | Chunks recuperados |
| `data: "<token>"` | string | Tokens gerados pelo LLM |
| `event: metrics` | `{contextRelevance, groundedness, answerRelevance, perChunk}` | RAG-Triad pós-geração |
| `event: done` | `{}` | Fim do stream |
| `event: error` | `{message}` | Erro durante geração |

---

## Decisões técnicas

### Por que Ollama no host e não no Docker?

Ollama com GPU requer o driver NVIDIA e o Container Toolkit no host. Rodá-lo diretamente no host elimina essa complexidade para o caso de uso acadêmico e permite compartilhar modelos já baixados entre projetos. O `docker-compose.yml` mantém o serviço `ollama` comentado com instruções para ativá-lo caso necessário.

### Por que ChromaDB como vetor store?

ChromaDB oferece filtragem de metadados nativa (usada para o isolamento por `patientId`), zero configuração de infraestrutura extra, e um cliente JavaScript oficial. Alternativas como pgvector exigiriam extensão no Postgres e perderiam a separação de preocupações entre o banco relacional e o vetor store.

### Estratégia de chunking: 500 chars / 75 overlap

Notas clínicas são curtas e densas. **500 caracteres** ≈ 1–2 parágrafos curtos: grande o suficiente para reter contexto de um achado, pequeno o suficiente para que o top-k permaneça focado na pergunta. **75 chars (~15%) de overlap** preserva continuidade entre fronteiras de chunks, tornando fatos divididos ainda recuperáveis. Registros JSON (anamnese, agendamentos) são semanticamente atômicos — cada registro vira um único chunk para não destruir o significado.

### Por que phi3:mini como LLM padrão?

`phi3:mini` (~2.3 GB) roda em CPUs modernas sem GPU dedicada, entrega respostas de qualidade aceitável para domínio clínico em português e inglês, e puxa rápido no primeiro `./scripts/start.sh`. O modelo é configurável via variável de ambiente `LLM_MODEL` para quem quiser usar `llama3.2:3b` ou modelos maiores.

### Avaliação RAG-Triad sem LLM-as-judge

Em vez de um segundo LLM avaliador (caro e lento), o sistema calcula três métricas via similaridade de embeddings:
- **Context Relevance**: `cosine(question_emb, chunk_embs)` — mede se os chunks recuperados são pertinentes.
- **Groundedness**: `cosine(sentence_embs, chunk_embs)` por sentença da resposta — mede se a resposta é suportada pelo contexto.
- **Answer Relevance**: `cosine(question_emb, answer_emb)` — mede se a resposta endereça a pergunta.

Essas métricas são persistidas na tabela `chat_messages` para análise histórica.

### Por que NestJS como API gateway em vez de acesso direto ao RAG?

O NestJS atua como fronteira de segurança: valida o JWT do usuário, verifica que o paciente pertence à clínica do usuário, injeta o `RAG_AUTH_TOKEN` e só então repassa a requisição ao serviço RAG. O frontend nunca vê o token de auth do RAG nem pode acessar dados de outros pacientes.

### Drizzle ORM em vez de Prisma ou TypeORM

Drizzle ORM oferece inferência de tipos 100% em TypeScript sem geração de código, queries type-safe próximas ao SQL puro, e migrações como arquivos SQL versionáveis. Prisma exige um cliente gerado separado; TypeORM tem decorators que conflitam com o sistema de módulos do NestJS 11.

---

## Limitações conhecidas

| Limitação | Detalhe |
|---|---|
| **OCR não suportado** | Apenas PDFs com texto extraível funcionam. PDFs escaneados (imagens) são ignorados pelo `pdf-parse`. |
| **Sem autenticação no RAG service** | O `RAG_AUTH_TOKEN` é um bearer token simples — não há rotação automática. Não expor a porta `3000` publicamente. |
| **Sem multi-idioma explícito** | O system prompt está em português. Perguntas em inglês funcionam mas a qualidade pode variar com `phi3:mini`. |
| **Financeiro incompleto** | A rota `/financeiro` está em desenvolvimento — apenas scaffold da UI existe. |
| **Re-ranker intensivo** | `bge-reranker-base` aumenta latência significativamente em CPU. Desative (`RERANK=false`) se a latência for crítica. |
| **Sem streaming de ingestão** | Ingestão de diretórios grandes é síncrona e bloqueia o endpoint `POST /v1/ingest` até concluir. |
| **Volume compartilhado API ↔ RAG** | `api/data` é montado em ambos os containers. Em produção, substituir por object storage (S3/MinIO). |
| **JWT não revogável** | Tokens expiram em 7 dias. Não há blacklist — logout no cliente simplesmente descarta o token localmente. |
| **Ollama no host** | O serviço RAG se conecta ao Ollama via `host.docker.internal` / `0.0.0.0:11434`. Em Linux, isso requer `--add-host=host.docker.internal:host-gateway` (já configurado no compose). |

---

## Licença

Projeto acadêmico — Oficina 2 / UEA.

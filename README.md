# Global Harvest Initiative — Next.js Edition

Multi-agent AI missiological training system for Chinese Christian
missionaries, ported from a single-process Gradio/Python app to a
scalable Next.js 14 (App Router) application. One orchestrator agent +
34 module specialists, grounded in curriculum content via BM25
retrieval, running on an OpenAI-compatible provider (Cerebras
`gpt-oss-120b` primary / Together AI as an optional third-tier fallback —
all configurable via env, see `.env.example` and `lib/env.ts`), with a
Postgres-backed mentor dashboard.

> Note: the routing supervisor and critic/QA passes use a separate,
> configurable `SUPERVISOR_CRITIC_MODEL` (defaults to the primary fallback
> model) so their cheap classification calls can be pointed at a smaller
> model independently of the main answer model.

## Why this architecture (vs. the original)

The original app was a single Python process: Gradio serving the UI,
an in-memory BM25 cache, and a SQLite file for the mentor feature. That
works great for one server, but doesn't scale horizontally — SQLite has
no story for multiple replicas, and a single Python process caps
concurrency at whatever `asyncio`/threads can push through one box.

This port keeps every piece of *business logic* 1:1 (system prompts,
guardrails, retry/fallback order, BM25 scoring, quiz/case-study schemas,
escalation keywords) and changes only the *infrastructure*:

| Concern | Original | Next.js version | Why |
|---|---|---|---|
| UI + server | Gradio (1 Python process) | Next.js App Router (React + API routes) | Standard web stack, CDN-able static assets, independent scaling of UI vs. API |
| Mentor DB | SQLite file on local disk | **Postgres** via Prisma | Serverless/multi-replica deployments have no durable local disk; Postgres is the shared source of truth every instance talks to |
| Sessions | Gradio's server-side session object | Signed JWT cookie (`jose`) | Stateless — any instance can serve any request, no sticky sessions needed |
| Curriculum content | `books/<module>/*.md` on disk | `content/books/<module>/*.md` bundled in the repo | Same approach, just moved into the Next.js project; still plain BM25 (no vector DB) as requested — see "Scaling the RAG layer" below if you outgrow this |
| LLM calls | `groq` Python SDK | Plain `fetch` to Groq's OpenAI-compatible REST API | No Python-only SDK dependency; same retry/backoff/fallback logic ported line-for-line |
| Chat streaming | Gradio's built-in streaming textbox | `ReadableStream` response consumed by the client with `fetch` + `getReader()` | Native web streaming, works behind any reverse proxy/CDN that passes through chunked responses |

## Project layout

```
src/
  app/
    login/, mentor-login/        access-code gate pages
    chat/                        main Research Chat UI (server shell + client app)
    mentor/                      Mentor Dashboard UI
    api/
      auth/                      login, mentor-login, logout
      session/identify/          set missionary name for mentor tracking
      chat/                      streaming agent chat (Node runtime)
      quiz/, case-study/         JSON-mode generation endpoints
      mentor/                    roster, digest, flags, messages
      health/                    unauthenticated health check (DB + Groq key presence) — point any free uptime monitor at this
  components/                    React components (Sidebar, ChatApp, QuizPanel, ...)
  lib/
    agents.ts                    34 module agents + orchestrator (system prompts) — auto-ported
    agentsMeta.ts                client-safe agent metadata (name/emoji/color only)
    curriculumConfig.ts          module folders/titles/fallback content — auto-ported
    caseSeeds.ts                 BM25 seed keywords per module — auto-ported
    rag.ts                       BM25 chunking + retrieval (Node fs, in-memory cache)
    groq.ts                      Groq REST client, retry/fallback, streaming, prompt assembly
    guardrails.ts                theological guardrail + bilingual rule + language detection
    supervisor.ts                LLM-based routing classifier for ambiguous free-text turns (ENABLE_SUPERVISOR) — see routing.ts's routeToAgentSmart()
    critic.ts                    post-generation reflection/QA pass + one-shot repair (ENABLE_CRITIC) — see groq.ts's callAgentStreamWithCritic()
    scripture.ts                 live Bible-reference verification (bible-api.com, EN+ZH, no key needed) — see PROGRESS.md "QA session #4"
    questionBank.ts               hand-authored offline fallback (quiz + case study per module) used only when Groq AND Cerebras both fail — see PROGRESS.md "QA session #7"
    logger.ts                    structured JSON logging + in-memory provider-call counters — see PROGRESS.md "QA session #8"
    quiz.ts / caseStudies.ts     generation logic (JSON mode)
    mentor.ts                    Postgres-backed mentor feature + escalation detection + digest agent
    routing.ts                   agent routing logic
    auth.ts / apiAuth.ts         signed-cookie sessions + route guards
    db.ts                        Prisma client singleton
content/books/<module>/          curriculum .md files (same layout as the original books/ folder)
prisma/schema.prisma             Postgres schema mirroring the original SQLite tables
```

`lib/agents.ts`, `lib/curriculumConfig.ts`, and `lib/caseSeeds.ts` were
generated directly from the original Python modules (by importing them
and dumping to JSON) rather than hand-retyped, so the 34 system prompts,
module titles, and fallback content are guaranteed to match byte-for-byte.
If the curriculum data changes in a future Python-side edit, regenerate
these the same way rather than hand-editing the `.ts` files.

## Not yet ported

- **`harvest_question_bank.py`** (the static offline case-study fallback
  used only when both Groq and Cerebras are completely down) — see the
  comment in `lib/caseStudies.ts` for exactly where to wire it back in.
- Fine-grained UI parity with the original's dark quiz/case HTML
  (custom fonts, hover animations) — the React version is a clean
  reimplementation with the same information architecture, not a pixel
  clone.

## Multi-agent architecture upgrades: supervisor + critic

Two additions on top of the original single-hop keyword router, both
togglable via env var (see `.env.example`) with no code change needed to
roll back:

**1. LLM-based supervisor routing (`ENABLE_SUPERVISOR`, default on).**
The original `routeToAgent()` (still present, used as the fallback) only
handles two cases: an explicitly selected module, and an exact keyword
match for "quiz". Free-text questions with no exact keyword, or that
touch more than one module at once, used to fall through unpredictably.
`routeToAgentSmart()` in `lib/routing.ts` now adds a cheap classification
call (Llama 3.1 8B, JSON mode, temperature 0 — see `lib/supervisor.ts`)
that picks the single best-fit agent plus up to two secondary modules
worth pulling extra curriculum context from — but **only** for the
genuinely ambiguous case. If the UI already has a specific module/agent
selected or active, that explicit choice is used as-is and the
classifier is never called, so there's no added latency or cost for the
common case of "I'm already in Module 12, here's my follow-up." Any
classifier failure falls back to the original keyword router silently.

**2. Reflection/critic pass (`ENABLE_CRITIC`, default on).**
`THEOLOGICAL_GUARDRAIL` and `BILINGUAL_RULE` (`lib/guardrails.ts`) are
prompt-injected instructions — previously nothing checked, on the output
side, that a given response actually honored them. `callAgentStreamWithCritic()`
in `lib/groq.ts` now runs a second, independent pass (again Llama 3.1 8B,
JSON mode — see `lib/critic.ts`) over the complete response, checking
bilingual compliance, theological-guardrail compliance, and Scripture-
quotation hygiene. If it flags an issue, one automatic repair generation
is attempted before the response ships; if the repair also fails, the
original response ships anyway (fail open, never block the user) and the
finding is logged either way for an audit trail.

**Tradeoff, on purpose:** because the critic needs the *complete*
response to review, and a repaired rewrite may not share a common prefix
with the original, this path fully generates the response server-side
first, then replays the approved final text to the client in simulated-
typing chunks — trading live token-by-token streaming for a guarantee
that nothing unreviewed reaches the missionary. Set `ENABLE_CRITIC=false`
to restore the original live-streaming, unreviewed behavior.

## Setup

```bash
npm install
cp .env.example .env       # fill in GROQ_API_KEY and DATABASE_URL at minimum
npx prisma migrate deploy  # creates the mentor-dashboard tables in Postgres
npm run dev
```

Required env vars (see `.env.example`):

- `GROQ_API_KEY` — required
- `DATABASE_URL` — any Postgres (Vercel Postgres, Neon, Supabase, RDS, self-hosted)
- `ACCESS_CODE` / `MENTOR_ACCESS_CODE` — access-code gates (defaults match the original: `harvest2026` / `mentor2026`)
- `SESSION_SECRET` — set a real random value in production (`openssl rand -base64 32`)
- `CEREBRAS_API_KEY` (optional) — third-tier fallback, same as the original

## Adding curriculum content

Drop `.md` files into `content/books/<module_folder>/`. The BM25 index
for that module rebuilds automatically the next time it's queried (the
cache is keyed by a signature of filename+mtime+size, same invalidation
strategy as the original). In production on most serverless platforms
the filesystem is read-only per deployment, so in practice this means:
commit your `.md` files, redeploy, done.

## Scaling the RAG layer further

BM25-over-bundled-markdown (kept per your direction, "closest to
current") scales fine up to the current 27-module/keyword-search
design. If you want semantic (not just keyword) retrieval — especially
cross-lingual recall, since users query in PT/ES/中文 while much source
content is English — a **hybrid BM25 + pgvector path is now built in and
opt-in**. It's OFF by default (`ENABLE_HYBRID_RAG=false`), fuses the two
retrievers with Reciprocal Rank Fusion, fails open to pure BM25, and
creates its pgvector table lazily (no Prisma migration, so a Postgres
without pgvector can't break your deploy). See `CHANGES.md` → "RAG
híbrido" for how to enable it and run the one-time reindex. The call
sites still depend only on a `(query, moduleNums, topK) => context`
retrieval function (now `retrieveContext` in `lib/retrieval.ts`).

## Deployment notes

- API routes that touch the filesystem (RAG) or Prisma are pinned to
  `export const runtime = "nodejs"` — don't move them to the Edge
  runtime without replacing both.
- `middleware.ts` only gates *page* navigation (redirects to the right
  login screen); every mutating API route re-checks the session
  independently via `requireSession()`, so it's safe even if middleware
  is ever bypassed by a direct API call.
- Horizontal scaling: since sessions are stateless JWT cookies and all
  durable state lives in Postgres, you can run any number of Next.js
  instances behind a load balancer with no sticky-session requirement.

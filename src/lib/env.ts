// Environment / static config. Mirrors harvest_config.py's constants.
// No filesystem side effects here (RAG module handles its own content dir).

// process.env.X ?? fallback only kicks in for null/undefined — but a
// line like "PRIMARY_MODEL=" in a real .env file (present but blank,
// e.g. straight from .env.example) sets process.env.PRIMARY_MODEL to
// an EMPTY STRING, which is neither null nor undefined, so ?? silently
// lets it through as "" instead of falling back. That produced very
// confusing "model `` does not exist" errors. This helper treats blank
// the same as unset for every optional env var below.
function envOr(value: string | undefined, fallback: string): string {
  return value && value.trim() !== "" ? value : fallback;
}

// ── Primary AI provider ──
// Cerebras by default as of 2026-07-28 — chosen specifically for speed.
// Quiz and case-study generation need a lot of output tokens (a full
// bilingual PT/ES case study or 5-question quiz), and Together AI's
// gpt-oss-120b throughput (~600 tokens/sec per Artificial Analysis,
// July 2026) made that generation noticeably slow. Cerebras's
// wafer-scale inference runs the SAME model at ~1,600-3,000 tokens/sec —
// the fastest benchmarked provider for gpt-oss-120b by a wide margin —
// so switching only required changing config, not the surrounding
// retry/streaming/critic logic (every provider in this file speaks the
// same OpenAI-compatible request/response shape). Get a Cerebras key at
// https://cloud.cerebras.ai
//
// History, if reverting is ever useful: this slot held Groq originally
// (fast, but rate limits are per-organization, not per API key, so two
// deployments sharing one Groq account share the same daily quota), then
// DeepSeek (cheap, but its platform was unreachable from this network),
// then Together AI (reliable, but noticeably slower than Cerebras for
// this model — see above). To point this at any of them instead, set
// PRIMARY_BASE_URL to that provider's chat-completions endpoint and use
// its key/model name.
export const PRIMARY_API_KEY = (process.env.PRIMARY_API_KEY ?? "").trim();
export const PRIMARY_BASE_URL = envOr(process.env.PRIMARY_BASE_URL, "https://api.cerebras.ai/v1/chat/completions");
export const PRIMARY_MODEL = envOr(process.env.PRIMARY_MODEL, "gpt-oss-120b");
export const PRIMARY_MODEL_FALLBACK = envOr(process.env.PRIMARY_MODEL_FALLBACK, "gpt-oss-120b");

// Model used ONLY by the supervisor router (lib/supervisor.ts) and the
// critic/QA pass (lib/critic.ts) — cheap, latency-sensitive JSON
// classification calls that have no quality reason to use the large
// primary model. Previously these hardcoded PRIMARY_MODEL_FALLBACK while
// their comments claimed an "8B" model; with the Cerebras defaults that
// slot is the SAME 120b model, so the cost/latency rationale silently did
// not hold. This makes the choice explicit and overridable: point it at a
// genuinely smaller/cheaper model when your provider offers one (e.g. a
// Together AI "openai/gpt-oss-20b"), or leave it defaulting to the primary
// fallback model to preserve the previous behavior exactly.
export const SUPERVISOR_CRITIC_MODEL = envOr(process.env.SUPERVISOR_CRITIC_MODEL, PRIMARY_MODEL_FALLBACK);

// ── Fallback AI provider (optional third-tier fallback) ──
// Together AI by default as of 2026-07-28 — demoted from primary to
// fallback in the same change that made Cerebras primary (see the
// PRIMARY_* comment above for why). Still fully reliable, just slower
// for this specific model, which matters less for a rarely-hit fallback
// path than it does for every single quiz/case-study generation. If you
// don't have a Together AI account, leave FALLBACK_API_KEY unset — that
// tier is skipped entirely and the primary's own retry logic is all
// that runs. Get a key at https://www.together.ai
//
// .trim() guards against a stray trailing newline/space pasted into a
// hosting dashboard's env var field — this exact bug once crashed every
// fallback call with a raw, confusing "TypeError: Headers.append:
// 'Bearer ...'" instead of a normal HTTP error, silently taking down the
// entire reliability fallback chain.
export const FALLBACK_API_KEY = (process.env.FALLBACK_API_KEY ?? "").trim();
export const FALLBACK_BASE_URL = envOr(process.env.FALLBACK_BASE_URL, "https://api.together.ai/v1/chat/completions");
export const FALLBACK_MODEL = envOr(process.env.FALLBACK_MODEL, "openai/gpt-oss-120b");
export const FALLBACK_MODEL_FALLBACK = envOr(process.env.FALLBACK_MODEL_FALLBACK, "openai/gpt-oss-20b");

export const ACCESS_CODE = envOr(process.env.ACCESS_CODE, "harvest2026");
export const MENTOR_ACCESS_CODE = envOr(process.env.MENTOR_ACCESS_CODE, "mentor2026");

// ── Multi-agent architecture upgrades (both default ON; set to "false" to
// roll back to the original keyword-router / no-review behavior without a
// code change or redeploy) ──
// ENABLE_SUPERVISOR: adds an LLM classification step ahead of the
// deterministic keyword router for ambiguous free-text messages — see
// lib/supervisor.ts.
// ENABLE_CRITIC: adds a post-generation reflection/QA pass before a
// response reaches the user, with one automatic repair attempt — see
// lib/critic.ts. Trades live token-by-token streaming for a guarantee
// that nothing unreviewed ships (see callAgentStreamWithCritic in groq.ts).
export const ENABLE_SUPERVISOR = process.env.ENABLE_SUPERVISOR !== "false";
export const ENABLE_CRITIC = process.env.ENABLE_CRITIC !== "false";

// ── Hybrid RAG (BM25 + pgvector), opt-in ──
// OFF by default: with ENABLE_HYBRID_RAG unset/false the app behaves
// exactly as before (pure BM25), so enabling this can't affect an
// existing deploy until you deliberately turn it on, configure an
// embedding provider, and run the reindex (POST /api/admin/reindex).
// The vector table + pgvector extension are created lazily at reindex
// time via raw SQL (NOT a Prisma migration) precisely so a Postgres
// without pgvector can't break `prisma migrate deploy` — see
// lib/vectorStore.ts's header for the full rationale.
export const ENABLE_HYBRID_RAG = process.env.ENABLE_HYBRID_RAG === "true";

// Embedding provider — any OpenAI-compatible /v1/embeddings endpoint
// (Together AI, OpenAI, Voyage, a self-hosted TEI server, …). Left blank
// by default, which keeps the hybrid path inert even if the flag above is
// flipped on. Pick a MULTILINGUAL model — that cross-lingual recall
// (PT/ES/中文 query ↔ English source) is the main reason to use vectors
// here at all — and make sure EMBEDDING_DIM matches that model's output.
export const EMBEDDING_API_KEY = (process.env.EMBEDDING_API_KEY ?? "").trim();
export const EMBEDDING_BASE_URL = envOr(process.env.EMBEDDING_BASE_URL, "https://api.together.ai/v1/embeddings");
export const EMBEDDING_MODEL = envOr(process.env.EMBEDDING_MODEL, "");

// Positive-integer parse with a safe fallback — this value is inlined into
// the pgvector column DDL (`vector(N)`), so it must never be attacker- or
// typo-controlled into something non-numeric.
function envInt(value: string | undefined, fallback: number): number {
  const n = parseInt(String(value ?? ""), 10);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}
// Must equal the embedding model's output dimension. 1024 fits many
// popular multilingual models (e.g. bge-m3, multilingual-e5-large); change
// it to match yours BEFORE the first reindex (the table is created at this
// dimension and won't auto-migrate if you change it later).
export const EMBEDDING_DIM = envInt(process.env.EMBEDDING_DIM, 1024);

// Reciprocal Rank Fusion constant (standard default 60). Larger = flatter
// weighting across ranks; rarely needs changing.
export const RRF_K = envInt(process.env.RRF_K, 60);

// Shared secret guarding POST /api/admin/reindex. If unset, that route is
// disabled (returns 503) rather than running unauthenticated.
export const REINDEX_TOKEN = (process.env.REINDEX_TOKEN ?? "").trim();

// Used to sign session cookies (see lib/auth.ts). Set a real secret in prod.
export const SESSION_SECRET = envOr(process.env.SESSION_SECRET, "dev-only-insecure-secret-change-me");

// If this is left at a known placeholder in production, every session
// cookie is signed with a publicly-known key and is therefore forgeable
// (anyone can mint a valid "mentor" session). We warn loudly rather than
// crash on boot: crashing would take a running deployment down hard on a
// misconfigured redeploy, whereas a prominent, greppable log line lets ops
// fix it without an outage. Rotate with `openssl rand -base64 32`.
const INSECURE_SECRET_PLACEHOLDERS = new Set([
  "dev-only-insecure-secret-change-me",
  "change-me-to-a-real-random-secret",
]);
if (process.env.NODE_ENV === "production" && INSECURE_SECRET_PLACEHOLDERS.has(SESSION_SECRET)) {
  console.error(
    JSON.stringify({
      level: "error",
      message:
        "SECURITY: SESSION_SECRET is set to a known placeholder in production — session cookies are forgeable. Set a real random value (openssl rand -base64 32) and redeploy.",
      timestamp: new Date().toISOString(),
    })
  );
}

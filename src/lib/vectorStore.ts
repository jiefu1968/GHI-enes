/**
 * pgvector-backed vector store for the hybrid RAG path.
 *
 * DESIGN — deliberately additive and non-destructive:
 *   - The table and the `vector` extension are created LAZILY via raw SQL
 *     (CREATE ... IF NOT EXISTS), NOT via a Prisma migration. This is on
 *     purpose: if we shipped a migration that ran `CREATE EXTENSION vector`
 *     and the deployment's Postgres doesn't have pgvector available, then
 *     `prisma migrate deploy` would fail and take down the WHOLE deploy —
 *     even for someone who never wanted the hybrid feature. Creating it
 *     on demand means the worst case for a Postgres without pgvector is
 *     that reindex fails gracefully and retrieval silently uses pure BM25.
 *   - Every function is wrapped so a failure returns empty/false and logs,
 *     never throws to the caller. Same fail-open contract as embeddings.ts.
 *   - Nothing here executes unless ENABLE_HYBRID_RAG is on and embeddings
 *     are configured; rag.ts gates on that before calling in.
 *
 * The stored chunks are produced by the SAME chunker BM25 uses (see
 * rag.ts collectChunks / chunkId), so a chunk's identity (chunk_id =
 * content hash) is identical across both retrievers — which is what makes
 * Reciprocal Rank Fusion able to recognize the same chunk found by both.
 */

import { prisma } from "./db";
import { EMBEDDING_DIM } from "./env";
import { embedTexts } from "./embeddings";
import { collectChunks, chunkId, type Chunk } from "./rag";
import { MODULE_FOLDERS } from "./curriculumConfig";
import { logger } from "./logger";

const TABLE = "chunk_embeddings";

/** Serialize a JS number[] into the pgvector literal form: [0.1,0.2,...].
 * Values are validated as finite numbers, so this is safe to inline into
 * SQL (no injection surface — only digits, dot, minus, e, comma). */
function toVectorLiteral(vec: number[]): string {
  for (const n of vec) {
    if (!Number.isFinite(n)) throw new Error("non-finite value in embedding");
  }
  return `[${vec.join(",")}]`;
}

let schemaEnsured = false;

/** Create the extension + table + module index if they don't exist.
 * Idempotent; cached per-process after the first success. Returns false
 * (and logs) if pgvector is unavailable on this database. */
export async function ensureVectorSchema(): Promise<boolean> {
  if (schemaEnsured) return true;
  try {
    // EMBEDDING_DIM is validated to a positive integer in env.ts, so it is
    // safe to inline into the DDL (pgvector requires the dimension as a
    // literal — it cannot be a bind parameter).
    await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS vector`);
    await prisma.$executeRawUnsafe(
      `CREATE TABLE IF NOT EXISTS ${TABLE} (
         chunk_id  text PRIMARY KEY,
         module    integer NOT NULL,
         source    text NOT NULL,
         content   text NOT NULL,
         embedding vector(${EMBEDDING_DIM}) NOT NULL
       )`
    );
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS ${TABLE}_module_idx ON ${TABLE} (module)`
    );
    // No ANN (ivfflat/hnsw) index by default — brute-force cosine over a
    // few-thousand-row corpus is fast, and skipping it maximizes
    // compatibility across managed Postgres/pgvector versions. To add one
    // later on a larger corpus (pgvector >= 0.5):
    //   CREATE INDEX ON chunk_embeddings USING hnsw (embedding vector_cosine_ops);
    schemaEnsured = true;
    return true;
  } catch (e) {
    logger.error("ensureVectorSchema failed (pgvector unavailable?) — hybrid RAG will fall back to BM25", {
      error: String(e),
    });
    return false;
  }
}

/** Upsert a batch of already-embedded chunks. Called only by reindex. */
async function upsertEmbeddings(rows: Array<{ id: string; chunk: Chunk; vec: number[] }>): Promise<number> {
  let ok = 0;
  for (const { id, chunk, vec } of rows) {
    try {
      const lit = toVectorLiteral(vec);
      // chunk_id / source / content are parameterized ($1..$3); module and
      // the (validated-numeric) vector literal are inlined.
      await prisma.$executeRawUnsafe(
        `INSERT INTO ${TABLE} (chunk_id, module, source, content, embedding)
         VALUES ($1, ${chunk.module}, $2, $3, '${lit}'::vector)
         ON CONFLICT (chunk_id) DO UPDATE
           SET module = EXCLUDED.module,
               source = EXCLUDED.source,
               content = EXCLUDED.content,
               embedding = EXCLUDED.embedding`,
        id,
        chunk.source,
        chunk.text
      );
      ok++;
    } catch (e) {
      logger.warn("Embedding upsert failed for a chunk", { chunkId: id, error: String(e) });
    }
  }
  return ok;
}

const EMBED_BATCH = 64;

// Conservative word ceiling to stay under the embedding model's 512-token
// limit even for token-dense text (accented Portuguese/Spanish words,
// punctuation) — ~350 words keeps real margin rather than cutting it close.
const EMBED_MAX_WORDS = 150; // very conservative: Portuguese/Spanish accented text tokenizes denser than the ~1.3 tokens/word English estimate,
// and 350 still exceeded the model's 512-token limit in production

function truncateForEmbedding(text: string): string {
  const words = text.split(/\s+/);
  if (words.length <= EMBED_MAX_WORDS) return text;
  return words.slice(0, EMBED_MAX_WORDS).join(" ");
}

/**
 * (Re)build embeddings for the given modules (default: all). Reads the
 * same chunks BM25 uses, embeds them in batches, and upserts. Idempotent:
 * re-running only overwrites rows by chunk_id, and unchanged chunks
 * produce the same chunk_id + same content, so re-embedding is wasted work
 * but never corrupts anything. Returns a per-module count summary.
 */
export async function reindexModules(moduleNums?: number[]): Promise<{ ok: boolean; embedded: number; modules: number }> {
  if (!(await ensureVectorSchema())) return { ok: false, embedded: 0, modules: 0 };

  const mods = moduleNums && moduleNums.length > 0 ? moduleNums : Object.keys(MODULE_FOLDERS).map(Number);
  let totalEmbedded = 0;
  let modulesTouched = 0;

  for (const mod of mods) {
    const chunks = collectChunks(mod);
    if (chunks.length === 0) continue;
    modulesTouched++;

    for (let i = 0; i < chunks.length; i += EMBED_BATCH) {
      const batch = chunks.slice(i, i + EMBED_BATCH);
      // The embedding model's context window (512 tokens) is much smaller
      // than the ~400-word chunks sized for the main LLM's context — at
      // ~1.3 tokens/word that's already at or over the limit, and
      // Portuguese/Spanish accented text pushes it further. Truncate ONLY
      // the copy sent for embedding; chunk.text itself (used for BM25,
      // chunkId, and the actual LLM context injection) is untouched, so
      // this can't change what the user's answer is built from.
      const vecs = await embedTexts(batch.map((c) => truncateForEmbedding(c.text)));
      if (!vecs) {
        logger.error("Reindex aborted — embedding provider unavailable", { module: mod });
        return { ok: false, embedded: totalEmbedded, modules: modulesTouched };
      }
      const rows = batch.map((chunk, j) => ({ id: chunkId(chunk.module, chunk.text), chunk, vec: vecs[j]! }));
      totalEmbedded += await upsertEmbeddings(rows);
    }
  }

  logger.info("Reindex complete", { modules: modulesTouched, embedded: totalEmbedded });
  return { ok: true, embedded: totalEmbedded, modules: modulesTouched };
}

export interface VectorHit {
  id: string;
  chunk: Chunk;
  distance: number;
}

/**
 * Cosine-nearest chunks for a query embedding, restricted to the given
 * modules. Returns [] (never throws) on any error — including the table
 * not existing yet — so the caller degrades to BM25-only. `<=>` is
 * pgvector's cosine-distance operator (smaller = closer).
 */
export async function queryVector(
  queryEmbedding: number[],
  moduleNums: number[],
  topK: number
): Promise<VectorHit[]> {
  if (moduleNums.length === 0) return [];
  try {
    const lit = toVectorLiteral(queryEmbedding);
    const mods = moduleNums.filter((m) => Number.isInteger(m));
    if (mods.length === 0) return [];

    const rows = await prisma.$queryRawUnsafe<
      Array<{ chunk_id: string; module: number; source: string; content: string; distance: number }>
    >(
      `SELECT chunk_id, module, source, content, (embedding <=> '${lit}'::vector) AS distance
       FROM ${TABLE}
       WHERE module IN (${mods.join(",")})
       ORDER BY distance ASC
       LIMIT ${Math.max(1, Math.floor(topK))}`
    );

    return rows.map((r) => ({
      id: r.chunk_id,
      distance: Number(r.distance),
      chunk: { text: r.content, source: r.source, module: Number(r.module) },
    }));
  } catch (e) {
    logger.warn("Vector query failed, falling back to BM25 only", { error: String(e) });
    return [];
  }
}

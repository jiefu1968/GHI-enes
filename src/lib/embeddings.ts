/**
 * Embeddings client for the hybrid (BM25 + vector) RAG path.
 *
 * Same design philosophy as groq.ts: a plain `fetch` to an
 * OpenAI-compatible `/v1/embeddings` endpoint (so it works with Together
 * AI, OpenAI, Voyage, Cohere-compat, a self-hosted TEI server, etc.),
 * and FAIL-OPEN — every function returns null on any failure so the
 * caller (rag.ts) can silently fall back to pure BM25. Enabling the
 * hybrid path must never be able to break retrieval.
 *
 * Nothing here runs unless ENABLE_HYBRID_RAG is on AND an embedding
 * provider is configured (EMBEDDING_API_KEY + EMBEDDING_MODEL). With the
 * defaults (both unset) this module is inert.
 */

import {
  EMBEDDING_API_KEY,
  EMBEDDING_BASE_URL,
  EMBEDDING_MODEL,
  EMBEDDING_DIM,
} from "./env";
import { logger } from "./logger";

export function embeddingsConfigured(): boolean {
  return !!EMBEDDING_API_KEY && !!EMBEDDING_MODEL;
}

/**
 * Embed a batch of texts in one request. Returns an array of vectors
 * aligned to the input order, or null on any failure. Order alignment is
 * enforced explicitly via each item's `index` field rather than trusting
 * the provider to return them in request order.
 */
export async function embedTexts(texts: string[]): Promise<number[][] | null> {
  if (!embeddingsConfigured() || texts.length === 0) return null;
  try {
    const resp = await fetch(EMBEDDING_BASE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${EMBEDDING_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: EMBEDDING_MODEL, input: texts }),
      signal: AbortSignal.timeout(30000),
    });

    const data = await resp.json();
    if (!resp.ok) {
      logger.warn("Embedding request failed", { status: resp.status, error: data?.error?.message });
      return null;
    }

    const items: Array<{ embedding: number[]; index: number }> = data?.data ?? [];
    if (!Array.isArray(items) || items.length !== texts.length) {
      logger.warn("Embedding response shape unexpected", { got: items?.length, want: texts.length });
      return null;
    }

    const out: number[][] = new Array(texts.length);
    for (const it of items) {
      if (!Array.isArray(it.embedding)) return null;
      // Guard the configured dimension against the model's actual output:
      // a mismatch means the pgvector column (created at EMBEDDING_DIM)
      // would reject the insert, so bail to BM25 instead of erroring later.
      if (it.embedding.length !== EMBEDDING_DIM) {
        logger.error("Embedding dimension mismatch — check EMBEDDING_DIM vs EMBEDDING_MODEL", {
          modelDim: it.embedding.length,
          configuredDim: EMBEDDING_DIM,
        });
        return null;
      }
      out[it.index] = it.embedding;
    }
    return out;
  } catch (e) {
    logger.warn("Embedding call threw, falling back to BM25", { error: String(e) });
    return null;
  }
}

/** Embed a single query string. Returns null on any failure. */
export async function embedQuery(text: string): Promise<number[] | null> {
  const res = await embedTexts([text]);
  return res ? res[0]! : null;
}

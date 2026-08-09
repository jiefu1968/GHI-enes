/**
 * retrieveContext() — the single retrieval entry point the rest of the
 * app now calls (groq.ts, quiz.ts, caseStudies.ts).
 *
 * With ENABLE_HYBRID_RAG off (the default), this is byte-for-byte the old
 * behavior: it just delegates to rag.ts's pure-BM25 retrieveRelevantChunks.
 * With it on AND an embedding provider configured AND embeddings indexed,
 * it fuses BM25 (lexical — great at exact names, jargon, verse refs) with
 * pgvector cosine search (semantic + cross-lingual — great when the user's
 * PT/ES/中文 wording doesn't lexically overlap the English source) using
 * Reciprocal Rank Fusion.
 *
 * WHY RRF (and not a weighted score blend): BM25 scores and cosine
 * distances live on totally different, non-comparable scales, so blending
 * the raw numbers is meaningless. RRF ignores the magnitudes and fuses on
 * RANK alone — score(chunk) = Σ 1/(k + rank_in_that_list) — which is
 * robust, parameter-light (only k), and the standard hybrid-search fusion.
 *
 * FAIL-OPEN everywhere: if embeddings aren't configured, the vector query
 * returns nothing, or anything throws, it silently returns the pure-BM25
 * result. Enabling hybrid can never make retrieval worse than BM25 alone.
 */

import { ENABLE_HYBRID_RAG, RRF_K } from "./env";
import {
  retrieveRelevantChunks,
  bm25RankedChunks,
  assembleContext,
  chunkId,
  type Chunk,
  type RankedChunk,
} from "./rag";
import { embeddingsConfigured, embedQuery } from "./embeddings";
import { queryVector } from "./vectorStore";
import { logger } from "./logger";

/** Reciprocal Rank Fusion over any number of ranked lists. Rank is
 * 1-based (list[0] is rank 1). Ties broken by fused score desc. */
function fuseRRF(lists: RankedChunk[][], topK: number, k = RRF_K): Chunk[] {
  const score = new Map<string, number>();
  const chunkById = new Map<string, Chunk>();

  for (const list of lists) {
    list.forEach((item, i) => {
      const rank = i + 1;
      score.set(item.id, (score.get(item.id) ?? 0) + 1 / (k + rank));
      if (!chunkById.has(item.id)) chunkById.set(item.id, item.chunk);
    });
  }

  return [...score.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topK)
    .map(([id]) => chunkById.get(id)!)
    .filter(Boolean);
}

export async function retrieveContext(
  query: string,
  moduleNums: number[],
  topK = 6,
  maxChars = 6000
): Promise<string> {
  // Fast path / default: identical to the original pure-BM25 behavior.
  if (!ENABLE_HYBRID_RAG || !embeddingsConfigured()) {
    return retrieveRelevantChunks(query, moduleNums, topK, maxChars);
  }

  try {
    // Pull a wider pool from each retriever than we finally keep, so the
    // fusion has room to reward chunks both retrievers liked.
    const pool = topK * 2;
    const bm25 = bm25RankedChunks(query, moduleNums, pool);

    const qEmb = await embedQuery(query);
    const vecHits = qEmb ? await queryVector(qEmb, moduleNums, pool) : [];

    // No usable vector signal (provider down, nothing indexed yet, or an
    // error already logged downstream) → return the exact legacy output.
    if (vecHits.length === 0) {
      return retrieveRelevantChunks(query, moduleNums, topK, maxChars);
    }

    const vecRanked: RankedChunk[] = vecHits.map((v) => ({
      id: v.id || chunkId(v.chunk.module, v.chunk.text),
      chunk: v.chunk,
    }));

    const fused = fuseRRF([bm25, vecRanked], topK);
    if (fused.length === 0) {
      return retrieveRelevantChunks(query, moduleNums, topK, maxChars);
    }
    return assembleContext(fused, maxChars);
  } catch (e) {
    logger.warn("Hybrid retrieval failed, falling back to BM25", { error: String(e) });
    return retrieveRelevantChunks(query, moduleNums, topK, maxChars);
  }
}

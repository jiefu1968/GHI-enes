import { NextRequest, NextResponse } from "next/server";
import { ENABLE_HYBRID_RAG, REINDEX_TOKEN } from "@/lib/env";
import { embeddingsConfigured } from "@/lib/embeddings";
import { reindexModules } from "@/lib/vectorStore";
import { logger } from "@/lib/logger";

// Reads curriculum files (fs) + talks to Postgres — Node runtime only.
export const runtime = "nodejs";

// Embedding a whole corpus can take a while; give it room.
export const maxDuration = 300;

/**
 * POST /api/admin/reindex
 *   Header:  Authorization: Bearer <REINDEX_TOKEN>
 *   Body:    {} | { "modules": [12, 21, 29] }   (omit modules = all)
 *
 * (Re)builds pgvector embeddings for the hybrid RAG path. Run once after
 * enabling hybrid + configuring an embedding provider, and again whenever
 * curriculum .md files change. Idempotent — safe to re-run.
 *
 * Guarded by REINDEX_TOKEN: if that env var is unset the route refuses to
 * run (503) rather than exposing an unauthenticated, cost-incurring,
 * DB-writing operation.
 */
export async function POST(req: NextRequest) {
  if (!REINDEX_TOKEN) {
    return NextResponse.json(
      { error: "Reindex disabled: set REINDEX_TOKEN in the environment to enable this route." },
      { status: 503 }
    );
  }

  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (token !== REINDEX_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!ENABLE_HYBRID_RAG || !embeddingsConfigured()) {
    return NextResponse.json(
      {
        error:
          "Hybrid RAG is not fully configured. Set ENABLE_HYBRID_RAG=true, EMBEDDING_API_KEY, and EMBEDDING_MODEL (and confirm EMBEDDING_DIM matches the model), then retry.",
      },
      { status: 400 }
    );
  }

  const body = (await req.json().catch(() => ({}))) as { modules?: number[] };
  const modules = Array.isArray(body?.modules) ? body.modules.filter((n) => Number.isInteger(n)) : undefined;

  logger.info("Reindex requested", { modules: modules ?? "all" });
  const result = await reindexModules(modules);

  if (!result.ok) {
    return NextResponse.json(
      { ...result, error: "Reindex failed or aborted — check server logs (pgvector availability / embedding provider)." },
      { status: 500 }
    );
  }
  return NextResponse.json({ ...result });
}

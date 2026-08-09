/**
 * RAG layer — chunking + BM25 retrieval. Ported from harvest_rag.py.
 *
 * Design (unchanged from the Python original):
 *   1. Chunk each .md file into ~400-word overlapping windows.
 *   2. Build a per-module BM25 index, cached in memory after first build.
 *   3. At query time, retrieve only the top-k relevant chunks.
 *   4. Inject a few thousand chars of targeted context instead of dumping
 *      entire books into every prompt.
 *
 * Curriculum content lives under /content/books/<module_folder>/*.md in
 * this repo (bundled at deploy time — this was the "closest to current"
 * option vs. a vector DB, matching the original books/ folder approach).
 * This module reads with Node's fs, so every caller must run on the
 * Node.js runtime, not the Edge runtime.
 *
 * Cache invalidation: like the Python version, each cached index is keyed
 * by a signature (filename + mtime + size for every source file). If a
 * book is added/edited/removed on disk, the signature no longer matches
 * and the index rebuilds on the next query — no server restart needed
 * locally. Note: on most serverless platforms the filesystem is read-only
 * and immutable per-deployment, so in production this cache effectively
 * builds once per cold start and never needs to invalidate; it still
 * matters for local development against a live content folder.
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { MODULE_FOLDERS, MODULE_TITLES, MODULE_FALLBACK } from "./curriculumConfig";

export interface Chunk {
  text: string;
  source: string;
  module: number;
}

const BOOKS_DIR = path.join(process.cwd(), "content", "books");

export function chunkText(
  text: string,
  source: string,
  moduleNum: number,
  chunkSize = 400, // words
  overlap = 60 // words
): Chunk[] {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks: Chunk[] = [];
  let start = 0;
  while (start < words.length) {
    const end = Math.min(start + chunkSize, words.length);
    chunks.push({ text: words.slice(start, end).join(" "), source, module: moduleNum });
    if (end === words.length) break;
    start += chunkSize - overlap;
  }
  return chunks;
}

function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/\w+/g) ?? []) as string[];
}

/**
 * Pure-TS BM25 (Robertson & Zaragoza, 2009). No external dependencies.
 * k1=1.5, b=0.75 — same production defaults as the Python version.
 */
export class BM25Index {
  private docTokens: string[][];
  private docLen: number[];
  private avgdl: number;
  private idf: Map<string, number>;

  constructor(private chunks: Chunk[], private k1 = 1.5, private b = 0.75) {
    this.docTokens = chunks.map((c) => tokenize(c.text));
    this.docLen = this.docTokens.map((t) => t.length);
    this.avgdl = this.docLen.reduce((a, b2) => a + b2, 0) / Math.max(this.docLen.length, 1);

    const df = new Map<string, number>();
    for (const tokens of this.docTokens) {
      for (const term of new Set(tokens)) {
        df.set(term, (df.get(term) ?? 0) + 1);
      }
    }
    const N = this.chunks.length;
    this.idf = new Map();
    for (const [term, freq] of df) {
      this.idf.set(term, Math.log((N - freq + 0.5) / (freq + 0.5) + 1));
    }
  }

  query(text: string, topK = 6): Array<{ score: number; chunk: Chunk }> {
    const qTokens = tokenize(text);
    const scores: Array<{ score: number; idx: number }> = [];

    for (let idx = 0; idx < this.docTokens.length; idx++) {
      const dl = this.docLen[idx]!;
      const tfMap = new Map<string, number>();
      for (const t of this.docTokens[idx]!) tfMap.set(t, (tfMap.get(t) ?? 0) + 1);

      let score = 0;
      for (const term of qTokens) {
        const idf = this.idf.get(term);
        if (idf === undefined) continue;
        const tf = tfMap.get(term) ?? 0;
        const num = tf * (this.k1 + 1);
        const denom = tf + this.k1 * (1 - this.b + (this.b * dl) / this.avgdl);
        score += idf * (num / denom);
      }
      scores.push({ score, idx });
    }

    scores.sort((a, b2) => b2.score - a.score);
    return scores
      .slice(0, topK)
      .filter((s) => s.score > 0)
      .map((s) => ({ score: s.score, chunk: this.chunks[s.idx]! }));
  }

  /** The chunks this index was built from — used by the hybrid RAG path
   * (vectorStore reindex + BM25 ranked-list fusion) so both retrievers
   * operate over exactly the same chunk set. */
  getChunks(): Chunk[] {
    return this.chunks;
  }
}

// In-memory cache: module_num -> { signature, index }
interface CacheEntry {
  signature: string;
  index: BM25Index;
}
const INDEX_CACHE = new Map<number, CacheEntry>();

function realFilesForModule(moduleNum: number): string[] {
  const folderName = MODULE_FOLDERS[moduleNum];
  if (!folderName) return [];
  const folder = path.join(BOOKS_DIR, folderName);
  if (!fs.existsSync(folder)) return [];

  return fs
    .readdirSync(folder)
    .filter((f) => f.endsWith(".md"))
    .map((f) => path.join(folder, f))
    .filter((full) => {
      const name = path.basename(full);
      const size = fs.statSync(full).size;
      if (name === "README.md" && size < 400) return false;
      if (name === "placeholder.md" && size < 150) return false;
      return true;
    })
    .sort();
}

function folderSignature(files: string[]): string {
  return files
    .map((f) => {
      const st = fs.statSync(f);
      return `${path.basename(f)}:${st.mtimeMs}:${st.size}`;
    })
    .join("|");
}

function buildOrGetIndex(moduleNum: number): BM25Index | null {
  const files = realFilesForModule(moduleNum);
  const signature = folderSignature(files);

  const cached = INDEX_CACHE.get(moduleNum);
  if (cached && cached.signature === signature) return cached.index;

  let allChunks: Chunk[] = [];
  for (const f of files) {
    try {
      const text = fs.readFileSync(f, "utf-8");
      allChunks = allChunks.concat(chunkText(text, path.basename(f), moduleNum));
    } catch (e) {
      console.warn(`  ⚠️  Could not read ${f}:`, e);
    }
  }

  if (allChunks.length === 0) {
    const fallback = MODULE_FALLBACK[moduleNum];
    if (fallback) {
      allChunks = chunkText(fallback, "built-in-fallback", moduleNum);
    }
  }

  if (allChunks.length === 0) return null;

  const index = new BM25Index(allChunks);
  INDEX_CACHE.set(moduleNum, { signature, index });

  const title = MODULE_TITLES[moduleNum] ?? `Module ${moduleNum}`;
  console.log(`  🔍 BM25 index built — Module ${moduleNum}: ${allChunks.length} chunks (${title})`);
  return index;
}

export function retrieveRelevantChunks(
  query: string,
  moduleNums: number[],
  topK = 6,
  maxChars = 6000
): string {
  const allScored: Array<{ score: number; chunk: Chunk }> = [];

  for (const modNum of moduleNums) {
    const index = buildOrGetIndex(modNum);
    if (!index) continue;
    allScored.push(...index.query(query, topK * 2));
  }

  if (allScored.length === 0) return "";

  allScored.sort((a, b) => b.score - a.score);
  const seen = new Set<string>();
  const topChunks: Chunk[] = [];
  for (const { chunk } of allScored) {
    const key = chunk.text.slice(0, 80);
    if (!seen.has(key)) {
      seen.add(key);
      topChunks.push(chunk);
    }
    if (topChunks.length >= topK) break;
  }

  const parts: string[] = [];
  let total = 0;
  for (const chunk of topChunks) {
    const modTitle = MODULE_TITLES[chunk.module] ?? `Module ${chunk.module}`;
    const entry = `[${chunk.source} | ${modTitle}]\n${chunk.text}`;
    total += entry.length;
    if (total > maxChars) break;
    parts.push(entry);
  }

  return parts.join("\n\n---\n\n");
}

export function loadAllBooksSummary(): string {
  const lines: string[] = [];
  for (const [numStr, folderName] of Object.entries(MODULE_FOLDERS)) {
    const modNum = Number(numStr);
    const title = MODULE_TITLES[modNum] ?? folderName;
    const folder = path.join(BOOKS_DIR, folderName);
    let mdCount = 0;
    if (fs.existsSync(folder)) {
      mdCount = fs.readdirSync(folder).filter((f) => f.endsWith(".md") && f !== "README.md").length;
    }
    const status = mdCount > 0 ? `${mdCount} file(s)` : "built-in content";
    lines.push(`• Module ${modNum}: ${title} [${status}]`);
  }
  return lines.join("\n");
}

// ─────────────────────────────────────────────
// HYBRID-RAG SUPPORT (used by lib/retrieval.ts and lib/vectorStore.ts)
//
// These are additive helpers. Pure-BM25 callers (retrieveRelevantChunks
// above) are untouched; the hybrid path composes with them.
// ─────────────────────────────────────────────

export interface RankedChunk {
  id: string;
  chunk: Chunk;
}

/** Stable content-addressed id for a chunk. BM25 (in-memory) and the
 * vector store (Postgres) both compute this from the SAME chunk text, so
 * a chunk found by both retrievers has one identical id — the join key
 * Reciprocal Rank Fusion relies on. */
export function chunkId(moduleNum: number, text: string): string {
  return crypto.createHash("sha1").update(`${moduleNum}:${text}`).digest("hex").slice(0, 16);
}

/** All chunks for a module (same set BM25 indexes). Reuses the cached
 * index build, so this is cheap after the first call per module. */
export function collectChunks(moduleNum: number): Chunk[] {
  const idx = buildOrGetIndex(moduleNum);
  return idx ? idx.getChunks() : [];
}

/** BM25 results across modules as a de-duplicated ranked list (rank =
 * array order). Mirrors retrieveRelevantChunks' gathering/merging so the
 * BM25 half of the fusion matches the legacy behavior. */
export function bm25RankedChunks(query: string, moduleNums: number[], poolK: number): RankedChunk[] {
  const allScored: Array<{ score: number; chunk: Chunk }> = [];
  for (const modNum of moduleNums) {
    const index = buildOrGetIndex(modNum);
    if (!index) continue;
    allScored.push(...index.query(query, poolK));
  }
  allScored.sort((a, b) => b.score - a.score);

  const seen = new Set<string>();
  const out: RankedChunk[] = [];
  for (const { chunk } of allScored) {
    const id = chunkId(chunk.module, chunk.text);
    if (seen.has(id)) continue;
    seen.add(id);
    out.push({ id, chunk });
    if (out.length >= poolK) break;
  }
  return out;
}

/** Format a final ordered chunk list into the context string, using the
 * exact layout and char-cap behavior of retrieveRelevantChunks so the
 * hybrid output is drop-in compatible with the pure-BM25 output. */
export function assembleContext(chunks: Chunk[], maxChars = 6000): string {
  const parts: string[] = [];
  let total = 0;
  for (const chunk of chunks) {
    const modTitle = MODULE_TITLES[chunk.module] ?? `Module ${chunk.module}`;
    const entry = `[${chunk.source} | ${modTitle}]\n${chunk.text}`;
    total += entry.length;
    if (total > maxChars) break;
    parts.push(entry);
  }
  return parts.join("\n\n---\n\n");
}

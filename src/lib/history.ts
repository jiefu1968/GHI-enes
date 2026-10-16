// History of generated quizzes and case studies, kept IN THIS BROWSER (localStorage).
// Nothing here touches the server or the database: it is per device, and the mentor
// does not see it. Newest first, capped, and tolerant of full or blocked storage.

export type HistoryKind = "quiz" | "case";

export interface HistorySummary {
  correct: number;
  revealed: number;
  total: number;
}

export interface HistoryEntry {
  id: string;
  kind: HistoryKind;
  module: number;
  lang: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  summary?: HistorySummary;
  data: unknown;
}

export type HistoryInput = Omit<HistoryEntry, "createdAt" | "updatedAt">;

const MAX_ENTRIES = 15;

function keyFor(kind: HistoryKind, userKey: string): string {
  return `ghi_history_v1:${kind}:${userKey}`;
}

function isEntry(x: unknown): x is HistoryEntry {
  const e = x as Partial<HistoryEntry> | null;
  return (
    !!e &&
    typeof e.id === "string" &&
    (e.kind === "quiz" || e.kind === "case") &&
    typeof e.updatedAt === "number" &&
    typeof e.module === "number" &&
    "data" in e
  );
}

export function newHistoryId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function loadHistory(kind: HistoryKind, userKey: string): HistoryEntry[] {
  try {
    const raw = window.localStorage.getItem(keyFor(kind, userKey));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isEntry).sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

function write(kind: HistoryKind, userKey: string, list: HistoryEntry[]): void {
  let out = list;
  for (;;) {
    try {
      window.localStorage.setItem(keyFor(kind, userKey), JSON.stringify(out));
      return;
    } catch {
      // Storage full (or blocked): drop the oldest entry and try again.
      if (out.length <= 1) return;
      out = out.slice(0, -1);
    }
  }
}

// Insert or update by id. The entry being worked on moves to the top.
export function saveHistoryEntry(kind: HistoryKind, userKey: string, input: HistoryInput): void {
  const list = loadHistory(kind, userKey);
  const previous = list.find((e) => e.id === input.id);
  const now = Date.now();
  const entry: HistoryEntry = { ...input, createdAt: previous?.createdAt ?? now, updatedAt: now };
  write(kind, userKey, [entry, ...list.filter((e) => e.id !== input.id)].slice(0, MAX_ENTRIES));
}

export function removeHistoryEntry(kind: HistoryKind, userKey: string, id: string): void {
  write(
    kind,
    userKey,
    loadHistory(kind, userKey).filter((e) => e.id !== id)
  );
}

export function clearHistory(kind: HistoryKind, userKey: string): void {
  try {
    window.localStorage.removeItem(keyFor(kind, userKey));
  } catch {
    /* ignore */
  }
}

"use client";

import { useState } from "react";
import clsx from "clsx";
import { clearHistory, loadHistory, removeHistoryEntry } from "@/lib/history";
import type { HistoryEntry, HistoryKind, HistorySummary } from "@/lib/history";

// List of previously generated quizzes / case studies saved in this browser.
// All text comes from the caller, so this file has no language of its own.

export interface HistoryLabels {
  title: string;
  note: string;
  empty: string;
  open: string;
  remove: string;
  clearAll: string;
  confirmClear: string;
  close: string;
  current: string;
  summary: (s: HistorySummary) => string;
}

function when(ts: number): string {
  try {
    return new Date(ts).toLocaleString([], { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export default function HistoryPanel({
  kind,
  userKey,
  labels,
  moduleName,
  currentId,
  onOpen,
  onClose,
}: {
  kind: HistoryKind;
  userKey: string;
  labels: HistoryLabels;
  moduleName: (n: number) => string;
  currentId: string;
  onOpen: (entry: HistoryEntry) => void;
  onClose: () => void;
}) {
  const [entries, setEntries] = useState<HistoryEntry[]>(() => loadHistory(kind, userKey));

  function remove(id: string) {
    removeHistoryEntry(kind, userKey, id);
    setEntries(loadHistory(kind, userKey));
  }
  function clearAll() {
    if (!window.confirm(labels.confirmClear)) return;
    clearHistory(kind, userKey);
    setEntries([]);
  }

  return (
    <section className="mb-4 rounded-2xl border border-harvest-border bg-harvest-panel p-4 shadow-sm" aria-label={labels.title}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-serif text-sm font-semibold text-harvest-text">🕘 {labels.title}</h3>
          <p className="text-[11px] text-harvest-textDim">{labels.note}</p>
        </div>
        <div className="flex items-center gap-3">
          {entries.length > 0 && (
            <button onClick={clearAll} className="text-xs font-semibold text-red-600 hover:underline">
              {labels.clearAll}
            </button>
          )}
          <button onClick={onClose} className="text-xs font-semibold text-harvest-goldDeep hover:underline">
            {labels.close}
          </button>
        </div>
      </div>

      {entries.length === 0 ? (
        <p className="rounded-xl bg-harvest-panel2 px-3 py-4 text-center text-xs text-harvest-textDim">{labels.empty}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {entries.map((e) => (
            <li
              key={e.id}
              className={clsx(
                "flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2",
                e.id === currentId ? "border-harvest-gold/50 bg-harvest-gold/5" : "border-harvest-border bg-harvest-panel2"
              )}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-harvest-text">{e.title || moduleName(e.module)}</p>
                <p className="truncate text-[11px] text-harvest-textDim">
                  {moduleName(e.module)} · {when(e.updatedAt)}
                  {e.summary ? ` · ${labels.summary(e.summary)}` : ""}
                  {e.id === currentId ? ` · ${labels.current}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpen(e)}
                  className="rounded-full bg-harvest-gold px-3 py-1 text-xs font-semibold text-white transition hover:bg-harvest-goldDeep"
                >
                  {labels.open}
                </button>
                <button
                  onClick={() => remove(e.id)}
                  className="rounded-full border border-harvest-border px-3 py-1 text-xs text-harvest-textDim transition hover:border-red-300 hover:text-red-600"
                >
                  {labels.remove}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

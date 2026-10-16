"use client";

import { useCallback, useEffect, useState } from "react";
import clsx from "clsx";

// Shared building blocks for the "one question per screen" mode used by the
// Quiz and the Initial Assessment: a progress bar, a numbered dot navigator
// (one dot per question, coloured by state) and a small "one at a time / all"
// switch. All user-facing text is passed in by the caller, so this file has
// no language of its own and is identical in every deployment.

export type DotStatus = "empty" | "answered" | "missing" | "correct" | "wrong";

const DOT_CLASS: Record<DotStatus, string> = {
  empty: "border-harvest-border bg-harvest-panel2 text-harvest-textDim hover:border-harvest-gold/50",
  answered: "border-harvest-gold/40 bg-harvest-gold/15 text-harvest-goldDeep hover:bg-harvest-gold/25",
  missing: "border-amber-400 bg-amber-50 text-amber-700 hover:bg-amber-100",
  correct: "border-green-300 bg-green-100 text-green-800",
  wrong: "border-red-300 bg-red-100 text-red-700",
};

export function ProgressBar({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs text-harvest-textDim">
        <span>{label}</span>
        <span className="font-semibold text-harvest-goldDeep">{pct}%</span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-harvest-panel2"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div className="h-full rounded-full bg-harvest-gold transition-all duration-300" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export interface DotItem {
  status: DotStatus;
  label: string;
  title?: string;
}

export function DotNav({
  items,
  current,
  onJump,
}: {
  items: DotItem[];
  current: number;
  onJump: (index: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((it, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onJump(i)}
          title={it.title ?? it.label}
          aria-label={it.title ?? it.label}
          aria-current={i === current ? "step" : undefined}
          className={clsx(
            "flex h-7 min-w-[1.75rem] items-center justify-center rounded-full border px-1 text-[11px] font-semibold transition",
            DOT_CLASS[it.status],
            i === current && "ring-2 ring-harvest-gold ring-offset-1"
          )}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}

export type ViewMode = "one" | "all";

export function ViewToggle({
  mode,
  onChange,
  oneLabel,
  allLabel,
}: {
  mode: ViewMode;
  onChange: (m: ViewMode) => void;
  oneLabel: string;
  allLabel: string;
}) {
  const options: Array<[ViewMode, string]> = [
    ["one", oneLabel],
    ["all", allLabel],
  ];
  return (
    <div className="inline-flex rounded-full border border-harvest-border bg-harvest-panel2 p-0.5 text-[11px] font-semibold">
      {options.map(([m, label]) => (
        <button
          key={m}
          type="button"
          onClick={() => onChange(m)}
          className={clsx(
            "rounded-full px-3 py-1 transition",
            mode === m ? "bg-harvest-gold text-white" : "text-harvest-textDim hover:text-harvest-text"
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// One preference shared by Quiz and Assessment, remembered in this browser.
// Defaults to "one at a time" — the focused layout people asked for.
const VIEW_KEY = "ghi_view_mode_v1";
export function useViewMode(): [ViewMode, (m: ViewMode) => void] {
  const [mode, setMode] = useState<ViewMode>("one");
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(VIEW_KEY);
      if (saved === "one" || saved === "all") setMode(saved);
    } catch {
      /* storage unavailable — keep the default */
    }
  }, []);
  const update = useCallback((m: ViewMode) => {
    setMode(m);
    try {
      window.localStorage.setItem(VIEW_KEY, m);
    } catch {
      /* non-fatal */
    }
  }, []);
  return [mode, update];
}

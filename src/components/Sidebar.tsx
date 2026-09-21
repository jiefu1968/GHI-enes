"use client";

import { useState, useEffect, memo } from "react";
import clsx from "clsx";
import { AGENT_META } from "@/lib/agentsMeta";
import { MODULE_NAMES } from "@/lib/curriculumConfigClient";
// (onQuickStart is still accepted as a prop — ChatApp.tsx passes it down
// for the welcome-screen cards in MessageList.tsx, which is the richer,
// per-specialist-explanation version of this feature. The compact
// sidebar "Quick start" list was removed as redundant with that.)
import { MODULE_GROUPS } from "@/lib/moduleGroups";

interface Props {
  activeAgent: string;
  selectedModule: number | null;
  onSelectAgent: (key: string) => void;
  onSelectModule: (mod: number | null) => void;
  selectedGroupId: string | null;
  onSelectGroup: (groupId: string, moduleNums: number[]) => void;
  onQuickStart: (label: string) => void;
  missionaryName: string | null;
  onIdentify: (name: string) => void;
  view: "chat" | "quiz" | "case" | "assessment";
  onChangeView: (v: "chat" | "quiz" | "case" | "assessment") => void;
}

// memo() here is only effective because ChatApp now passes stable
// (useCallback-wrapped) function references for onQuickStart and
// onIdentify — see ChatApp.tsx's comment on `send` for the full
// reasoning. Without both halves of this fix, memo() alone would not
// have stopped the re-render, since a "new" inline arrow function
// prop looks identical in effect to any other changed prop.
function Sidebar({
  activeAgent,
  selectedModule,
  onSelectAgent,
  onSelectModule,
  selectedGroupId,
  onSelectGroup,
  onQuickStart,
  missionaryName,
  onIdentify,
  view,
  onChangeView,
}: Props) {
  const [nameInput, setNameInput] = useState("");
  const [fieldInput, setFieldInput] = useState("");
  const [fieldContext, setFieldContextState] = useState<string | null>(null);
  const [recommended, setRecommended] = useState<number[]>([]);
  const [showFieldForm, setShowFieldForm] = useState(false);
  const moduleNums = Object.keys(MODULE_NAMES).map(Number).sort((a, b) => a - b);

  // Recommendations are purely a client-side sort/highlight hint (see
  // lib/recommendations.ts) — fetched once identity is set, refetched
  // after the missionary saves a new field context.
  useEffect(() => {
    if (!missionaryName) return;
    fetch("/api/session/field-context")
      .then((r) => r.json())
      .then((data) => {
        setFieldContextState(data.fieldContext ?? null);
        setRecommended((data.recommendations ?? []).map((r: { module: number }) => r.module));
      })
      .catch(() => {});
  }, [missionaryName]);

  async function saveFieldContext() {
    if (!fieldInput.trim()) return;
    const res = await fetch("/api/session/field-context", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fieldContext: fieldInput.trim() }),
    });
    const data = await res.json();
    if (data.ok) {
      setFieldContextState(data.fieldContext);
      setRecommended((data.recommendations ?? []).map((r: { module: number }) => r.module));
      setShowFieldForm(false);
    }
  }

  return (
    <aside className="flex h-full w-80 shrink-0 flex-col overflow-y-auto border-r border-harvest-border bg-harvest-panel">
      <div className="border-b border-harvest-border p-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🌾</span>
          <div>
            <p className="font-serif text-sm leading-tight text-harvest-gold">Global Harvest</p>
            <p className="text-xs leading-tight text-harvest-textDim">Global Harvest Initiative</p>
          </div>
        </div>
      </div>

      {/* View tabs */}
      <div className="flex flex-wrap gap-1 border-b border-harvest-border p-2">
        {(
          [
            ["chat", "💬 Chat"],
            ["quiz", "📝 Quiz/Prueba"],
            ["case", "📚 Case/Caso"],
            ["assessment", "🎯 Assessment/Diagnóstico"],
          ] as const
        ).map(([v, label]) => (
          <button
            key={v}
            onClick={() => onChangeView(v)}
            className={clsx(
              "flex-1 rounded-md px-2 py-1.5 text-xs font-semibold transition",
              view === v ? "bg-harvest-goldDeep text-harvest-bg" : "text-harvest-textDim hover:bg-harvest-panel2"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Missionary identity */}
      <div className="border-b border-harvest-border p-3">
        {missionaryName ? (
          <p className="text-xs text-harvest-textDim">
            Tracked for mentor as <span className="text-harvest-gold">{missionaryName}</span>
          </p>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (nameInput.trim()) onIdentify(nameInput.trim());
            }}
            className="flex gap-1"
          >
            <input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Your name, for your mentor · Tu nombre, para tu mentor"
              className="min-w-0 flex-1 rounded-md border border-white/10 bg-harvest-panel2 px-2 py-1 text-xs outline-none focus:border-harvest-gold"
            />
            <button
              type="submit"
              className="rounded-md bg-harvest-goldDeep px-2 py-1 text-xs font-semibold text-harvest-bg"
            >
              Definir
            </button>
          </form>
        )}

        {/* Field context — purely reorders which modules are suggested
            first; never sent to the AI as an instruction (see
            lib/recommendations.ts). Only available once identified,
            since it's stored on the missionary's row. */}
        {missionaryName && (
          <div className="mt-2">
            {fieldContext && !showFieldForm ? (
              <button
                onClick={() => {
                  setFieldInput(fieldContext);
                  setShowFieldForm(true);
                }}
                className="text-left text-[11px] text-harvest-textDim hover:text-harvest-gold"
                title="Click to edit"
              >
                📍 Serving: <span className="text-harvest-text">{fieldContext}</span> (edit)
              </button>
            ) : showFieldForm || !fieldContext ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  saveFieldContext();
                }}
                className="flex gap-1"
              >
                <input
                  value={fieldInput}
                  onChange={(e) => setFieldInput(e.target.value)}
                  placeholder="Where are you serving? (optional)"
                  className="min-w-0 flex-1 rounded-md border border-white/10 bg-harvest-panel2 px-2 py-1 text-[11px] outline-none focus:border-harvest-gold"
                />
                <button
                  type="submit"
                  className="rounded-md border border-harvest-goldDeep/50 px-2 py-1 text-[11px] text-harvest-gold"
                >
                  Save
                </button>
              </form>
            ) : null}
          </div>
        )}
      </div>

      {/* Orchestrator */}
      <div className="p-3">
        <button
          onClick={() => {
            onSelectAgent("orchestrator");
            onSelectModule(null);
          }}
          className={clsx(
            "mb-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition",
            activeAgent === "orchestrator" && !selectedModule
              ? "bg-harvest-goldDeep/20 text-harvest-gold ring-1 ring-harvest-goldDeep/50"
              : "text-harvest-text hover:bg-harvest-panel2"
          )}
        >
          <span>{AGENT_META.orchestrator?.emoji ?? "🌾"}</span>
          <span className="truncate">{AGENT_META.orchestrator?.name ?? "Coordinator"}</span>
        </button>

        <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-harvest-textDim">
          {moduleNums.length} Módulos
        </p>

        {/* Recommended for you — a reordering hint only (see
            lib/recommendations.ts); the full list below is always shown
            in full underneath, nothing is ever hidden. */}
        {recommended.length > 0 && (
          <div className="mb-3">
            <p className="mb-1 px-1 text-[11px] font-semibold uppercase tracking-wide text-harvest-gold">
              📍 Recommended for you · Recomendado para ti
            </p>
            <div className="flex flex-col gap-1">
              {recommended.map((num) => {
                const key = `mod_${String(num).padStart(2, "0")}`;
                const meta = AGENT_META[key];
                const [nameEn] = (MODULE_NAMES[num] ?? "").split(" | ");
                return (
                  <button
                    key={`rec-${num}`}
                    title={MODULE_NAMES[num]}
                    onClick={() => {
                      onSelectModule(num);
                      onSelectAgent(key);
                    }}
                    className="flex items-center gap-2 rounded-lg border border-harvest-goldDeep/30 bg-harvest-goldDeep/10 px-3 py-1.5 text-left text-xs text-harvest-gold transition hover:bg-harvest-goldDeep/20"
                  >
                    <span>{meta?.emoji ?? "📘"}</span>
                    <span className="truncate">{num}. {nameEn}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {MODULE_GROUPS.map((group) => {
            const isGroupActive = selectedGroupId === group.id;
            const [labelPt, labelEs] = group.label.split(" | ");
            const [descPt] = group.description.split(" | ");
            return (
              <div key={group.id}>
                <button
                  onClick={() => onSelectGroup(group.id, group.moduleNums)}
                  title={descPt}
                  className={clsx(
                    "mb-1.5 flex w-full flex-col rounded-lg px-2 py-1.5 text-left transition",
                    isGroupActive
                      ? "bg-harvest-goldDeep/15 ring-1 ring-harvest-goldDeep/50"
                      : "hover:bg-harvest-panel2"
                  )}
                >
                  <span
                    className={clsx(
                      "text-[11px] font-bold uppercase tracking-wide",
                      isGroupActive ? "text-harvest-gold" : "text-harvest-textDim"
                    )}
                  >
                    {labelPt}
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wide opacity-70">{labelEs}</span>
                  <span className="text-[10px] text-harvest-textDim">
                    {group.moduleNums.length} especialistas
                    {isGroupActive && " · restricted to this group · restringido a este grupo"}
                  </span>
                </button>

                <div className="flex flex-col gap-1">
                  {group.moduleNums.map((num) => {
                    const key = `mod_${String(num).padStart(2, "0")}`;
                    const meta = AGENT_META[key];
                    const isActive = selectedModule === num;
                    // MODULE_NAMES entries are bilingual, formatted as
                    // "English | Español" — split into both so each can
                    // be shown, one under the other.
                    const [namePt, nameEs] = (MODULE_NAMES[num] ?? "").split(" | ");
                    return (
                      <button
                        key={num}
                        onClick={() => {
                          onSelectModule(num);
                          onSelectAgent(key);
                        }}
                        className={clsx(
                          "flex items-start gap-2 rounded-lg px-3 py-1.5 text-left text-xs transition",
                          isActive
                            ? "bg-harvest-goldDeep/20 text-harvest-gold ring-1 ring-harvest-goldDeep/50"
                            : "text-harvest-textDim hover:bg-harvest-panel2 hover:text-harvest-text"
                        )}
                        title={MODULE_NAMES[num]}
                      >
                        <span className="mt-0.5">{meta?.emoji ?? "📘"}</span>
                        <span className="flex min-w-0 flex-col">
                          <span>{num}. {namePt}</span>
                          {nameEs && <span className="text-[11px] opacity-70">{nameEs}</span>}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

export default memo(Sidebar);


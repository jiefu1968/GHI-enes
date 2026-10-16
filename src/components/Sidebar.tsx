"use client";

import { useState, useEffect, memo } from "react";
import clsx from "clsx";
import { AGENT_META } from "@/lib/agentsMeta";
import { MODULE_NAMES } from "@/lib/curriculumConfigClient";
// (onQuickStart is still accepted as a prop — ChatApp.tsx passes it down
// for the welcome-screen cards in MessageList.tsx, which is the richer,
// per-specialist-explanation version of this feature.)
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

// memo() here is only effective because ChatApp passes stable
// (useCallback-wrapped) function references.
//
// VISUAL NOTE: this sidebar is the one intentionally dark surface in
// the app's otherwise light "SaaS Moderno" theme — it uses the dedicated
// harvest-sidebar* tokens from tailwind.config.ts.
//
// BEHAVIOUR NOTE: the specialist list is only "live" in Chat mode.
//  • Quiz / Case: clicking a module pre-selects it in that tab's module menu
//    (the panels follow `selectedModule`), and a hint says so.
//  • Assessment: the list is hidden — nothing in it applies there, and a
//    list that silently ignores clicks looked like a broken app.
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
    <aside className="flex h-full w-80 shrink-0 flex-col overflow-y-auto bg-harvest-sidebar">
      <div className="border-b border-harvest-sidebarBorder p-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-harvest-gold">
            <span className="font-serif text-xs font-bold tracking-tight text-white">GHI</span>
          </div>
          <div>
            <p className="font-serif text-sm font-semibold leading-tight text-harvest-sidebarText">Global Harvest</p>
            <p className="text-[11px] leading-tight text-harvest-sidebarTextDim">Global Harvest Initiative</p>
          </div>
        </div>
      </div>

      {/* View tabs */}
      <div className="flex flex-wrap gap-1 border-b border-harvest-sidebarBorder p-2">
        {(
          [
            ["chat", "💬 Chat"],
            ["quiz", "📝 Quiz/Prueba"],
            ["case", "📚 Case/Caso"],
            ["assessment", "🎯 Assessment"],
          ] as const
        ).map(([v, label]) => (
          <button
            key={v}
            onClick={() => onChangeView(v)}
            className={clsx(
              "flex-1 rounded-md px-2 py-1.5 text-xs font-semibold transition",
              view === v
                ? "bg-harvest-gold text-white"
                : "text-harvest-sidebarTextDim hover:bg-harvest-sidebarPanel hover:text-harvest-sidebarText"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Missionary identity */}
      <div className="border-b border-harvest-sidebarBorder p-3">
        {missionaryName ? (
          <p className="text-xs text-harvest-sidebarTextDim">
            Tracked for mentor as <span className="font-medium text-harvest-sidebarActiveText">{missionaryName}</span>
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
              className="min-w-0 flex-1 rounded-md border border-harvest-sidebarBorder bg-harvest-sidebarPanel px-2 py-1 text-xs text-harvest-sidebarText placeholder:text-harvest-sidebarTextDim outline-none focus:border-harvest-gold"
            />
            <button
              type="submit"
              className="rounded-md bg-harvest-gold px-2 py-1 text-xs font-semibold text-white"
            >
              Set
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
                className="text-left text-[11px] text-harvest-sidebarTextDim hover:text-harvest-sidebarActiveText"
                title="Click to edit"
              >
                📍 Serving: <span className="text-harvest-sidebarText">{fieldContext}</span> (edit)
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
                  className="min-w-0 flex-1 rounded-md border border-harvest-sidebarBorder bg-harvest-sidebarPanel px-2 py-1 text-[11px] text-harvest-sidebarText placeholder:text-harvest-sidebarTextDim outline-none focus:border-harvest-gold"
                />
                <button
                  type="submit"
                  className="rounded-md border border-harvest-gold/50 px-2 py-1 text-[11px] text-harvest-sidebarActiveText"
                >
                  Save
                </button>
              </form>
            ) : null}
          </div>
        )}
      </div>

      <div className="p-3">
        {view === "assessment" ? (
          <div className="rounded-xl border border-harvest-sidebarBorder bg-harvest-sidebarPanel p-3 text-xs leading-relaxed text-harvest-sidebarTextDim">
            <p>Specialists are available in Chat mode. Finish your assessment first, then pick a specialist in Chat.</p>
            <p className="mt-1 opacity-80">
              Los especialistas están disponibles en el modo Chat. Termina primero tu evaluación y luego elige un
              especialista en Chat.
            </p>
            <button
              onClick={() => onChangeView("chat")}
              className="mt-3 rounded-full bg-harvest-gold px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-harvest-goldDeep"
            >
              💬 Go to Chat · Ir al Chat
            </button>
          </div>
        ) : (
          <>
            {/* Orchestrator — only meaningful for free chat */}
            {view === "chat" && (
              <button
                onClick={() => {
                  onSelectAgent("orchestrator");
                  onSelectModule(null);
                }}
                className={clsx(
                  "mb-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition",
                  activeAgent === "orchestrator" && !selectedModule
                    ? "bg-harvest-sidebarActive text-harvest-sidebarActiveText"
                    : "text-harvest-sidebarText hover:bg-harvest-sidebarPanel"
                )}
              >
                <span>{AGENT_META.orchestrator?.emoji ?? "🌾"}</span>
                <span className="truncate">{AGENT_META.orchestrator?.name ?? "Coordinator"}</span>
              </button>
            )}

            {(view === "quiz" || view === "case") && (
              <div className="mb-3 rounded-lg bg-harvest-sidebarPanel px-3 py-2 text-[11px] leading-snug text-harvest-sidebarTextDim">
                <p>👉 Pick a module below to use it for your {view === "quiz" ? "quiz" : "case study"}.</p>
                <p className="opacity-80">
                  Elige un módulo abajo para usarlo en tu {view === "quiz" ? "prueba" : "estudio de caso"}.
                </p>
              </div>
            )}

            <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-harvest-sidebarTextDim">
              {moduleNums.length} Modules
            </p>

            {/* Recommended for you — a reordering hint only (see
                lib/recommendations.ts); the full list below is always shown
                in full underneath, nothing is ever hidden. */}
            {recommended.length > 0 && (
              <div className="mb-3">
                <p className="mb-1 px-1 text-[11px] font-semibold uppercase tracking-wide text-harvest-sidebarActiveText">
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
                        className="flex items-center gap-2 rounded-lg bg-harvest-sidebarActive px-3 py-1.5 text-left text-xs text-harvest-sidebarActiveText transition hover:bg-harvest-gold/20"
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
                const isGroupActive = view === "chat" && selectedGroupId === group.id;
                const [labelPt, labelEs] = group.label.split(" | ");
                const [descPt] = group.description.split(" | ");
                return (
                  <div key={group.id}>
                    {/* Group scoping only means something in Chat. */}
                    <button
                      onClick={() => onSelectGroup(group.id, group.moduleNums)}
                      disabled={view !== "chat"}
                      title={descPt}
                      className={clsx(
                        "mb-1.5 flex w-full flex-col rounded-lg px-2 py-1.5 text-left transition disabled:cursor-default",
                        isGroupActive ? "bg-harvest-sidebarActive" : view === "chat" ? "hover:bg-harvest-sidebarPanel" : ""
                      )}
                    >
                      <span
                        className={clsx(
                          "text-[11px] font-bold uppercase tracking-wide",
                          isGroupActive ? "text-harvest-sidebarActiveText" : "text-harvest-sidebarTextDim"
                        )}
                      >
                        {labelPt}
                      </span>
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-harvest-sidebarTextDim opacity-70">{labelEs}</span>
                      <span className="text-[10px] text-harvest-sidebarTextDim">
                        {group.moduleNums.length} specialists
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
                                ? "bg-harvest-sidebarActive text-harvest-sidebarActiveText"
                                : "text-harvest-sidebarTextDim hover:bg-harvest-sidebarPanel hover:text-harvest-sidebarText"
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
          </>
        )}
      </div>
    </aside>
  );
}

export default memo(Sidebar);

"use client";

import { useEffect, useRef, useState } from "react";
import type { CaseStudy, CaseStudyResult } from "@/lib/caseStudies";
import { MODULE_NAMES } from "@/lib/curriculumConfigClient";
import { LANGUAGE_LABELS, type GenLangMode } from "@/lib/language";
import { exportCaseStudyToPdf } from "@/lib/pdfExport";
import CaseSimulation from "./CaseSimulation";
import type { SimLabels } from "./CaseSimulation";
import HistoryPanel from "./HistoryPanel";
import type { HistoryLabels } from "./HistoryPanel";
import { newHistoryId, saveHistoryEntry } from "@/lib/history";
import type { HistoryEntry, HistorySummary } from "@/lib/history";
import { useSpeechSynthesis } from "@/lib/useSpeech";

interface BiText {
  primary?: string;
  secondary?: string;
}
interface BiList {
  primary?: string[];
  secondary?: string[];
}

// In "all" (default) mode we show both languages side by side. In a single
// selected language, only that language's field is populated.
function textFields(theCase: CaseStudy, base: string, lang: GenLangMode): BiText {
  if (lang === "all") {
    return {
      primary: (theCase as any)[`${base}_pt`],
      secondary: (theCase as any)[`${base}_es`],
    };
  }
  return { primary: (theCase as any)[`${base}_${lang}`] };
}

function listFields(theCase: CaseStudy, base: string, lang: GenLangMode): BiList {
  if (lang === "all") {
    return {
      primary: (theCase as any)[`${base}_pt`],
      secondary: (theCase as any)[`${base}_es`],
    };
  }
  return { primary: (theCase as any)[`${base}_${lang}`] };
}

// Concatenates every section into one block of plain text for the
// "Listen" button — reads only the primary (first-shown) language.
function caseToSpeechText(theCase: CaseStudy, lang: GenLangMode): string {
  const parts = [
    textFields(theCase, "title", lang).primary,
    textFields(theCase, "context", lang).primary,
    textFields(theCase, "challenge", lang).primary,
    ...(listFields(theCase, "principles", lang).primary ?? []),
    ...(listFields(theCase, "discussion_questions", lang).primary ?? []),
    textFields(theCase, "recommended_approach", lang).primary,
    textFields(theCase, "scripture_anchor", lang).primary,
    textFields(theCase, "lesson", lang).primary,
  ];
  return parts.filter(Boolean).join(". ");
}

// A case is "available" in a language when its main text fields exist there (the
// generator fills missing required fields with "—", which must not count).
function hasLang(c: CaseStudy, l: string): boolean {
  const r = c as unknown as Record<string, unknown>;
  return ["title", "context", "challenge", "recommended_approach"].every((f) => {
    const v = r[`${f}_${l}`];
    return typeof v === "string" && v.trim() !== "" && v.trim() !== "—";
  });
}

// The pair of languages shown together in "all" mode in this deployment.
const PAIR: string[] = ["pt", "es"];

const TX = {
  notice: (langs: string) => `This case was generated without ${langs}. Translate it to read it here. · Este caso se generó sin ${langs}. Tradúcelo para leerlo aquí.`,
  button: (langs: string) => `🌐 Translate this case to ${langs} · Traducir este caso a ${langs}`,
  translating: "Translating… · Traduciendo…",
  error: "Could not translate the case. Please try again. · No se pudo traducir el caso. Inténtalo de nuevo.",
};

const SIM: SimLabels = {
  cardTitle: "🎭 Practice this case · Practicar este caso",
  cardText: "Role-play the scenario with an AI facilitator, get feedback, then see the recommended approach. · Haz un juego de roles del escenario con un facilitador de IA, recibe retroalimentación y luego ve el enfoque recomendado.",
  cardButton: "Start practice · Empezar práctica",
  title: "Case simulation · Simulación del caso",
  back: "← Back to the case · Volver al caso",
  scenario: "The scenario · El escenario",
  introText: "You play the missionary; the facilitator plays everyone else in the story. Answer as you really would — there are no hints during the exercise. When you are ready, end it to get feedback and the recommended approach. · Tú haces el papel del misionero; el facilitador hace a todas las demás personas de la historia. Responde como realmente lo harías — no hay pistas durante el ejercicio. Cuando estés listo, termínalo para recibir la retroalimentación y el enfoque recomendado.",
  langLabel: "Simulation language · Idioma de la simulación",
  start: "Start simulation · Iniciar simulación",
  starting: "Setting the scene… · Preparando el escenario…",
  placeholder: "What do you say or do? · ¿Qué dices o haces?",
  send: "Send · Enviar",
  finish: "End and get feedback · Terminar y recibir retroalimentación",
  finishHint: "Respond at least once to unlock this. · Responde al menos una vez para habilitarlo.",
  finishing: "Preparing your feedback… · Preparando tu retroalimentación…",
  limit: "You reached the limit for this simulation. End it to get your feedback. · Alcanzaste el límite de esta simulación. Termínala para recibir tu retroalimentación.",
  error: "Something went wrong. Please try again. · Algo salió mal. Inténtalo de nuevo.",
  retry: "Try again · Intentar de nuevo",
  feedbackTitle: "Feedback and recommended approach · Retroalimentación y enfoque recomendado",
  showCase: "See the full case · Ver el caso completo",
  again: "Practice again · Practicar de nuevo",
  confirmAgain: "Start over? The current practice will be erased. · ¿Empezar de nuevo? La práctica actual se borrará.",
  turns: (n: number, max: number) => `Your responses: ${n}/${max} · Tus respuestas: ${n}/${max}`,
};

const HIST: HistoryLabels = {
  title: "History · Historial",
  note: "Saved on this device only. · Guardado solo en este dispositivo.",
  empty: "Nothing saved yet. · Nada guardado aún.",
  open: "Open · Abrir",
  remove: "Delete · Eliminar",
  clearAll: "Clear all · Borrar todo",
  confirmClear: "Delete all saved items? · ¿Eliminar todos los elementos guardados?",
  close: "Close · Cerrar",
  current: "open now · abierto ahora",
  summary: (s: HistorySummary) => `${s.revealed}/${s.total} answered, ${s.correct} correct · ${s.revealed}/${s.total} respondidas, ${s.correct} correctas`,
};

function caseTitle(c: CaseStudy | undefined, lang: string): string {
  if (!c) return "";
  const r = c as unknown as Record<string, unknown>;
  const pick = (l: string) => {
    const v = r[`title_${l}`];
    return typeof v === "string" && v.trim() ? v.trim() : "";
  };
  if (lang !== "all" && pick(lang)) return pick(lang);
  for (const k of Object.keys(r)) if (k.startsWith("title_") && pick(k.slice(6))) return pick(k.slice(6));
  return "";
}

export default function CaseStudyPanel({
  selectedModule,
  userKey = "anon",
}: {
  selectedModule: number | null;
  userKey?: string;
}) {
  const [module, setModule] = useState<number>(selectedModule ?? 1);
  const [instructions, setInstructions] = useState("");
  const [lang, setLang] = useState<GenLangMode>("all");
  const tts = useSpeechSynthesis();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CaseStudyResult | null>(null);
  // Cases already generated, kept in this browser (see lib/history.ts), and the role-play view.
  const [historyId, setHistoryId] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [simOpen, setSimOpen] = useState(false);

  // ── Autosave (same idea as QuizPanel) ────────────────────────────────
  // Generating a case costs an AI call; losing it by switching tabs was the
  // most frustrating way to waste one.
  const draftKey = `ghi_case_draft_v1:${userKey}`;
  const [hydrated, setHydrated] = useState(false);
  const [restored, setRestored] = useState(false);
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(draftKey);
      if (raw) {
        const d = JSON.parse(raw);
        if (d?.result?.cases?.length) {
          if (typeof d.module === "number") setModule(d.module);
          if (d.lang === "all" || d.lang === "pt" || d.lang === "es") setLang(d.lang);
          if (typeof d.instructions === "string") setInstructions(d.instructions);
          setResult(d.result);
          setHistoryId(typeof d.historyId === "string" && d.historyId ? d.historyId : newHistoryId());
          setRestored(true);
        }
      }
    } catch {
      /* corrupt or unavailable storage — start fresh */
    }
    setHydrated(true);
  }, [draftKey]);
  useEffect(() => {
    if (!hydrated) return;
    {
      try {
        if (result?.cases?.length) {
          window.localStorage.setItem(
            draftKey,
            JSON.stringify({ module, lang, instructions, result, historyId, savedAt: Date.now() })
          );
        } else {
          window.localStorage.removeItem(draftKey);
        }
      } catch {
        /* storage full/unavailable — non-fatal */
      }
    }
  }, [hydrated, result, historyId, module, lang, instructions, draftKey]);

  // Follow the sidebar: picking a module there pre-selects it here.
  const prevSelected = useRef(selectedModule);
  useEffect(() => {
    if (prevSelected.current === selectedModule) return;
    prevSelected.current = selectedModule;
    if (selectedModule !== null) setModule(selectedModule);
  }, [selectedModule]);

  async function generate() {
    setLoading(true);
    setResult(null);
    setRestored(false);
    setSimOpen(false);
    setShowHistory(false);
    const res = await fetch("/api/case-study", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ module, customInstructions: instructions, lang }),
    });
    const data = (await res.json()) as CaseStudyResult;
    setResult(data);
    if (data?.cases?.length) setHistoryId(newHistoryId());
    setLoading(false);
  }

  // ── Translate an already-generated case ──────────────────────────────
  // Switching to a language the case was not generated in used to show empty
  // fields, forcing a brand-new (different) case. Now the existing case is
  // translated instead — same case, new language — via /api/case-study/translate.
  const [translating, setTranslating] = useState(false);
  const [translateError, setTranslateError] = useState<string | null>(null);
  const caseNow = result?.cases?.[0];
  const neededLangs: string[] = lang === "all" ? PAIR : [lang];
  const missingLangs: string[] = caseNow ? neededLangs.filter((l) => !hasLang(caseNow, l)) : [];
  const missingNames = missingLangs
    .map((l) => LANGUAGE_LABELS[l as keyof typeof LANGUAGE_LABELS] ?? l)
    .join(", ");

  async function translateMissing() {
    if (!caseNow || translating) return;
    setTranslating(true);
    setTranslateError(null);
    try {
      let current: CaseStudy = caseNow;
      for (const target of missingLangs) {
        const res = await fetch("/api/case-study/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ case: current, targetLang: target }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.case) throw new Error(data?.error ?? "translation failed");
        current = data.case as CaseStudy;
      }
      const finalCase = current;
      setResult((prev) => (prev ? { ...prev, cases: [finalCase, ...(prev.cases ?? []).slice(1)] } : prev));
    } catch {
      setTranslateError(TX.error);
    } finally {
      setTranslating(false);
    }
  }

  // ── History: every generated case is kept in this browser ──
  useEffect(() => {
    const c = result?.cases?.[0];
    if (!historyId || !c) return;
    saveHistoryEntry("case", userKey, {
      id: historyId,
      kind: "case",
      module,
      lang,
      title: caseTitle(c, lang),
      data: { result, instructions },
    });
  }, [historyId, result, module, lang, instructions, userKey]);

  function openFromHistory(e: HistoryEntry) {
    const d = e.data as { result?: CaseStudyResult; instructions?: string } | undefined;
    if (!d || !d.result || !d.result.cases || d.result.cases.length === 0) return;
    setModule(e.module);
    setLang(e.lang as GenLangMode);
    setInstructions(d.instructions ?? "");
    setResult(d.result);
    setHistoryId(e.id);
    setRestored(false);
    setSimOpen(false);
    setShowHistory(false);
  }

  const theCase = result?.cases?.[0];
  const title = theCase ? textFields(theCase, "title", lang) : undefined;

  return (
    <div className="flex-1 overflow-y-auto bg-harvest-bg px-4 py-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex flex-wrap items-end gap-3 rounded-2xl border border-harvest-border bg-harvest-panel p-4 shadow-sm">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-harvest-textDim">
              Module · Módulo
            </label>
            <select
              value={module}
              onChange={(e) => setModule(Number(e.target.value))}
              className="rounded-lg border border-harvest-border bg-harvest-panel2 px-3 py-2 text-sm outline-none focus:border-harvest-gold"
            >
              {Object.entries(MODULE_NAMES).map(([num, name]) => (
                <option key={num} value={num}>
                  {num}. {name.split(" | ")[0]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-harvest-textDim">
              Language · Idioma
            </label>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as GenLangMode)}
              className="rounded-lg border border-harvest-border bg-harvest-panel2 px-3 py-2 text-sm outline-none focus:border-harvest-gold"
            >
              <option value="all">English + Español (default)</option>
              <option value="pt">{LANGUAGE_LABELS.pt} only</option>
              <option value="es">{LANGUAGE_LABELS.es} solamente</option>
            </select>
          </div>
          <div className="min-w-[220px] flex-1">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-harvest-textDim">
              Instructor Directions (optional) · Instrucciones (opcional)
            </label>
            <input
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Southeast Asian Buddhist context"
              className="w-full rounded-lg border border-harvest-border bg-harvest-panel2 px-3 py-2 text-sm outline-none focus:border-harvest-gold"
            />
          </div>
          <button
            onClick={generate}
            disabled={loading}
            className="rounded-full bg-harvest-gold px-5 py-2 text-sm font-semibold text-white transition hover:bg-harvest-goldDeep disabled:opacity-40"
          >
            {loading ? "Writing… · Escribiendo…" : "Generate case study · Generar estudio de caso"}
          </button>
          <button
            onClick={() => setShowHistory((v) => !v)}
            className="rounded-full border border-harvest-border px-3 py-2 text-xs text-harvest-textDim transition hover:border-harvest-gold/50 hover:text-harvest-gold"
            title={HIST.title}
          >
            🕘 {HIST.title.split(/ [/·] /)[0]}
          </button>
          {theCase && (
            <>
              {tts.isSupported && (
                <button
                  onClick={() =>
                    tts.speakingId === "case"
                      ? tts.stop()
                      : tts.speak("case", caseToSpeechText(theCase, lang), lang === "all" ? "auto" : lang)
                  }
                  className="rounded-full border border-harvest-border px-3 py-2 text-xs text-harvest-textDim transition hover:border-harvest-gold/50 hover:text-harvest-gold"
                  title="Listen to this case study · Escuchar este estudio de caso"
                >
                  {tts.speakingId === "case" ? "⏹ Stop · Detener" : "🔊 Listen · Escuchar"}
                </button>
              )}
              <button
                onClick={() => result && exportCaseStudyToPdf(result, lang)}
                className="rounded-full border border-harvest-border px-3 py-2 text-xs text-harvest-textDim transition hover:border-harvest-gold/50 hover:text-harvest-gold"
                title="Download this case study as PDF · Descargar este estudio de caso en PDF"
              >
                📄 PDF
              </button>
              <button
                onClick={() => {
                  setResult(null);
                  setRestored(false);
                }}
                className="rounded-full border border-harvest-border px-3 py-2 text-xs text-harvest-textDim transition hover:border-harvest-gold/50 hover:text-harvest-gold"
                title="Clear the current case study · Borra el estudio de caso actual"
              >
                🗑️ Clear · Limpiar
              </button>
            </>
          )}
        </div>

        {showHistory && (
          <HistoryPanel
            kind="case"
            userKey={userKey}
            labels={HIST}
            moduleName={(n) => (MODULE_NAMES[n] ?? "").split(" | ")[0] ?? ""}
            currentId={historyId}
            onOpen={openFromHistory}
            onClose={() => setShowHistory(false)}
          />
        )}

        {restored && theCase && (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-harvest-gold/30 bg-harvest-gold/5 px-4 py-2 text-xs text-harvest-textDim">
            <span>
              💾 We restored your last case study. · Restauramos tu último estudio de caso.
            </span>
            <button onClick={() => setRestored(false)} className="font-semibold text-harvest-goldDeep hover:underline">
              OK
            </button>
          </div>
        )}

        {result?.error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            ⚠️ {result.error}
          </div>
        )}

        {theCase && !simOpen && missingLangs.length > 0 && (
          <div className="mb-4 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
            <p>{TX.notice(missingNames)}</p>
            <button
              onClick={translateMissing}
              disabled={translating}
              className="mt-3 rounded-full bg-harvest-gold px-4 py-2 text-xs font-semibold text-white transition hover:bg-harvest-goldDeep disabled:opacity-50"
            >
              {translating ? TX.translating : TX.button(missingNames)}
            </button>
            {translateError && <p className="mt-2 text-xs text-red-600">{translateError}</p>}
          </div>
        )}

        {theCase && simOpen && (
          <CaseSimulation
            caseData={theCase}
            simKey={`${userKey}:${historyId || "case"}`}
            languages={Object.entries(LANGUAGE_LABELS).map(([code, label]) => ({ code, label }))}
            initialLang={lang !== "all" ? lang : PAIR[0] ?? "en"}
            labels={SIM}
            scenario={{
              title: title?.primary,
              context: textFields(theCase, "context", lang).primary,
              challenge: textFields(theCase, "challenge", lang).primary,
            }}
            onExit={() => setSimOpen(false)}
          />
        )}

        {theCase && !simOpen && !(lang !== "all" && missingLangs.length > 0) && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-harvest-gold/30 bg-harvest-gold/5 p-4">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-harvest-text">{SIM.cardTitle}</p>
              <p className="text-xs text-harvest-textDim">{SIM.cardText}</p>
            </div>
            <button
              onClick={() => setSimOpen(true)}
              className="rounded-full bg-harvest-gold px-4 py-2 text-xs font-semibold text-white transition hover:bg-harvest-goldDeep"
            >
              {SIM.cardButton}
            </button>
          </div>
        )}

        {theCase && !simOpen && !(lang !== "all" && missingLangs.length > 0) && (
          <article className="rounded-2xl border border-harvest-border bg-harvest-panel p-6 shadow-sm">
            <h2 className="font-serif text-lg font-semibold text-harvest-text">{title?.primary}</h2>
            {title?.secondary && <p className="mb-4 text-sm text-harvest-textDim">{title.secondary}</p>}

            <Section label="Context" labelEs="Contexto" {...textFields(theCase, "context", lang)} />
            <Section label="Challenge" labelEs="Desafío" {...textFields(theCase, "challenge", lang)} />

            <ListSection label="Principles" labelEs="Principios" {...listFields(theCase, "principles", lang)} />
            <ListSection
              label="Discussion Questions"
              labelEs="Preguntas de Discusión"
              {...listFields(theCase, "discussion_questions", lang)}
            />

            <Section label="Recommended Approach" labelEs="Enfoque Recomendado" {...textFields(theCase, "recommended_approach", lang)} />
            <Section label="Scripture Anchor" labelEs="Base Bíblica" {...textFields(theCase, "scripture_anchor", lang)} />
            <Section label="Lesson" labelEs="Lección" {...textFields(theCase, "lesson", lang)} />
          </article>
        )}
      </div>
    </div>
  );
}

function Section({
  label,
  labelEs,
  primary,
  secondary,
}: {
  label: string;
  labelEs: string;
  primary?: string;
  secondary?: string;
}) {
  return (
    <div className="mb-5">
      <p className="mb-1 text-xs font-bold uppercase tracking-wide text-harvest-goldDeep">
        {label} · {labelEs}
      </p>
      <p className="text-sm leading-relaxed text-harvest-text">{primary}</p>
      {secondary && <p className="mt-1 text-sm leading-relaxed text-harvest-textDim">{secondary}</p>}
    </div>
  );
}

function ListSection({
  label,
  labelEs,
  primary,
  secondary,
}: {
  label: string;
  labelEs: string;
  primary?: string[];
  secondary?: string[];
}) {
  const items = primary ?? [];
  return (
    <div className="mb-5">
      <p className="mb-1 text-xs font-bold uppercase tracking-wide text-harvest-goldDeep">
        {label} · {labelEs}
      </p>
      <ul className="list-disc space-y-1 pl-5 text-sm text-harvest-text">
        {items.map((item, i) => (
          <li key={i}>
            {item}
            {secondary?.[i] && <span className="ml-1 text-harvest-textDim">— {secondary[i]}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

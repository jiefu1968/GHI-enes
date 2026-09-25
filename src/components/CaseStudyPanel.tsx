"use client";

import { useState } from "react";
import type { CaseStudy, CaseStudyResult } from "@/lib/caseStudies";
import { MODULE_NAMES } from "@/lib/curriculumConfigClient";
import { LANGUAGE_LABELS, type GenLangMode } from "@/lib/language";
import { exportCaseStudyToPdf } from "@/lib/pdfExport";
import { useSpeechSynthesis } from "@/lib/useSpeech";

interface BiText {
  primary?: string;
  secondary?: string;
}
interface BiList {
  primary?: string[];
  secondary?: string[];
}

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

export default function CaseStudyPanel({ selectedModule }: { selectedModule: number | null }) {
  const [module, setModule] = useState<number>(selectedModule ?? 1);
  const [instructions, setInstructions] = useState("");
  const [lang, setLang] = useState<GenLangMode>("all");
  const tts = useSpeechSynthesis();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CaseStudyResult | null>(null);

  async function generate() {
    setLoading(true);
    setResult(null);
    const res = await fetch("/api/case-study", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ module, customInstructions: instructions, lang }),
    });
    const data = (await res.json()) as CaseStudyResult;
    setResult(data);
    setLoading(false);
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
                onClick={() => setResult(null)}
                className="rounded-full border border-harvest-border px-3 py-2 text-xs text-harvest-textDim transition hover:border-harvest-gold/50 hover:text-harvest-gold"
                title="Clear the current case study · Borra el estudio de caso actual"
              >
                🗑️ Clear · Limpiar
              </button>
            </>
          )}
        </div>

        {result?.error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            ⚠️ {result.error}
          </div>
        )}

        {theCase && (
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

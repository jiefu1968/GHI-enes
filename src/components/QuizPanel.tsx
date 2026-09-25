"use client";

import { useState } from "react";
import clsx from "clsx";
import type { QuizResult, QuizQuestion } from "@/lib/quiz";
import { MODULE_NAMES } from "@/lib/curriculumConfigClient";
import { LANGUAGE_LABELS, type GenLangMode } from "@/lib/language";
import { exportQuizToPdf } from "@/lib/pdfExport";

const LETTERS = ["a", "b", "c", "d", "e"] as const;

function optionKey(letter: string, lang: GenLangMode): keyof QuizQuestion {
  if (lang === "all" || lang === "pt") return letter as keyof QuizQuestion;
  return `${letter}_${lang}` as keyof QuizQuestion;
}
function secondaryOptionKey(letter: string): keyof QuizQuestion {
  return `${letter}_es` as keyof QuizQuestion;
}

interface BiText {
  primary?: string;
  secondary?: string;
}

function questionText(q: QuizQuestion, lang: GenLangMode): BiText {
  if (lang === "all") return { primary: q.q_pt, secondary: q.q_es };
  const key = `q_${lang}` as keyof QuizQuestion;
  return { primary: q[key] as unknown as string };
}

function explanationText(q: QuizQuestion, lang: GenLangMode, field: "why_correct" | "why_wrong"): BiText {
  if (lang === "all") {
    return {
      primary: q[`${field}_pt`] as unknown as string,
      secondary: q[`${field}_es`] as unknown as string,
    };
  }
  return { primary: q[`${field}_${lang}` as keyof QuizQuestion] as unknown as string };
}

export default function QuizPanel({ selectedModule }: { selectedModule: number | null }) {
  const [module, setModule] = useState<number>(selectedModule ?? 1);
  const [instructions, setInstructions] = useState("");
  const [lang, setLang] = useState<GenLangMode>("all");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});

  async function generate() {
    setLoading(true);
    setResult(null);
    setAnswers({});
    setRevealed({});
    const res = await fetch("/api/quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ module, customInstructions: instructions, lang }),
    });
    const data = (await res.json()) as QuizResult;
    setResult(data);
    setLoading(false);
  }

  const questions = result?.questions ?? [];
  const answeredCount = Object.keys(revealed).length;
  const correctCount = questions.filter((q) => revealed[q.n] && answers[q.n] === q.correct).length;

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
              placeholder="e.g. focus on Muslim contexts"
              className="w-full rounded-lg border border-harvest-border bg-harvest-panel2 px-3 py-2 text-sm outline-none focus:border-harvest-gold"
            />
          </div>
          <button
            onClick={generate}
            disabled={loading}
            className="rounded-full bg-harvest-gold px-5 py-2 text-sm font-semibold text-white transition hover:bg-harvest-goldDeep disabled:opacity-40"
          >
            {loading ? "Generating… · Generando…" : "Generate quiz · Generar prueba"}
          </button>
          {questions.length > 0 && (
            <>
              <button
                onClick={() => result && exportQuizToPdf(result, lang, answers)}
                className="rounded-full border border-harvest-border px-3 py-2 text-xs text-harvest-textDim transition hover:border-harvest-gold/50 hover:text-harvest-gold"
                title="Download this quiz as PDF · Descargar esta prueba en PDF"
              >
                📄 PDF
              </button>
              <button
                onClick={() => {
                  setResult(null);
                  setAnswers({});
                  setRevealed({});
                }}
                className="rounded-full border border-harvest-border px-3 py-2 text-xs text-harvest-textDim transition hover:border-harvest-gold/50 hover:text-harvest-gold"
                title="Clear the current quiz · Borra la prueba actual"
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

        {questions.length > 0 && (
          <>
            <h2 className="mb-4 font-serif font-semibold text-harvest-text">
              📝 {result?.module_title} — {questions.length} questions · preguntas
            </h2>
            <div className="flex flex-col gap-4">
              {questions.map((q) => (
                <QuestionCard
                  key={q.n}
                  q={q}
                  lang={lang}
                  selected={answers[q.n]}
                  revealed={!!revealed[q.n]}
                  onSelect={(letter) => setAnswers((prev) => ({ ...prev, [q.n]: letter }))}
                  onReveal={() => setRevealed((prev) => ({ ...prev, [q.n]: true }))}
                />
              ))}
            </div>

            {answeredCount === questions.length && (
              <div className="mt-6 rounded-2xl border border-harvest-gold/30 bg-harvest-panel p-6 text-center shadow-sm">
                <h3 className="font-serif font-semibold text-harvest-text">🎯 Complete · Completado</h3>
                <p className="mt-2 text-3xl font-bold text-harvest-green">
                  {correctCount} / {questions.length}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function QuestionCard({
  q,
  lang,
  selected,
  revealed,
  onSelect,
  onReveal,
}: {
  q: QuizQuestion;
  lang: GenLangMode;
  selected?: string;
  revealed: boolean;
  onSelect: (letter: string) => void;
  onReveal: () => void;
}) {
  const qText = questionText(q, lang);
  const correctExpl = explanationText(q, lang, "why_correct");
  const wrongExpl = explanationText(q, lang, "why_wrong");

  return (
    <div className="rounded-2xl border border-harvest-border bg-harvest-panel p-5 shadow-sm">
      <span className="rounded-full bg-harvest-gold/10 px-2.5 py-0.5 text-xs font-bold tracking-wide text-harvest-goldDeep">
        QUESTION {q.n}
      </span>
      <p className="mt-2 font-semibold text-harvest-text">{qText.primary}</p>
      {qText.secondary && <p className="mt-1 text-sm text-harvest-textDim">{qText.secondary}</p>}

      <div className="mt-3 flex flex-col gap-2">
        {LETTERS.map((letter) => {
          const text = q[optionKey(letter, lang)] as unknown as string;
          if (!text) return null;
          const secondaryText = lang === "all" ? (q[secondaryOptionKey(letter)] as unknown as string) : undefined;
          const isSelected = selected === letter;
          const isCorrect = revealed && letter === q.correct;
          const isWrong = revealed && isSelected && letter !== q.correct;

          return (
            <button
              key={letter}
              onClick={() => !revealed && onSelect(letter)}
              disabled={revealed}
              className={clsx(
                "flex items-start gap-2 rounded-xl border px-3 py-2 text-left text-sm transition",
                isCorrect && "border-green-300 bg-green-50 text-green-800",
                isWrong && "border-red-300 bg-red-50 text-red-700",
                !isCorrect && !isWrong && isSelected && "border-harvest-gold bg-harvest-gold/10 text-harvest-goldDeep",
                !isCorrect && !isWrong && !isSelected && "border-harvest-border bg-harvest-panel2 text-harvest-text hover:border-harvest-gold/40"
              )}
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-harvest-gold/15 text-xs font-bold text-harvest-goldDeep">
                {letter}
              </span>
              <span className="flex flex-col">
                <span>{text}</span>
                {secondaryText && <span className="text-xs opacity-70">{secondaryText}</span>}
              </span>
            </button>
          );
        })}
      </div>

      <button
        onClick={onReveal}
        disabled={!selected || revealed}
        className="mt-3 rounded-full bg-harvest-gold/10 px-3 py-1.5 text-xs font-semibold text-harvest-goldDeep transition hover:bg-harvest-gold/20 disabled:opacity-40"
      >
        Reveal answer · Revelar respuesta
      </button>

      {revealed && (
        <div className="mt-3 overflow-hidden rounded-xl border border-green-200">
          <div className="bg-green-50 px-4 py-2 text-sm font-bold text-green-800">
            {selected === q.correct ? "✅ Correct! · ¡Correcto!" : `❌ Correct answer · Respuesta correcta: ${q.correct.toUpperCase()}`}
          </div>
          <div className="bg-harvest-panel px-4 py-3 text-sm text-harvest-text">
            <p>{correctExpl.primary}</p>
            {correctExpl.secondary && <p className="mt-1 text-harvest-textDim">{correctExpl.secondary}</p>}
          </div>
          <div className="border-t border-harvest-border bg-harvest-panel2 px-4 py-3 text-xs text-harvest-textDim">
            <p>{wrongExpl.primary}</p>
            {wrongExpl.secondary && <p className="mt-1">{wrongExpl.secondary}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

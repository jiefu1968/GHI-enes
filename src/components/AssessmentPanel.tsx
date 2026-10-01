"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { MODULE_GROUPS } from "@/lib/moduleGroups";
import type { AssessmentArea } from "@/lib/entryAssessment";
import { exportAssessmentToPdf } from "@/lib/pdfExport";

// Client-safe subset of each question — never receives `correct` from
// the server on initial load (see /api/assessment's GET). The correct
// answer for a given area is only revealed after the person explicitly
// checks that area (see /api/assessment/check), and only for that one
// area's questions — never all 100 up front.
interface ClientQuestion {
  id: number;
  area: AssessmentArea;
  moduleNum: number;
  question_pt: string;
  question_es: string;
  options_pt: [string, string, string, string];
  options_es: [string, string, string, string];
}

interface AssessmentResult {
  foundationsScore: number;
  formationScore: number;
  interculturalScore: number;
  strategyScore: number;
  evangelismScore: number;
  totalScore: number;
  completedAt: string;
}

// Per-question reveal for ONE area, returned by /api/assessment/check.
interface AreaCheck {
  score: number;
  total: number;
  byQuestionId: Record<number, { correct: number; isCorrect: boolean }>;
}

const AREA_ORDER: AssessmentArea[] = ["foundations", "formation", "intercultural", "strategy", "evangelism"];

function areaLabel(area: AssessmentArea): [string, string] {
  const group = MODULE_GROUPS.find((g) => g.id === area);
  const parts = (group?.label ?? area).split(" | ");
  return [parts[0] ?? area, parts[1] ?? area];
}

export default function AssessmentPanel() {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<ClientQuestion[]>([]);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [pageIndex, setPageIndex] = useState(0); // 0-4, one per area
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // One entry per area once the person has checked it — persists as they
  // navigate back and forth, so re-visiting a checked area still shows
  // the reveal instead of going blank again.
  const [areaChecks, setAreaChecks] = useState<Partial<Record<AssessmentArea, AreaCheck>>>({});
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/assessment")
      .then((r) => r.json())
      .then((data) => {
        setQuestions(data.questions ?? []);
        setResult(data.result ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleCheckArea(area: AssessmentArea) {
    setChecking(true);
    setCheckError(null);
    try {
      const res = await fetch("/api/assessment/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ area, answers }),
      });
      const data = await res.json();
      if (data.error) {
        setCheckError(data.error);
        return;
      }
      const byQuestionId: Record<number, { correct: number; isCorrect: boolean }> = {};
      for (const r of data.results as Array<{ id: number; correct: number; isCorrect: boolean }>) {
        byQuestionId[r.id] = { correct: r.correct, isCorrect: r.isCorrect };
      }
      setAreaChecks((prev) => ({ ...prev, [area]: { score: data.score, total: data.total, byQuestionId } }));
    } catch {
      setCheckError("Could not check your answers — check your connection and try again. · No se pudo verificar tus respuestas — revisa tu conexión e intenta de nuevo.");
    } finally {
      setChecking(false);
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/assessment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (data.error) {
      setError(data.error);
      return;
    }
    setResult(data.result);
  }

  if (loading) {
    return <div className="flex-1 bg-harvest-bg p-6 text-sm text-harvest-textDim">Loading… · Cargando…</div>;
  }

  // ── Result view (already completed) ──
  if (result) {
    return (
      <div className="flex-1 overflow-y-auto bg-harvest-bg px-4 py-6">
        <div className="mx-auto max-w-2xl">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="font-serif text-lg font-semibold text-harvest-text">
              Initial Assessment Result · Resultado de la Evaluación Inicial
            </h2>
            <button
              onClick={() => exportAssessmentToPdf(result)}
              className="rounded-full border border-harvest-border px-3 py-1.5 text-xs text-harvest-textDim transition hover:border-harvest-gold/50 hover:text-harvest-gold"
              title="Download this result as PDF · Descargar este resultado en PDF"
            >
              📄 PDF
            </button>
          </div>
          <p className="mb-6 text-xs text-harvest-textDim">
            Completed on · Completada el {new Date(result.completedAt).toLocaleDateString()}
          </p>

          <div className="mb-6 rounded-2xl border border-harvest-gold/20 bg-harvest-panel p-6 text-center shadow-sm">
            <p className="text-xs uppercase tracking-wide text-harvest-textDim">Total Score · Puntuación total</p>
            <p className="mt-1 text-4xl font-bold text-harvest-gold">{result.totalScore} / 100</p>
          </div>

          <div className="flex flex-col gap-3">
            {(
              [
                ["foundations", result.foundationsScore, 20],
                ["formation", result.formationScore, 20],
                ["intercultural", result.interculturalScore, 20],
                ["strategy", result.strategyScore, 20],
                ["evangelism", result.evangelismScore, 20],
              ] as [AssessmentArea, number, number][]
            ).map(([area, score, max]) => {
              const [labelPt, labelEs] = areaLabel(area);
              const pct = score / max;
              return (
                <div key={area} className="rounded-xl border border-harvest-border bg-harvest-panel p-4 shadow-sm">
                  <div className="mb-1 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-harvest-text">{labelPt}</p>
                      <p className="text-xs text-harvest-textDim">{labelEs}</p>
                    </div>
                    <span className={clsx("text-sm font-bold", pct >= 0.6 ? "text-harvest-green" : "text-amber-600")}>
                      {score}/{max} {pct >= 0.6 ? "✅" : "⚠️"}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-harvest-panel2">
                    <div
                      className={clsx("h-full rounded-full", pct >= 0.6 ? "bg-harvest-green" : "bg-amber-500")}
                      style={{ width: `${pct * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <p className="mt-6 text-xs text-harvest-textDim">
            This result is also visible to your mentor, to help decide where to start. · Este resultado también es visible para tu mentor, para ayudar a decidir por dónde empezar.
          </p>
        </div>
      </div>
    );
  }

  // ── Test-taking view ──
  const currentArea = AREA_ORDER[pageIndex] ?? "foundations";
  const areaQuestions = questions.filter((q) => q.area === currentArea);
  const [labelPt, labelEs] = areaLabel(currentArea);
  const answeredInArea = areaQuestions.filter((q) => answers[q.id] !== undefined).length;
  const totalAnswered = Object.keys(answers).length;
  const isLastPage = pageIndex === AREA_ORDER.length - 1;
  const currentCheck = areaChecks[currentArea];

  return (
    <div className="flex-1 overflow-y-auto bg-harvest-bg px-4 py-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-4">
          <h2 className="font-serif text-lg font-semibold text-harvest-text">Initial Assessment · Evaluación Inicial</h2>
          <p className="text-xs text-harvest-textDim">
            100 fixed questions, one time only, so your mentor gets to know your theological and missiological baseline. ·
            100 preguntas fijas, una única vez, para que tu mentor conozca tu base teológica y misionológica.
          </p>
        </div>

        {/* Area tabs */}
        <div className="mb-4 flex flex-wrap gap-1.5">
          {AREA_ORDER.map((area, i) => {
            const count = questions.filter((q) => q.area === area).length;
            const answeredCount = questions.filter((q) => q.area === area && answers[q.id] !== undefined).length;
            const checked = areaChecks[area];
            return (
              <button
                key={area}
                onClick={() => setPageIndex(i)}
                className={clsx(
                  "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                  i === pageIndex ? "bg-harvest-gold text-white" : "bg-harvest-panel2 text-harvest-textDim hover:text-harvest-text"
                )}
              >
                {i + 1}. {answeredCount}/{count} {checked ? `· ${checked.score}/${checked.total} ✓` : ""}
              </button>
            );
          })}
        </div>

        <div className="mb-4 rounded-xl border border-harvest-border bg-harvest-panel px-4 py-3 shadow-sm">
          <p className="text-sm font-semibold text-harvest-text">{labelPt}</p>
          <p className="text-xs text-harvest-textDim">{labelEs}</p>
        </div>

        {currentCheck && (
          <div className="mb-4 rounded-xl border border-harvest-gold/30 bg-harvest-gold/5 px-4 py-3 text-center">
            <p className="text-xs uppercase tracking-wide text-harvest-textDim">This part's score · Puntuación de esta parte</p>
            <p className="mt-0.5 text-2xl font-bold text-harvest-gold">{currentCheck.score} / {currentCheck.total}</p>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {areaQuestions.map((q, qi) => {
            const questionCheck = currentCheck?.byQuestionId[q.id];
            const selected = answers[q.id];
            return (
              <div key={q.id} className="rounded-2xl border border-harvest-border bg-harvest-panel p-5 shadow-sm">
                <span className="rounded-full bg-harvest-gold/10 px-2.5 py-0.5 text-xs font-bold tracking-wide text-harvest-goldDeep">
                  {qi + 1}/{areaQuestions.length}
                </span>
                <p className="mt-2 font-semibold text-harvest-text">{q.question_pt}</p>
                <p className="mt-1 text-sm text-harvest-textDim">{q.question_es}</p>

                <div className="mt-3 flex flex-col gap-2">
                  {q.options_pt.map((optPt, oi) => {
                    const isCorrectOption = questionCheck && oi === questionCheck.correct;
                    const isWrongSelected = questionCheck && !questionCheck.isCorrect && oi === selected;
                    return (
                      <button
                        key={oi}
                        onClick={() => !questionCheck && setAnswers((prev) => ({ ...prev, [q.id]: oi }))}
                        disabled={!!questionCheck}
                        className={clsx(
                          "flex items-start gap-2 rounded-xl border px-3 py-2 text-left text-sm transition",
                          isCorrectOption
                            ? "border-green-300 bg-green-50 text-green-800"
                            : isWrongSelected
                            ? "border-red-300 bg-red-50 text-red-700"
                            : selected === oi
                            ? "border-harvest-gold bg-harvest-gold/10 text-harvest-goldDeep"
                            : "border-harvest-border bg-harvest-panel2 text-harvest-text hover:border-harvest-gold/40",
                          questionCheck && "cursor-default opacity-90"
                        )}
                      >
                        <span
                          className={clsx(
                            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                            isCorrectOption
                              ? "bg-green-200 text-green-800"
                              : isWrongSelected
                              ? "bg-red-200 text-red-700"
                              : "bg-harvest-gold/15 text-harvest-goldDeep"
                          )}
                        >
                          {String.fromCharCode(97 + oi)}
                        </span>
                        <span className="flex flex-col">
                          <span>{optPt}</span>
                          <span className="text-xs opacity-70">{q.options_es[oi]}</span>
                        </span>
                        {isCorrectOption && <span className="ml-auto text-green-700">✓</span>}
                        {isWrongSelected && <span className="ml-auto text-red-600">✕</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {!currentCheck && (
          <button
            onClick={() => handleCheckArea(currentArea)}
            disabled={checking || answeredInArea === 0}
            className="mt-4 w-full rounded-xl border border-harvest-gold bg-harvest-gold/5 px-4 py-2.5 text-sm font-semibold text-harvest-goldDeep transition hover:bg-harvest-gold/15 disabled:opacity-40"
          >
            {checking ? "Checking… · Verificando…" : "✓ Check my answers for this part · Verificar mis respuestas de esta parte"}
          </button>
        )}
        {checkError && <p className="mt-2 text-sm text-red-600">{checkError}</p>}

        <div className="mt-5 flex items-center justify-between">
          <button
            onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
            disabled={pageIndex === 0}
            className="rounded-full border border-harvest-border px-4 py-2 text-sm text-harvest-textDim transition hover:border-harvest-gold/50 disabled:opacity-30"
          >
            ← Previous · Anterior
          </button>

          {!isLastPage ? (
            <button
              onClick={() => setPageIndex((p) => Math.min(AREA_ORDER.length - 1, p + 1))}
              className="rounded-full bg-harvest-gold px-5 py-2 text-sm font-semibold text-white transition hover:bg-harvest-goldDeep"
            >
              Next area · Área siguiente →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded-full bg-harvest-gold px-5 py-2 text-sm font-semibold text-white transition hover:bg-harvest-goldDeep disabled:opacity-40"
            >
              {submitting ? "Submitting… · Enviando…" : `Submit (${totalAnswered}/100 answered) · Enviar (${totalAnswered}/100 respondidas)`}
            </button>
          )}
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        {isLastPage && totalAnswered < 100 && (
          <p className="mt-3 text-xs text-amber-600">
            You still have {100 - totalAnswered} unanswered questions — you can submit anyway, but they will count as wrong. ·
            Todavía faltan {100 - totalAnswered} preguntas sin responder — puedes enviar de todas formas, pero contarán como incorrectas.
          </p>
        )}
      </div>
    </div>
  );
}

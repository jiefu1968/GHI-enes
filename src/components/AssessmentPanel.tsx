"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { MODULE_GROUPS } from "@/lib/moduleGroups";
import type { AssessmentArea } from "@/lib/entryAssessment";
import { exportAssessmentToPdf } from "@/lib/pdfExport";

// Client-safe subset of each question — never receives `correct` from
// the server (see /api/assessment's GET), so there's nothing to leak
// via devtools even before the test is submitted.
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
    return <div className="flex-1 p-6 text-sm text-harvest-textDim">Carregando… · Cargando…</div>;
  }

  // ── Result view (already completed) ──
  if (result) {
    return (
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-2xl">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="font-serif text-lg text-harvest-gold">
              Initial Assessment Result · Resultado de la Evaluación Inicial
            </h2>
            <button
              onClick={() => exportAssessmentToPdf(result)}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-harvest-textDim transition hover:border-harvest-gold/50 hover:text-harvest-gold"
              title="Download this result as PDF · Descargar este resultado en PDF"
            >
              📄 PDF
            </button>
          </div>
          <p className="mb-6 text-xs text-harvest-textDim">
            Completed on · Completada el {new Date(result.completedAt).toLocaleDateString()}
          </p>

          <div className="mb-6 rounded-xl border-2 border-harvest-goldDeep bg-gradient-to-br from-harvest-panel2 to-harvest-panel p-6 text-center">
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
                <div key={area} className="rounded-lg border border-harvest-border bg-harvest-panel p-4">
                  <div className="mb-1 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-harvest-text">{labelPt}</p>
                      <p className="text-xs text-harvest-textDim">{labelEs}</p>
                    </div>
                    <span className={clsx("text-sm font-bold", pct >= 0.6 ? "text-harvest-green" : "text-amber-400")}>
                      {score}/{max} {pct >= 0.6 ? "✅" : "⚠️"}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-harvest-panel2">
                    <div
                      className={clsx("h-full rounded-full", pct >= 0.6 ? "bg-harvest-green" : "bg-amber-400")}
                      style={{ width: `${pct * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <p className="mt-6 text-xs text-harvest-textDim">
            This result is also visible to your mentor, to help decide where to start. ·
            Este resultado también es visible para tu mentor, para ayudar a decidir por dónde empezar.
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

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-4">
          <h2 className="font-serif text-lg text-harvest-gold">Initial Assessment · Evaluación Inicial</h2>
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
            return (
              <button
                key={area}
                onClick={() => setPageIndex(i)}
                className={clsx(
                  "rounded-md px-2.5 py-1 text-xs font-semibold transition",
                  i === pageIndex ? "bg-harvest-goldDeep text-harvest-bg" : "bg-harvest-panel2 text-harvest-textDim hover:text-harvest-text"
                )}
              >
                {i + 1}. {answeredCount}/{count}
              </button>
            );
          })}
        </div>

        <div className="mb-4 rounded-lg border border-harvest-border bg-harvest-panel px-4 py-2">
          <p className="text-sm font-semibold text-harvest-gold">{labelPt}</p>
          <p className="text-xs text-harvest-textDim">{labelEs}</p>
        </div>

        <div className="flex flex-col gap-4">
          {areaQuestions.map((q, qi) => (
            <div key={q.id} className="rounded-xl border border-harvest-border bg-harvest-panel p-5">
              <span className="rounded-full border border-harvest-goldDeep/40 bg-harvest-goldDeep/15 px-2.5 py-0.5 text-xs font-bold tracking-wide text-harvest-gold">
                {qi + 1}/{areaQuestions.length}
              </span>
              <p className="mt-2 font-semibold text-harvest-text">{q.question_pt}</p>
              <p className="mt-1 text-sm text-harvest-textDim">{q.question_es}</p>

              <div className="mt-3 flex flex-col gap-2">
                {q.options_pt.map((optPt, oi) => (
                  <button
                    key={oi}
                    onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: oi }))}
                    className={clsx(
                      "flex items-start gap-2 rounded-lg border px-3 py-2 text-left text-sm transition",
                      answers[q.id] === oi
                        ? "border-harvest-goldDeep bg-harvest-goldDeep/15 text-harvest-text"
                        : "border-white/10 bg-harvest-panel2 text-harvest-text hover:border-harvest-goldDeep/40"
                    )}
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-harvest-goldDeep/50 bg-harvest-goldDeep/20 text-xs font-bold text-harvest-gold">
                      {String.fromCharCode(97 + oi)}
                    </span>
                    <span className="flex flex-col">
                      <span>{optPt}</span>
                      <span className="text-xs opacity-70">{q.options_es[oi]}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between">
          <button
            onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
            disabled={pageIndex === 0}
            className="rounded-lg border border-white/10 px-4 py-2 text-sm text-harvest-textDim transition hover:border-harvest-gold/50 disabled:opacity-30"
          >
            ← Anterior · Anterior
          </button>

          {!isLastPage ? (
            <button
              onClick={() => setPageIndex((p) => Math.min(AREA_ORDER.length - 1, p + 1))}
              className="rounded-lg bg-harvest-goldDeep px-4 py-2 text-sm font-semibold text-harvest-bg transition hover:bg-harvest-gold"
            >
              Next area · Área siguiente →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded-lg bg-harvest-goldDeep px-4 py-2 text-sm font-semibold text-harvest-bg transition hover:bg-harvest-gold disabled:opacity-40"
            >
              {submitting ? "Submitting… · Enviando…" : `Submit (${totalAnswered}/100 answered) · Enviar (${totalAnswered}/100 respondidas)`}
            </button>
          )}
        </div>

        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
        {isLastPage && totalAnswered < 100 && (
          <p className="mt-3 text-xs text-amber-400">
            You still have {100 - totalAnswered} unanswered questions — you can submit anyway, but they will count as wrong. ·
            Todavía faltan {100 - totalAnswered} preguntas sin responder — puedes enviar de todas formas, pero contarán como incorrectas.
          </p>
        )}
      </div>
    </div>
  );
}

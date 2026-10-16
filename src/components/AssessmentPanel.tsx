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

// What is persisted in the browser while the assessment is in progress.
interface Draft {
  answers: Record<number, number>;
  pageIndex: number;
  areaChecks: Partial<Record<AssessmentArea, AreaCheck>>;
  savedAt: number;
}

const AREA_ORDER: AssessmentArea[] = ["foundations", "formation", "intercultural", "strategy", "evangelism"];

// Falls back to an EMPTY second line (never the raw area id like
// "foundations", which is what used to show when a label had no " | ").
function areaLabel(area: AssessmentArea): [string, string] {
  const group = MODULE_GROUPS.find((g) => g.id === area);
  const parts = (group?.label ?? area).split(" | ");
  return [parts[0] ?? area, parts[1] ?? ""];
}

function scrollToQuestion(id: number) {
  setTimeout(() => {
    document.getElementById(`q-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, 80);
}

export default function AssessmentPanel({ userKey = "anon" }: { userKey?: string }) {
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

  // Areas where the person already tried to move on / check while some
  // questions were still empty — those empty questions get highlighted.
  const [flaggedAreas, setFlaggedAreas] = useState<Record<string, boolean>>({});

  // ── Autosave ─────────────────────────────────────────────────────────
  // 100 questions took a long time to answer and a reload wiped everything.
  // Progress is now written to this browser as the person answers, and
  // restored on return. (Device-bound by design: nothing extra is stored on
  // the server for an unfinished assessment.)
  const draftKey = `ghi_assessment_draft_v1:${userKey}`;
  const [hydrated, setHydrated] = useState(false);
  const [restored, setRestored] = useState(false);
  const [lastSaved, setLastSaved] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/assessment")
      .then((r) => r.json())
      .then((data) => {
        const qs: ClientQuestion[] = data.questions ?? [];
        setQuestions(qs);
        setResult(data.result ?? null);
        try {
          if (data.result) {
            window.localStorage.removeItem(draftKey); // already submitted: draft is obsolete
          } else {
            const raw = window.localStorage.getItem(draftKey);
            if (raw) {
              const d = JSON.parse(raw) as Draft;
              const valid = new Set(qs.map((q) => q.id));
              const back: Record<number, number> = {};
              let n = 0;
              for (const [k, v] of Object.entries(d.answers ?? {})) {
                const id = Number(k);
                if (valid.has(id) && typeof v === "number") {
                  back[id] = v;
                  n++;
                }
              }
              if (n > 0) {
                setAnswers(back);
                setPageIndex(Math.min(Math.max(d.pageIndex ?? 0, 0), AREA_ORDER.length - 1));
                setAreaChecks(d.areaChecks ?? {});
                setRestored(true);
              }
            }
          }
        } catch {
          /* corrupt or unavailable storage — start fresh */
        }
        setLoading(false);
        setHydrated(true);
      })
      .catch(() => {
        setLoading(false);
        setHydrated(true);
      });
  }, [draftKey]);

  useEffect(() => {
    if (!hydrated || result) return;
    const t = setTimeout(() => {
      try {
        if (Object.keys(answers).length === 0 && Object.keys(areaChecks).length === 0) {
          window.localStorage.removeItem(draftKey);
          return;
        }
        const d: Draft = { answers, pageIndex, areaChecks, savedAt: Date.now() };
        window.localStorage.setItem(draftKey, JSON.stringify(d));
        setLastSaved(d.savedAt);
      } catch {
        /* storage full/unavailable — non-fatal */
      }
    }, 400);
    return () => clearTimeout(t);
  }, [hydrated, result, answers, pageIndex, areaChecks, draftKey]);

  function startOver() {
    if (
      !window.confirm(
        "Erase your saved answers and start over? · ¿Borrar tus respuestas guardadas y empezar de nuevo?"
      )
    )
      return;
    setAnswers({});
    setAreaChecks({});
    setFlaggedAreas({});
    setPageIndex(0);
    setRestored(false);
    setLastSaved(null);
    try {
      window.localStorage.removeItem(draftKey);
    } catch {
      /* ignore */
    }
  }

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
    try {
      window.localStorage.removeItem(draftKey);
    } catch {
      /* ignore */
    }
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
                      {labelEs && <p className="text-xs text-harvest-textDim">{labelEs}</p>}
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
  const unansweredInArea = areaQuestions.filter((q) => answers[q.id] === undefined);
  const totalQuestions = questions.length || 100;
  const totalAnswered = Object.keys(answers).length;
  const isLastPage = pageIndex === AREA_ORDER.length - 1;
  const currentCheck = areaChecks[currentArea];
  const areaFlagged = !!flaggedAreas[currentArea];

  // Every empty question across the whole test, with where it lives.
  const missingAll = AREA_ORDER.flatMap((area, ai) =>
    questions
      .filter((q) => q.area === area)
      .map((q, qi) => ({ q, qi, ai, area }))
      .filter((x) => answers[x.q.id] === undefined)
  );

  function flagArea(area: AssessmentArea) {
    setFlaggedAreas((p) => ({ ...p, [area]: true }));
  }

  // Leaving an unfinished, unchecked area flags it, so the empty questions
  // are highlighted if the person comes back.
  function goToArea(i: number) {
    if (unansweredInArea.length > 0 && !currentCheck) flagArea(currentArea);
    setPageIndex(i);
  }

  // Checking LOCKS the area's answers (so they can't be changed after the
  // right answers are shown). That made an unanswered question impossible to
  // answer afterwards — so checking now requires the area to be complete.
  function onCheckClick() {
    const first = unansweredInArea[0];
    if (first) {
      flagArea(currentArea);
      scrollToQuestion(first.id);
      return;
    }
    handleCheckArea(currentArea);
  }

  return (
    <div className="flex-1 overflow-y-auto bg-harvest-bg px-4 py-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-4">
          <h2 className="font-serif text-lg font-semibold text-harvest-text">Initial Assessment · Evaluación Inicial</h2>
          <p className="text-xs text-harvest-textDim">
            100 fixed questions, one time only, so your mentor gets to know your theological and missiological baseline. ·
            100 preguntas fijas, una única vez, para que tu mentor conozca tu base teológica y misionológica.
          </p>
          <p className="mt-1 text-[11px] text-harvest-textDim">
            💾 Your progress is saved automatically on this device. · Tu progreso se guarda automáticamente en este
            dispositivo.
            {lastSaved && (
              <span className="opacity-70"> ({new Date(lastSaved).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})</span>
            )}
          </p>
        </div>

        {restored && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-harvest-gold/30 bg-harvest-gold/5 px-4 py-2 text-xs text-harvest-textDim">
            <span>We restored your saved progress. · Restauramos tu progreso guardado.</span>
            <span className="flex gap-3">
              <button onClick={startOver} className="font-semibold text-red-600 hover:underline">
                Start over · Empezar de nuevo
              </button>
              <button onClick={() => setRestored(false)} className="font-semibold text-harvest-goldDeep hover:underline">
                OK
              </button>
            </span>
          </div>
        )}

        {/* Area tabs — the number is HOW MANY YOU ANSWERED; the "score" chip
            only appears after you check that part. */}
        <div className="mb-1 flex flex-wrap gap-1.5">
          {AREA_ORDER.map((area, i) => {
            const count = questions.filter((q) => q.area === area).length;
            const answeredCount = questions.filter((q) => q.area === area && answers[q.id] !== undefined).length;
            const checked = areaChecks[area];
            const active = i === pageIndex;
            return (
              <button
                key={area}
                onClick={() => goToArea(i)}
                title={`Answered ${answeredCount} of ${count} · Respondidas ${answeredCount} de ${count}${
                  checked ? ` — Score · Nota: ${checked.score}/${checked.total}` : ""
                }`}
                className={clsx(
                  "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                  active ? "bg-harvest-gold text-white" : "bg-harvest-panel2 text-harvest-textDim hover:text-harvest-text"
                )}
              >
                {i + 1}. {answeredCount}/{count}
                {checked && (
                  <span
                    className={clsx(
                      "ml-1.5 rounded-full px-1.5 py-0.5 text-[10px]",
                      active ? "bg-white/25 text-white" : "bg-harvest-gold/10 text-harvest-goldDeep"
                    )}
                  >
                    score {checked.score}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <p className="mb-4 text-[11px] text-harvest-textDim">
          Tabs show how many questions you have answered; a “score” appears after you check that part. · Las pestañas
          muestran cuántas preguntas respondiste; al verificar esa parte aparece la “nota”.
        </p>

        <div className="mb-4 rounded-xl border border-harvest-border bg-harvest-panel px-4 py-3 shadow-sm">
          <p className="text-sm font-semibold text-harvest-text">{labelPt}</p>
          {labelEs && <p className="text-xs text-harvest-textDim">{labelEs}</p>}
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
            const showMissing = selected === undefined && areaFlagged && !questionCheck;
            return (
              <div
                key={q.id}
                id={`q-${q.id}`}
                className={clsx(
                  "rounded-2xl border bg-harvest-panel p-5 shadow-sm transition",
                  showMissing ? "border-amber-400 ring-2 ring-amber-200" : "border-harvest-border"
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-harvest-gold/10 px-2.5 py-0.5 text-xs font-bold tracking-wide text-harvest-goldDeep">
                    {qi + 1}/{areaQuestions.length}
                  </span>
                  {showMissing && (
                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                      Unanswered · Sin responder
                    </span>
                  )}
                </div>
                <p className="mt-2 font-semibold text-harvest-text">{q.question_pt}</p>
                <p className="mt-1 text-sm text-harvest-textDim">{q.question_es}</p>

                <div className="mt-3 flex flex-col gap-2">
                  {q.options_pt.map((optPt, oi) => {
                    // Once this area has been checked, color every option:
                    // the actual correct one green, and — if different — the
                    // person's own wrong pick red. Before checking, only the
                    // plain "selected" highlight applies (no colors, since
                    // the correct answer isn't known to the client yet).
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
            onClick={onCheckClick}
            disabled={checking || answeredInArea === 0}
            className={clsx(
              "mt-4 w-full rounded-xl border px-4 py-2.5 text-sm font-semibold transition disabled:opacity-40",
              unansweredInArea.length > 0
                ? "border-amber-400 bg-amber-50 text-amber-700 hover:bg-amber-100"
                : "border-harvest-gold bg-harvest-gold/5 text-harvest-goldDeep hover:bg-harvest-gold/15"
            )}
          >
            {checking
              ? "Checking… · Verificando…"
              : unansweredInArea.length > 0
              ? `Answer all questions to check — ${unansweredInArea.length} left · Responde todas para verificar — faltan ${unansweredInArea.length}`
              : "✓ Check my answers for this part · Verificar mis respuestas de esta parte"}
          </button>
        )}
        {!currentCheck && unansweredInArea.length === 0 && areaQuestions.length > 0 && (
          <p className="mt-1 text-center text-[11px] text-harvest-textDim">
            Checking shows the right answers and locks this part. · Al verificar se muestran las respuestas correctas y esta parte se bloquea.
          </p>
        )}
        {checkError && <p className="mt-2 text-sm text-red-600">{checkError}</p>}

        <div className="mt-5 flex items-center justify-between">
          <button
            onClick={() => goToArea(Math.max(0, pageIndex - 1))}
            disabled={pageIndex === 0}
            className="rounded-full border border-harvest-border px-4 py-2 text-sm text-harvest-textDim transition hover:border-harvest-gold/50 disabled:opacity-30"
          >
            ← Previous · Anterior
          </button>

          {!isLastPage ? (
            <button
              onClick={() => goToArea(Math.min(AREA_ORDER.length - 1, pageIndex + 1))}
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
              {submitting
                ? "Submitting… · Enviando…"
                : `Submit (${totalAnswered}/${totalQuestions} answered) · Enviar (${totalAnswered}/${totalQuestions} respondidas)`}
            </button>
          )}
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        {/* Before: a bare "you have 1 unanswered question" with no way to
            tell WHICH. Now each empty question is a button that jumps to it. */}
        {isLastPage && missingAll.length > 0 && (
          <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800">
            <p>
              You still have {missingAll.length} unanswered {missingAll.length === 1 ? "question" : "questions"} — tap one
              to jump to it. You can submit anyway, but unanswered ones count as wrong. · Aún tienes {missingAll.length}{" "}
              {missingAll.length === 1 ? "pregunta sin responder" : "preguntas sin responder"} — toca una para ir a ella.
              Puedes enviar así, pero las no respondidas cuentan como incorrectas.
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {missingAll.map((m) => (
                <button
                  key={m.q.id}
                  onClick={() => {
                    flagArea(m.area);
                    setPageIndex(m.ai);
                    scrollToQuestion(m.q.id);
                  }}
                  className="rounded-full border border-amber-400 bg-white px-2.5 py-1 font-semibold hover:bg-amber-100"
                >
                  Area {m.ai + 1} · Q{m.qi + 1}
                  {areaChecks[m.area] ? " 🔒" : ""}
                </button>
              ))}
            </div>
            {missingAll.some((m) => areaChecks[m.area]) && (
              <p className="mt-2 opacity-80">
                🔒 = that part was already checked and is locked. · esa parte ya fue verificada y está bloqueada.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Role-play practice for a generated case: the learner plays the missionary, an AI
// facilitator plays everyone else, and "End and get feedback" brings a coach's
// feedback plus the curriculum's recommended approach. The recommended approach is
// never shown (nor sent to the model) before that. All text comes from the caller.

export const SIM_MAX_TURNS = 8; // keep in sync with SIM_MAX_USER_TURNS in lib/caseSimulate.ts

export interface SimLabels {
  cardTitle: string;
  cardText: string;
  cardButton: string;
  title: string;
  back: string;
  scenario: string;
  introText: string;
  langLabel: string;
  start: string;
  starting: string;
  placeholder: string;
  send: string;
  finish: string;
  finishHint: string;
  finishing: string;
  turns: (n: number, max: number) => string;
  limit: string;
  error: string;
  retry: string;
  feedbackTitle: string;
  showCase: string;
  again: string;
  confirmAgain: string;
}

interface Msg {
  role: "user" | "assistant";
  content: string;
  kind?: "feedback";
}
type Action = "start" | "reply" | "finish";

function Markdown({ text }: { text: string }) {
  return (
    <div className="prose-chat">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
    </div>
  );
}

export default function CaseSimulation({
  caseData,
  simKey,
  languages,
  initialLang,
  labels,
  scenario,
  onExit,
}: {
  caseData: unknown;
  simKey: string;
  languages: Array<{ code: string; label: string }>;
  initialLang: string;
  labels: SimLabels;
  scenario: { title?: string; context?: string; challenge?: string };
  onExit: () => void;
}) {
  const storageKey = `ghi_sim_v1:${simKey}`;
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [finished, setFinished] = useState(false);
  const [simLang, setSimLang] = useState(initialLang);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState<Action | null>(null);
  const [error, setError] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  // Resume an earlier practice of this same case, if there is one.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const d = JSON.parse(raw);
        if (Array.isArray(d?.msgs) && d.msgs.length > 0) {
          setMsgs(d.msgs as Msg[]);
          setFinished(!!d.finished);
          if (typeof d.simLang === "string") setSimLang(d.simLang);
        }
      }
    } catch {
      /* corrupt or unavailable storage — start fresh */
    }
    setHydrated(true);
  }, [storageKey]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      if (msgs.length > 0) window.localStorage.setItem(storageKey, JSON.stringify({ msgs, finished, simLang }));
      else window.localStorage.removeItem(storageKey);
    } catch {
      /* non-fatal */
    }
  }, [hydrated, msgs, finished, simLang, storageKey]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs, busy]);

  const userTurns = msgs.filter((m) => m.role === "user").length;
  const started = msgs.length > 0;
  const atLimit = userTurns >= SIM_MAX_TURNS;
  const lastIsUser = msgs.length > 0 && msgs[msgs.length - 1]?.role === "user";

  async function call(action: Action, history: Msg[]): Promise<string | null> {
    setBusy(action);
    setError(false);
    try {
      const res = await fetch("/api/case-study/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          case: caseData,
          history: history.map(({ role, content }) => ({ role, content })),
          lang: simLang,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || typeof data?.reply !== "string") throw new Error(data?.error ?? "failed");
      return data.reply as string;
    } catch {
      setError(true);
      return null;
    } finally {
      setBusy(null);
    }
  }

  async function start() {
    if (busy) return;
    const reply = await call("start", []);
    if (reply) setMsgs([{ role: "assistant", content: reply }]);
  }

  async function reply(history: Msg[]) {
    const r = await call("reply", history);
    if (r) setMsgs([...history, { role: "assistant", content: r }]);
  }

  async function send() {
    const text = input.trim();
    if (!text || busy || finished || atLimit || lastIsUser) return;
    const next: Msg[] = [...msgs, { role: "user", content: text }];
    setMsgs(next);
    setInput("");
    await reply(next);
  }

  async function finish() {
    if (busy || finished || userTurns < 1) return;
    const r = await call("finish", msgs);
    if (r) {
      setMsgs([...msgs, { role: "assistant", content: r, kind: "feedback" }]);
      setFinished(true);
    }
  }

  function again() {
    if (!window.confirm(labels.confirmAgain)) return;
    setMsgs([]);
    setFinished(false);
    setError(false);
    setInput("");
  }

  return (
    <section className="mb-4 rounded-2xl border border-harvest-border bg-harvest-panel p-5 shadow-sm">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-serif text-base font-semibold text-harvest-text">🎭 {labels.title}</h2>
          {scenario.title && <p className="text-xs text-harvest-textDim">{scenario.title}</p>}
        </div>
        <button onClick={onExit} className="text-xs font-semibold text-harvest-goldDeep hover:underline">
          {labels.back}
        </button>
      </div>

      <details open={!started} className="mb-4 rounded-xl border border-harvest-border bg-harvest-panel2 px-4 py-3 text-sm">
        <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-harvest-goldDeep">
          {labels.scenario}
        </summary>
        {scenario.context && <p className="mt-2 leading-relaxed text-harvest-text">{scenario.context}</p>}
        {scenario.challenge && <p className="mt-2 leading-relaxed text-harvest-text">{scenario.challenge}</p>}
      </details>

      {!started ? (
        <div className="rounded-xl border border-harvest-gold/30 bg-harvest-gold/5 p-4">
          <p className="text-sm text-harvest-text">{labels.introText}</p>
          {languages.length > 1 && (
            <label className="mt-3 flex flex-wrap items-center gap-2 text-xs text-harvest-textDim">
              {labels.langLabel}
              <select
                value={simLang}
                onChange={(e) => setSimLang(e.target.value)}
                className="rounded-lg border border-harvest-border bg-harvest-panel px-2 py-1 text-xs outline-none focus:border-harvest-gold"
              >
                {languages.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </select>
            </label>
          )}
          <button
            onClick={start}
            disabled={!!busy}
            className="mt-4 rounded-full bg-harvest-gold px-5 py-2 text-sm font-semibold text-white transition hover:bg-harvest-goldDeep disabled:opacity-50"
          >
            {busy === "start" ? labels.starting : labels.start}
          </button>
          {error && <p className="mt-2 text-xs text-red-600">{labels.error}</p>}
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {msgs.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="flex justify-end">
                  <div className="max-w-[85%] whitespace-pre-wrap rounded-[18px] rounded-br-[4px] bg-harvest-gold px-4 py-2.5 text-sm text-white">
                    {m.content}
                  </div>
                </div>
              ) : m.kind === "feedback" ? (
                <div key={i} className="rounded-2xl border border-harvest-gold/40 bg-harvest-gold/5 p-4 text-sm">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-harvest-goldDeep">
                    ✅ {labels.feedbackTitle}
                  </p>
                  <Markdown text={m.content} />
                </div>
              ) : (
                <div key={i} className="flex justify-start">
                  <div className="max-w-[85%] rounded-[18px] rounded-bl-[4px] border border-harvest-border bg-harvest-bg px-4 py-2.5 text-sm text-harvest-text">
                    <Markdown text={m.content} />
                  </div>
                </div>
              )
            )}
            {busy && busy !== "start" && (
              <div className="flex justify-start">
                <div className="rounded-[18px] rounded-bl-[4px] border border-harvest-border bg-harvest-bg px-4 py-2.5 text-sm text-harvest-textDim">
                  {busy === "finish" ? labels.finishing : "…"}
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {error && (
            <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">
              <span>{labels.error}</span>
              {!finished && (
                <button
                  onClick={() => (lastIsUser ? reply(msgs) : finish())}
                  className="font-semibold underline"
                >
                  {labels.retry}
                </button>
              )}
            </div>
          )}

          {!finished ? (
            <div className="mt-4">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  // Enter sends; Shift+Enter makes a new line; never send while an IME
                  // (Chinese/Japanese input) is still composing a character.
                  if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    send();
                  }
                }}
                disabled={!!busy || atLimit || lastIsUser}
                rows={3}
                maxLength={1500}
                placeholder={labels.placeholder}
                className="w-full resize-none rounded-xl border border-harvest-border bg-harvest-panel2 px-3 py-2 text-sm outline-none focus:border-harvest-gold disabled:opacity-60"
              />
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] text-harvest-textDim">{labels.turns(userTurns, SIM_MAX_TURNS)}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={finish}
                    disabled={!!busy || userTurns < 1 || lastIsUser}
                    title={userTurns < 1 ? labels.finishHint : undefined}
                    className="rounded-full border border-harvest-gold px-4 py-2 text-xs font-semibold text-harvest-goldDeep transition hover:bg-harvest-gold/10 disabled:opacity-40"
                  >
                    {labels.finish}
                  </button>
                  <button
                    onClick={send}
                    disabled={!!busy || !input.trim() || atLimit || lastIsUser}
                    className="rounded-full bg-harvest-gold px-5 py-2 text-sm font-semibold text-white transition hover:bg-harvest-goldDeep disabled:opacity-40"
                  >
                    {labels.send}
                  </button>
                </div>
              </div>
              {atLimit && <p className="mt-2 text-xs text-amber-700">{labels.limit}</p>}
            </div>
          ) : (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                onClick={onExit}
                className="rounded-full bg-harvest-gold px-5 py-2 text-sm font-semibold text-white transition hover:bg-harvest-goldDeep"
              >
                {labels.showCase}
              </button>
              <button
                onClick={again}
                className="rounded-full border border-harvest-border px-4 py-2 text-xs text-harvest-textDim transition hover:border-harvest-gold/50 hover:text-harvest-gold"
              >
                {labels.again}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

"use client";

import { useEffect, useRef, useState, memo } from "react";
import clsx from "clsx";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ChatMessage } from "@/lib/types";
import {
  QUICK_STARTS,
  QUICK_START_DISPLAY_LABEL,
  QUICK_START_DESCRIPTIONS,
  QUICK_START_GROUP_ID,
  MODULE_QUICK_EXPLANATIONS,
  FEATURE_EXPLANATIONS,
  quickStartText,
} from "@/lib/quickStarts";
import { MODULE_GROUPS } from "@/lib/moduleGroups";
import { MODULE_NAMES } from "@/lib/curriculumConfigClient";
import { useSpeechSynthesis } from "@/lib/useSpeech";
import type { ResponseLangMode } from "@/lib/language";

// Wrapped in memo() deliberately: without it, every keystroke in the
// chat input (parent ChatApp's `input` state) re-renders this whole
// list, and react-markdown re-parses EVERY message's markdown from
// scratch on every single keystroke — the lag gets worse as a
// conversation grows longer, which is exactly the symptom a real user
// reported while testing. memo() skips re-rendering when `messages`
// itself hasn't actually changed.
function MessageList({
  messages,
  onQuickStart,
  responseLanguage,
}: {
  messages: ChatMessage[];
  onQuickStart: (label: string) => void;
  responseLanguage: ResponseLangMode;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  const tts = useSpeechSynthesis();

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        {messages.length === 0 && <WelcomeScreen onQuickStart={onQuickStart} />}
        {messages.map((m, i) => (
          <Bubble
            key={i}
            id={String(i)}
            message={m}
            responseLanguage={responseLanguage}
            ttsSupported={tts.isSupported}
            ttsSpeakingId={tts.speakingId}
            onSpeak={tts.speak}
            onStopSpeak={tts.stop}
          />
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}

// A full welcome screen rather than a single centered sentence — the
// prior version left most of the chat pane empty on first load, which
// is wasted space that could instead orient a brand-new missionary
// toward their first action. Cards expand in place (accordion-style) on
// click, showing a fixed, hand-written explanation — of each specialist
// inside a group, or of the Quiz/Case Study feature itself — before the
// person commits to it. This is deliberately NOT AI-generated: static
// copy that costs nothing to render and reads the same every time.
function WelcomeScreen({ onQuickStart }: { onQuickStart: (label: string) => void }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-center gap-6 py-6 text-center">
      <div>
        <div className="mb-2 text-4xl">🌾</div>
        <h1 className="font-serif text-xl text-harvest-gold">Global Harvest Initiative</h1>
        <p className="mt-1 text-sm text-harvest-textDim">
          Pick a card below, one of the 37 modules in the sidebar, or just ask a question.
          <br />
          Elige una tarjeta abajo, uno de los 37 módulos en la barra lateral, o simplemente haz una pregunta.
        </p>
      </div>

      <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
        {QUICK_STARTS.map((label) => {
          const [dispPt, dispEs] = (QUICK_START_DISPLAY_LABEL[label] ?? label).split(" | ");
          const [descPt, descEs] = (QUICK_START_DESCRIPTIONS[label] ?? "").split(" | ");
          const isExpandable = label !== "🌾 Start";
          const isOpen = expanded === label;
          const groupId = QUICK_START_GROUP_ID[label];
          const group = groupId ? MODULE_GROUPS.find((g) => g.id === groupId) : undefined;
          const feature = FEATURE_EXPLANATIONS[label];

          return (
            <div
              key={label}
              className={clsx(
                "flex flex-col rounded-xl border text-left transition",
                isOpen ? "border-harvest-gold/60 bg-harvest-panel2 sm:col-span-2" : "border-harvest-border bg-harvest-panel hover:border-harvest-gold/60 hover:bg-harvest-panel2"
              )}
            >
              <button
                onClick={() => (isExpandable ? setExpanded(isOpen ? null : label) : onQuickStart(label))}
                className="flex flex-col gap-1 p-4"
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-harvest-text">{dispPt}</span>
                  {isExpandable && (
                    <span className="text-xs text-harvest-textDim">{isOpen ? "▲" : "▼"}</span>
                  )}
                </span>
                {dispEs && <span className="text-xs font-medium text-harvest-textDim">{dispEs}</span>}
                <span className="mt-1 text-xs text-harvest-textDim">{descPt}</span>
                {descEs && <span className="text-xs text-harvest-textDim opacity-70">{descEs}</span>}
              </button>

              {isOpen && (
                <div className="border-t border-harvest-border px-4 pb-4 pt-3">
                  {group && (
                    <ul className="mb-3 flex flex-col gap-2 text-left">
                      {group.moduleNums.map((num) => {
                        const [namePt, nameEs] = (MODULE_NAMES[num] ?? "").split(" | ");
                        const [explPt, explEs] = (MODULE_QUICK_EXPLANATIONS[num] ?? "").split(" | ");
                        return (
                          <li key={num} className="text-sm">
                            <span className="font-semibold text-harvest-gold">{num}. {namePt}</span>
                            {nameEs && <span className="text-xs text-harvest-textDim"> · {nameEs}</span>}
                            <p className="text-xs text-harvest-textDim">{explPt}</p>
                            {explEs && <p className="text-xs text-harvest-textDim opacity-70">{explEs}</p>}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  {feature && (
                    <div className="mb-3 flex flex-col gap-1 text-left">
                      {feature.split(" | ").map((part, i) => (
                        <p key={i} className={clsx("text-sm", i === 0 ? "text-harvest-text" : "text-harvest-textDim opacity-80")}>
                          {part}
                        </p>
                      ))}
                    </div>
                  )}
                  {group && (
                    <p className="mb-3 text-xs text-harvest-textDim">
                      💡 Ao entrar no chat, escolha uma das {group.moduleNums.length} especialidades acima na barra
                      lateral para conversar com ela diretamente. · Al entrar al chat, elige una de las{" "}
                      {group.moduleNums.length} especialidades arriba en la barra lateral para hablar directamente
                      con ella.
                    </p>
                  )}
                  <button
                    onClick={() => onQuickStart(label)}
                    className="rounded-lg bg-harvest-goldDeep px-3 py-1.5 text-xs font-semibold text-harvest-bg transition hover:bg-harvest-gold"
                  >
                    Start · Comenzar
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-harvest-textDim">
        Tip: set where you are serving in the sidebar to get recommended modules.
        <br />
        Consejo: define dónde estás sirviendo en la barra lateral para recibir módulos recomendados.
      </p>
    </div>
  );
}

export default memo(MessageList);

// Also memoized: without this, every keystroke re-renders every Bubble
// (one per message) and react-markdown re-parses each one's content
// from scratch, even for old messages that never changed — the actual
// mechanism behind the reported input lag, worse the longer a
// conversation gets.
const Bubble = memo(function Bubble({
  id,
  message,
  responseLanguage,
  ttsSupported,
  ttsSpeakingId,
  onSpeak,
  onStopSpeak,
}: {
  id: string;
  message: ChatMessage;
  responseLanguage: ResponseLangMode;
  ttsSupported: boolean;
  ttsSpeakingId: string | null;
  onSpeak: (id: string, text: string, lang: ResponseLangMode) => void;
  onStopSpeak: () => void;
}) {
  const isUser = message.role === "user";
  const isSpeakingThis = ttsSpeakingId === id;

  return (
    <div className={clsx("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={clsx(
          "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "whitespace-pre-wrap bg-harvest-goldDeep/90 text-harvest-bg"
            : "border border-harvest-border bg-harvest-panel text-harvest-text"
        )}
      >
        {message.content ? (
          isUser ? (
            // User's own input is plain text they typed — never render it
            // as markdown (no reason to interpret literal asterisks etc.
            // they may have typed, and it avoids any injection surface).
            message.content
          ) : (
            // Every agent's system prompt + guardrails consistently
            // produce **bold** section headers (English/Español),
            // bullet lists, and now the Scripture verification block —
            // render it properly instead of showing literal markdown
            // syntax, which is what a plain-text bubble did before.
            <div className="prose-chat">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
            </div>
          )
        ) : (
          <span className="text-harvest-textDim">…</span>
        )}
        {!isUser && !!message.content && ttsSupported && (
          <button
            onClick={() =>
              isSpeakingThis ? onStopSpeak() : onSpeak(id, message.content, responseLanguage)
            }
            className="mt-2 rounded-md border border-white/10 px-2 py-1 text-xs text-harvest-textDim transition hover:border-harvest-gold/50 hover:text-harvest-gold"
            title="Listen to this response · Escuchar esta respuesta"
          >
            {isSpeakingThis ? "⏹ Stop · Detener" : "🔊 Listen · Escuchar"}
          </button>
        )}
      </div>
    </div>
  );
});


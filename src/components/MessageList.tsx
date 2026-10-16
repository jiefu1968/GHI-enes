"use client";

import { Children, Fragment, memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
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
} from "@/lib/quickStarts";
import { suggestionsForModule } from "@/lib/promptSuggestions";
import { MODULE_GROUPS } from "@/lib/moduleGroups";
import { MODULE_NAMES } from "@/lib/curriculumConfigClient";
import { useSpeechSynthesis } from "@/lib/useSpeech";
import type { ResponseLangMode } from "@/lib/language";
import { exportChatToPdf } from "@/lib/pdfExport";
import {
  BR_TOKEN,
  isLocalMessage,
  parseIntro,
  plainFromBreaks,
  protectLineBreaks,
  stripAttachmentBlock,
} from "@/lib/chatLocal";
import type { IntroTarget } from "@/lib/chatLocal";

// Wrapped in memo() deliberately: without it, every keystroke in the
// chat input (parent ChatApp's `input` state) re-renders this whole
// list, and react-markdown re-parses EVERY message's markdown from
// scratch on every single keystroke — the lag gets worse as a
// conversation grows longer. memo() skips re-rendering when `messages`
// itself hasn't actually changed. Every callback handed to <Bubble> below
// is therefore kept referentially stable (refs + useCallback), otherwise
// memo() on Bubble would be defeated on every streamed token.
function MessageList({
  messages,
  onQuickStart,
  responseLanguage,
  selectedModule,
  onSendSuggestion,
  streaming = false,
}: {
  messages: ChatMessage[];
  onQuickStart: (label: string) => void;
  responseLanguage: ResponseLangMode;
  selectedModule: number | null;
  onSendSuggestion: (text: string) => void;
  streaming?: boolean;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  const tts = useSpeechSynthesis();

  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const sendRef = useRef(onSendSuggestion);
  sendRef.current = onSendSuggestion;
  const stableSend = useCallback((text: string) => sendRef.current(text), []);

  // Exports ONE answer (plus the question that prompted it) as a PDF — the
  // per-response counterpart of the whole-conversation button in the header.
  const handleExportPdf = useCallback((id: string) => {
    const list = messagesRef.current;
    const idx = Number(id);
    const msg = list[idx];
    if (!msg) return;
    const prev = idx > 0 ? list[idx - 1] : undefined;
    const subset: ChatMessage[] =
      prev && prev.role === "user" && !isLocalMessage(prev)
        ? [{ ...prev, content: stripAttachmentBlock(prev.content) || prev.content }, msg]
        : [msg];
    exportChatToPdf(subset, undefined);
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto bg-harvest-bg px-4 py-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        {messages.length === 0 &&
          (selectedModule !== null ? (
            <ModuleWelcome moduleNum={selectedModule} onSend={stableSend} />
          ) : (
            <WelcomeScreen onQuickStart={onQuickStart} />
          ))}
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
            onExportPdf={handleExportPdf}
            onSuggest={stableSend}
            actionsDisabled={streaming && i === messages.length - 1}
          />
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}

// Shown instead of the generic WelcomeScreen once a specific specialist
// is selected but the conversation is still empty — the single most
// common moment someone doesn't know what to ask ("I picked this
// module... now what?"). Offers a handful of one-click example
// questions, generated from PROMPT_SUGGESTION_TEMPLATES with this
// module's own name filled in (see lib/promptSuggestions.ts).
function ModuleWelcome({ moduleNum, onSend }: { moduleNum: number; onSend: (text: string) => void }) {
  const [namePt, nameEs] = (MODULE_NAMES[moduleNum] ?? `Module ${moduleNum}`).split(" | ");
  const [explPt, explEs] = (MODULE_QUICK_EXPLANATIONS[moduleNum] ?? "").split(" | ");
  const templates = suggestionsForModule(moduleNum);

  return (
    <div className="flex flex-col items-center gap-5 py-6 text-center">
      <div>
        <p className="text-xs uppercase tracking-wide text-harvest-textDim">
          Module {moduleNum} · Módulo {moduleNum}
        </p>
        <h1 className="font-serif text-lg font-semibold text-harvest-text">{namePt}</h1>
        {nameEs && <p className="text-sm text-harvest-textDim">{nameEs}</p>}
        {explPt && <p className="mx-auto mt-2 max-w-md text-xs text-harvest-textDim">{explPt}</p>}
        {explEs && <p className="mx-auto text-xs text-harvest-textDim opacity-70">{explEs}</p>}
      </div>

      <div className="flex w-full max-w-md flex-col gap-2">
        <p className="text-left text-xs font-semibold uppercase tracking-wide text-harvest-textDim">
          Not sure what to ask? Try one of these · ¿No sabes qué preguntar? Prueba una de estas
        </p>
        {templates.map((tpl, i) => {
          const fillEn = namePt ?? `Module ${moduleNum}`;
          const fillEs = nameEs ?? fillEn;
          const textEn = tpl.en.replace("{module}", fillEn);
          const textEs = tpl.es.replace("{module}", fillEs);
          return (
            <button
              key={i}
              onClick={() => onSend(textEn)}
              className="rounded-2xl border border-harvest-border bg-harvest-panel px-4 py-3 text-left text-sm shadow-sm transition hover:border-harvest-gold/50 hover:shadow-md"
            >
              <span className="block text-harvest-text">💬 {textEn}</span>
              <span className="block text-xs text-harvest-textDim">{textEs}</span>
            </button>
          );
        })}
      </div>

      <p className="max-w-md text-xs text-harvest-textDim">
        Or just type your own question below, in any language.
        <br />
        O simplemente escribe tu propia pregunta abajo, en cualquier idioma.
      </p>
    </div>
  );
}

// A full welcome screen rather than a single centered sentence. Cards expand
// in place (accordion-style) on click, showing a fixed, hand-written
// explanation — of each specialist inside a group, or of the Quiz/Case Study
// feature itself — before the person commits to it. This is deliberately NOT
// AI-generated: static copy that costs nothing to render.
function WelcomeScreen({ onQuickStart }: { onQuickStart: (label: string) => void }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-center gap-6 py-6 text-center">
      <div>
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-harvest-gold">
          <span className="font-serif text-lg font-bold tracking-tight text-white">GHI</span>
        </div>
        <h1 className="font-serif text-xl font-semibold text-harvest-text">Global Harvest Initiative</h1>
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
                "flex flex-col rounded-2xl border text-left shadow-sm transition",
                isOpen ? "border-harvest-gold/50 bg-harvest-panel2 sm:col-span-2" : "border-harvest-border bg-harvest-panel hover:border-harvest-gold/50 hover:bg-harvest-panel2"
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
                            <span className="font-semibold text-harvest-goldDeep">{num}. {namePt}</span>
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
                      💡 Once in chat, choose one of the {group.moduleNums.length} specialists above in the sidebar
                      to talk to them directly. · Al entrar al chat, elige una de las{" "}
                      {group.moduleNums.length} especialidades arriba en la barra lateral para hablar directamente
                      con ella.
                    </p>
                  )}
                  <button
                    onClick={() => onQuickStart(label)}
                    className="rounded-full bg-harvest-gold px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-harvest-goldDeep"
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

// "Now talking to…" card. Inserted by ChatApp when the person picks a
// different specialist / group / the Coordinator in the middle of an existing
// conversation — before this, that click changed nothing visible, and people
// concluded the app (or the agent) was broken. Static copy + the same
// one-click starter questions as ModuleWelcome: zero AI cost, instant.
function AgentIntroCard({ target, onSuggest }: { target: IntroTarget; onSuggest: (text: string) => void }) {
  const shell = "mx-auto w-full max-w-xl rounded-2xl border border-harvest-gold/30 bg-harvest-gold/5 px-4 py-3 text-sm";
  const kicker = "text-[11px] font-semibold uppercase tracking-wide text-harvest-goldDeep";

  if (target.kind === "coordinator") {
    return (
      <div className={shell}>
        <p className={kicker}>Now talking to · Ahora hablas con</p>
        <p className="mt-1 font-semibold text-harvest-text">Coordinator · Coordinador</p>
        <p className="mt-1 text-xs text-harvest-textDim">
          Ask anything — your question is routed to the best specialist for it.
        </p>
        <p className="text-xs text-harvest-textDim opacity-70">
          Pregunta lo que quieras: tu pregunta se envía al especialista más adecuado.
        </p>
      </div>
    );
  }

  if (target.kind === "group") {
    const group = MODULE_GROUPS.find((g) => g.id === target.groupId);
    const [gEn, gEs] = (group?.label ?? target.groupId).split(" | ");
    return (
      <div className={shell}>
        <p className={kicker}>Chat scope · Alcance del chat</p>
        <p className="mt-1 font-semibold text-harvest-text">
          {gEn} {gEs && <span className="font-normal text-harvest-textDim">· {gEs}</span>}
        </p>
        <p className="mt-1 text-xs text-harvest-textDim">
          Your questions will be answered by the {group?.moduleNums.length ?? ""} specialists in this group.
        </p>
        <p className="text-xs text-harvest-textDim opacity-70">
          Tus preguntas serán respondidas por los especialistas de este grupo.
        </p>
      </div>
    );
  }

  const n = target.moduleNum;
  const [nameEn, nameEs] = (MODULE_NAMES[n] ?? `Module ${n}`).split(" | ");
  const [explEn, explEs] = (MODULE_QUICK_EXPLANATIONS[n] ?? "").split(" | ");
  const templates = suggestionsForModule(n).slice(0, 5);

  return (
    <div className={shell}>
      <p className={kicker}>Now talking to · Ahora hablas con</p>
      <p className="mt-1 font-semibold text-harvest-text">
        {n}. {nameEn} {nameEs && <span className="font-normal text-harvest-textDim">· {nameEs}</span>}
      </p>
      {explEn && <p className="mt-1 text-xs text-harvest-textDim">{explEn}</p>}
      {explEs && <p className="text-xs text-harvest-textDim opacity-70">{explEs}</p>}
      {templates.length > 0 && (
        <>
          <p className={clsx(kicker, "mt-3")}>Try asking · Prueba preguntar</p>
          <div className="mt-1.5 flex flex-col gap-1.5">
            {templates.map((tpl, i) => {
              const fillEn = nameEn ?? `Module ${n}`;
              const fillEs = nameEs ?? fillEn;
              const textEn = tpl.en.replace("{module}", fillEn);
              const textEs = tpl.es.replace("{module}", fillEs);
              return (
                <button
                  key={i}
                  onClick={() => onSuggest(textEn)}
                  className="rounded-xl border border-harvest-border bg-harvest-panel px-3 py-2 text-left text-xs transition hover:border-harvest-gold/50 hover:shadow-sm"
                >
                  <span className="block text-harvest-text">💬 {textEn}</span>
                  <span className="block text-harvest-textDim">{textEs}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default memo(MessageList);

// Turns the BR token (see lib/chatLocal.ts) back into real line breaks inside
// paragraphs, list items and table cells — where models love to use <br>.
function withBreaks(children: ReactNode): ReactNode {
  return Children.map(children, (child) => {
    if (typeof child !== "string" || !child.includes(BR_TOKEN)) return child;
    const parts = child.split(BR_TOKEN);
    return (
      <Fragment>
        {parts.map((p, i) => (
          <Fragment key={i}>
            {p}
            {i < parts.length - 1 && <br />}
          </Fragment>
        ))}
      </Fragment>
    );
  });
}
const MD_COMPONENTS: any = {
  p: ({ node, children, ...rest }: any) => <p {...rest}>{withBreaks(children)}</p>,
  li: ({ node, children, ...rest }: any) => <li {...rest}>{withBreaks(children)}</li>,
  td: ({ node, children, ...rest }: any) => <td {...rest}>{withBreaks(children)}</td>,
  th: ({ node, children, ...rest }: any) => <th {...rest}>{withBreaks(children)}</th>,
};

const ACTION_BTN =
  "rounded-full border border-harvest-border px-2.5 py-1 text-xs text-harvest-textDim transition hover:border-harvest-gold/50 hover:text-harvest-gold";

// Also memoized: without this, every keystroke re-renders every Bubble
// (one per message) and react-markdown re-parses each one's content from
// scratch, even for old messages that never changed.
//
// VISUAL NOTE: asymmetric corner radii (sharp on the "pointing" corner)
// plus a solid indigo fill for the user's own bubble, and a plain white
// card with a soft shadow for the assistant's.
const Bubble = memo(function Bubble({
  id,
  message,
  responseLanguage,
  ttsSupported,
  ttsSpeakingId,
  onSpeak,
  onStopSpeak,
  onExportPdf,
  onSuggest,
  actionsDisabled,
}: {
  id: string;
  message: ChatMessage;
  responseLanguage: ResponseLangMode;
  ttsSupported: boolean;
  ttsSpeakingId: string | null;
  onSpeak: (id: string, text: string, lang: ResponseLangMode) => void;
  onStopSpeak: () => void;
  onExportPdf: (id: string) => void;
  onSuggest: (text: string) => void;
  actionsDisabled: boolean;
}) {
  const isUser = message.role === "user";
  const isSpeakingThis = ttsSpeakingId === id;
  const bodyRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const safeContent = useMemo(() => protectLineBreaks(message.content), [message.content]);
  const intro = parseIntro(message.content);

  if (intro) return <AgentIntroCard target={intro} onSuggest={onSuggest} />;

  // Copies the RENDERED answer as rich HTML (+ plain text fallback), so
  // pasting into Word/Docs keeps headings, lists and — importantly — tables.
  async function handleCopy() {
    const el = bodyRef.current;
    if (!el) return;
    const clone = el.cloneNode(true) as HTMLElement;
    clone.querySelectorAll("table").forEach((t) => {
      t.setAttribute("border", "1");
      t.setAttribute("cellpadding", "6");
      (t as HTMLElement).style.borderCollapse = "collapse";
    });
    const html = clone.innerHTML;
    const text = el.innerText;
    try {
      if (navigator.clipboard && typeof ClipboardItem !== "undefined") {
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/html": new Blob([html], { type: "text/html" }),
            "text/plain": new Blob([text], { type: "text/plain" }),
          }),
        ]);
      } else {
        await navigator.clipboard.writeText(text);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      try {
        await navigator.clipboard.writeText(plainFromBreaks(message.content));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        /* clipboard unavailable — nothing more we can do */
      }
    }
  }

  return (
    <div className={clsx("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={clsx(
          "max-w-[85%] px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "whitespace-pre-wrap rounded-[18px] rounded-br-[4px] bg-harvest-gold text-white"
            : "rounded-[18px] rounded-bl-[4px] bg-harvest-panel text-harvest-text shadow-sm"
        )}
      >
        {message.content ? (
          isUser ? (
            message.content
          ) : (
            <div className="prose-chat" ref={bodyRef}>
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD_COMPONENTS}>
                {safeContent}
              </ReactMarkdown>
            </div>
          )
        ) : (
          <span className="text-harvest-textDim">…</span>
        )}
        {!isUser && !!message.content && !actionsDisabled && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            <button
              onClick={handleCopy}
              className={ACTION_BTN}
              title="Copy this response — tables stay intact when pasted into Word · Copiar esta respuesta: las tablas se conservan al pegar en Word"
            >
              {copied ? "✓ Copied · Copiado" : "📋 Copy · Copiar"}
            </button>
            <button
              onClick={() => onExportPdf(id)}
              className={ACTION_BTN}
              title="Download this question and answer as PDF · Descargar esta pregunta y respuesta en PDF"
            >
              📄 PDF
            </button>
            {ttsSupported && (
              <button
                onClick={() =>
                  isSpeakingThis ? onStopSpeak() : onSpeak(id, plainFromBreaks(message.content), responseLanguage)
                }
                className={ACTION_BTN}
                title="Listen to this response · Escuchar esta respuesta"
              >
                {isSpeakingThis ? "⏹ Stop · Detener" : "🔊 Listen · Escuchar"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

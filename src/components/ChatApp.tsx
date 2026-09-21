"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import Sidebar from "./Sidebar";
import MessageList from "./MessageList";
import QuizPanel from "./QuizPanel";
import CaseStudyPanel from "./CaseStudyPanel";
import AssessmentPanel from "./AssessmentPanel";
import { AGENT_META } from "@/lib/agentsMeta";
import { quickStartText, QUICK_START_VIEW, QUICK_START_GROUP_ID, STATIC_WELCOME_MESSAGE } from "@/lib/quickStarts";
import { MODULE_GROUPS } from "@/lib/moduleGroups";
import type { ChatMessage } from "@/lib/types";
import { LANGUAGE_LABELS, type ResponseLangMode } from "@/lib/language";
import { exportChatToPdf } from "@/lib/pdfExport";
import { useSpeechRecognition } from "@/lib/useSpeech";

interface Props {
  missionaryName: string | null;
  missionaryId: string | null;
}

export default function ChatApp({ missionaryName: initialName }: Props) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{ name: string; text: string; truncated: boolean } | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeAgent, setActiveAgent] = useState("orchestrator");
  const [selectedModule, setSelectedModule] = useState<number | null>(null);
  // On phone-width screens the sidebar becomes a slide-in drawer instead
  // of a permanent side-by-side column — see the layout below. Closed by
  // default; opened via the hamburger button in the header.
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  // When set, free-text questions sent to the orchestrator are restricted
  // to this sidebar group's modules (see lib/moduleGroups.ts and
  // Sidebar's group headers) — cleared whenever a specific module or the
  // bare orchestrator is picked directly.
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [groupModules, setGroupModules] = useState<number[] | null>(null);
  // Separate from `activeAgent` on purpose: `activeAgent` drives what
  // gets SENT as `selectedAgent` on the next request (routing
  // continuity — e.g. staying on a chosen module). `lastAgentKey` is
  // purely a display of who ACTUALLY answered, read from the
  // X-Agent-Key response header. They can legitimately differ — e.g.
  // a one-off quiz-keyword message routes server-side to quiz_master
  // (see routeToAgent in src/lib/routing.ts) without that persona
  // "sticking" for the next unrelated question, which syncing this
  // into `activeAgent` itself would cause. See PROGRESS.md, "QA
  // session #5", for the bug this fixes (Sidebar could silently show
  // the wrong agent as active).
  const [lastAgentKey, setLastAgentKey] = useState<string | null>(null);
  const [missionaryName, setMissionaryName] = useState(initialName);
  const [view, setView] = useState<"chat" | "quiz" | "case" | "assessment">("chat");
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [view, activeAgent, selectedModule]);
  // Persisted so the missionary's choice survives a page reload — "auto"
  // (the original behavior: detect their language, answer in it + English
  // + Chinese) unless they've explicitly pinned one language before.
  const [responseLanguage, setResponseLanguage] = useState<ResponseLangMode>("auto");
  const speechRecognition = useSpeechRecognition(responseLanguage);
  useEffect(() => {
    const saved = window.localStorage.getItem("harvest_response_language");
    if (saved === "auto" || saved === "pt" || saved === "es") {
      setResponseLanguage(saved);
    }
  }, []);
  useEffect(() => {
    window.localStorage.setItem("harvest_response_language", responseLanguage);
  }, [responseLanguage]);
  const abortRef = useRef<AbortController | null>(null);

  // Pick up any mentor broadcast/direct messages once per load.
  useEffect(() => {
    fetch("/api/mentor/messages/undelivered")
      .then((r) => r.json())
      .then((data) => {
        const msgs = data?.messages ?? [];
        if (msgs.length > 0) {
          setMessages((prev) => [
            ...prev,
            ...msgs.map((m: { content: string }) => ({
              role: "assistant" as const,
              content: `📬 **Mensagem do seu mentor · Mensaje de tu mentor:**\n\n${m.content}`,
            })),
          ]);
        }
      })
      .catch(() => {});
  }, []);

  // Wrapped in useCallback so this function's reference only changes
  // when something it actually depends on changes — NOT on every
  // keystroke of `input` (input isn't a dependency here at all). This
  // matters because `send` flows into `onQuickStart`, passed to the
  // now-memoized <Sidebar>: without a stable reference, memo() on
  // Sidebar would be defeated (a "changed" prop on every render), and
  // the whole sidebar — 22 modules worth of list items — would keep
  // re-rendering on every single keystroke, contributing to the input
  // lag a real user reported while testing.
  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if ((!trimmed && !attachedFile) || streaming) return;

      // Attachment goes in as a clearly delimited block ahead of
      // whatever the missionary typed — visible in the chat history
      // exactly as sent, so there's never a mismatch between what's
      // shown and what the model actually received. An attachment with
      // no typed question still gets a reasonable default prompt.
      const attachmentBlock = attachedFile
        ? `[Attached file: ${attachedFile.name}${attachedFile.truncated ? " — truncated to the first ~8,000 characters" : ""}]\n${attachedFile.text}\n[End of attached file]\n\n`
        : "";
      const combined = attachmentBlock + (trimmed || "Please review the attached file and share your thoughts.");

      const nextHistory = [...messages, { role: "user" as const, content: combined }];
      setMessages(nextHistory);
      setInput("");
      setAttachedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: combined,
            history: messages,
            selectedModule,
            selectedAgent: activeAgent,
            responseLanguage,
            groupModules: groupModules ?? undefined,
          }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          const errText = await res.text().catch(() => "Request failed");
          setMessages((prev) => {
            const copy = [...prev];
            copy[copy.length - 1] = { role: "assistant", content: `⚠️ ${errText}` };
            return copy;
          });
          return;
        }

        // Truth of who actually answered, independent of what we asked
        // for — see the `lastAgentKey` declaration above for why this is
        // kept separate from `activeAgent` rather than overwriting it.
        setLastAgentKey(res.headers.get("X-Agent-Key"));

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let acc = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += decoder.decode(value, { stream: true });
          setMessages((prev) => {
            const copy = [...prev];
            copy[copy.length - 1] = { role: "assistant", content: acc };
            return copy;
          });
        }
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          setMessages((prev) => {
            const copy = [...prev];
            copy[copy.length - 1] = { role: "assistant", content: `⚠️ Error: ${String(e)}` };
            return copy;
          });
        }
      } finally {
        setStreaming(false);
      }
    },
    [messages, streaming, selectedModule, activeAgent, responseLanguage, groupModules, attachedFile]
  );

  const handleFileSelect = useCallback(async (file: File) => {
    setUploadError(null);
    setUploadingFile(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setUploadError(data?.error ?? "Could not read that file. · No se pudo leer ese archivo.");
        return;
      }
      setAttachedFile({ name: file.name, text: data.text, truncated: !!data.truncated });
    } catch {
      setUploadError("Upload failed — check your connection and try again. · Error al subir — revisa tu conexión e intenta de nuevo.");
    } finally {
      setUploadingFile(false);
    }
  }, []);

  const removeAttachedFile = useCallback(() => {
    setAttachedFile(null);
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const identify = useCallback(async (name: string) => {
    const res = await fetch("/api/session/identify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) setMissionaryName(name);
  }, []);

  // A stable wrapper around send() specifically for the Sidebar's
  // quick-start buttons — see the comment on `send` above for why a
  // stable reference matters here. Some labels jump straight to the
  // Quiz/Case Study tabs, some scope the chat to a sidebar group before
  // sending an opening prompt — see lib/quickStarts.ts for the mapping.
  const handleQuickStart = useCallback(
    (label: string) => {
      const targetView = QUICK_START_VIEW[label];
      if (targetView) {
        setView(targetView);
        return;
      }
      // "Start" is a short, fixed pitch for the platform — shown instantly,
      // with no API call, so it can never balloon into a long AI-generated
      // curriculum walkthrough. See quickStarts.ts's STATIC_WELCOME_MESSAGE.
      if (label === "🌾 Start") {
        setMessages((prev) => [...prev, { role: "assistant", content: STATIC_WELCOME_MESSAGE }]);
        return;
      }
      // The 5 group cards just navigate to Chat, scoped to that group —
      // they used to also auto-send an opening question to the AI (see
      // quickStartText), but that meant every click cost a real API call
      // just to land on the chat. Now the person arrives with the group
      // already filtered and types their own first question when ready.
      const groupId = QUICK_START_GROUP_ID[label];
      if (groupId) {
        const group = MODULE_GROUPS.find((g) => g.id === groupId);
        if (group) {
          setSelectedGroupId(group.id);
          setGroupModules(group.moduleNums);
          setSelectedModule(null);
          setActiveAgent("orchestrator");
        }
        setView("chat");
      }
    },
    []
  );

  // Resets everything back to the initial welcome-screen state — view,
  // active agent/module/group scope, and clears the conversation itself.
  // A dedicated "go home" action, distinct from the chat's own
  // "Limpar/Limpiar" button (which only clears messages, keeping
  // whatever module/agent was selected) — this one also drops any
  // module/group selection so the welcome screen's cards show again.
  const goHome = useCallback(() => {
    setView("chat");
    setMessages([]);
    setActiveAgent("orchestrator");
    setSelectedModule(null);
    setSelectedGroupId(null);
    setGroupModules(null);
  }, []);

  // Picking a specific module or the bare orchestrator overrides/clears
  // any active group scope — a direct single-agent choice always wins
  // over the broader "restrict free text to this group" filter.
  const handleSelectAgent = useCallback((key: string) => {
    setActiveAgent(key);
    setSelectedGroupId(null);
    setGroupModules(null);
  }, []);
  const handleSelectModule = useCallback((mod: number | null) => {
    setSelectedModule(mod);
    if (mod !== null) {
      setSelectedGroupId(null);
      setGroupModules(null);
    }
  }, []);
  // Clicking a sidebar group header: free-text questions to the
  // orchestrator are now restricted to that group's specialists — see
  // lib/moduleGroups.ts. Clicking the same (already-active) group again
  // clears the restriction. Any specific module inside the group can
  // still be picked directly as before.
  const handleSelectGroup = useCallback(
    (groupId: string, moduleNums: number[]) => {
      const nowActive = selectedGroupId !== groupId;
      setSelectedGroupId(nowActive ? groupId : null);
      setGroupModules(nowActive ? moduleNums : null);
      setSelectedModule(null);
      setActiveAgent("orchestrator");
    },
    [selectedGroupId]
  );

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Backdrop — tapping outside the open drawer closes it (mobile only,
          the drawer itself is always "open"/static from md: up so this
          backdrop is never rendered there). */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
      <div
        className={clsx(
          "fixed inset-y-0 left-0 z-40 transition-transform duration-200 ease-out md:static md:z-auto md:translate-x-0",
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <Sidebar
          activeAgent={activeAgent}
          selectedModule={selectedModule}
          onSelectAgent={handleSelectAgent}
          onSelectModule={handleSelectModule}
          selectedGroupId={selectedGroupId}
          onSelectGroup={handleSelectGroup}
          onQuickStart={handleQuickStart}
          missionaryName={missionaryName}
          onIdentify={identify}
          view={view}
          onChangeView={setView}
        />
      </div>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center justify-between gap-y-1 border-b border-harvest-border bg-harvest-panel px-4 py-2">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="shrink-0 rounded-lg p-1.5 text-harvest-textDim hover:bg-harvest-panel2 hover:text-harvest-text md:hidden"
              aria-label="Abrir menu · Abrir menú"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
              </svg>
            </button>
            <button
              onClick={goHome}
              className="shrink-0 rounded-lg p-1.5 text-harvest-textDim hover:bg-harvest-panel2 hover:text-harvest-gold"
              title="Back to home · Volver al inicio"
              aria-label="Back to home · Volver al inicio"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 11l9-8 9 8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M5 10v10h14V10" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <p className="truncate text-sm text-harvest-textDim">
              {view === "chat" && "Research Chat · Chat de Investigación"}
              {view === "quiz" && "Quiz · Evaluación"}
              {view === "case" && "Case Studies · Estudios de Caso"}
              {view === "assessment" && "Initial Assessment · Diagnóstico Inicial"}
            </p>
            {/* Truth of who last actually answered — can legitimately
                differ from the Sidebar's selection (e.g. a one-off quiz
                keyword routed to quiz_master); see `lastAgentKey` above.
                Shown as its own badge rather than fighting the
                Sidebar's click-to-select highlighting. */}
            {view === "chat" && lastAgentKey && (
              <span className="flex max-w-[45vw] items-center gap-1 rounded-full border border-white/10 bg-harvest-panel2 px-2 py-0.5 text-xs text-harvest-textDim md:max-w-none">
                <span className="shrink-0">{AGENT_META[lastAgentKey]?.emoji ?? "🤖"}</span>
                <span className="truncate">Respondido por {AGENT_META[lastAgentKey]?.name ?? lastAgentKey}</span>
              </span>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {view === "chat" && messages.length > 0 && (
              <>
                <button
                  onClick={() => exportChatToPdf(messages, lastAgentKey ? AGENT_META[lastAgentKey]?.name : undefined)}
                  className="text-xs text-harvest-textDim hover:text-harvest-gold"
                  title="Baixar esta conversa em PDF · Descargar esta conversación en PDF"
                >
                  📄 PDF
                </button>
                <button
                  onClick={() => setMessages([])}
                  className="text-xs text-harvest-textDim hover:text-harvest-gold"
                  title="Apaga toda a conversa · Borra toda la conversación"
                >
                  🗑️ Clear · Limpiar
                </button>
              </>
            )}
            <button onClick={logout} className="text-xs text-harvest-textDim hover:text-harvest-gold">
              Sign out · Salir
            </button>
          </div>
        </header>

        {view === "chat" && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-b border-harvest-border bg-harvest-panel px-4 py-2">
            <label className="text-xs text-harvest-textDim">Idioma da resposta · Idioma de respuesta</label>
            <select
              value={responseLanguage}
              onChange={(e) => setResponseLanguage(e.target.value as ResponseLangMode)}
              className="rounded-lg border border-white/10 bg-harvest-panel2 px-2 py-1 text-xs outline-none focus:border-harvest-gold"
            >
              <option value="auto">Auto (English + Español)</option>
              <option value="pt">{LANGUAGE_LABELS.pt} only</option>
              <option value="es">{LANGUAGE_LABELS.es} only</option>
            </select>
          </div>
        )}

        {view === "chat" && (
          <>
            <MessageList
              messages={messages}
              onQuickStart={handleQuickStart}
              responseLanguage={responseLanguage}
              selectedModule={selectedModule}
              onSendSuggestion={send}
            />
            {(attachedFile || uploadingFile || uploadError) && (
              <div className="flex items-center gap-2 border-t border-harvest-border bg-harvest-panel px-3 pt-3 text-xs">
                {uploadingFile && (
                  <span className="text-harvest-textDim">📎 Reading file… · Leyendo archivo…</span>
                )}
                {attachedFile && !uploadingFile && (
                  <span className="flex items-center gap-2 rounded-lg border border-white/10 bg-harvest-panel2 px-2 py-1 text-harvest-textDim">
                    📎 {attachedFile.name}
                    {attachedFile.truncated && (
                      <span className="text-harvest-gold" title="Only the first ~8,000 characters were used · Solo se usaron los primeros ~8,000 caracteres">
                        (truncated)
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={removeAttachedFile}
                      className="text-harvest-textDim hover:text-red-300"
                      title="Remove attachment · Quitar archivo"
                    >
                      ✕
                    </button>
                  </span>
                )}
                {uploadError && <span className="text-red-300">⚠️ {uploadError}</span>}
              </div>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="flex gap-2 border-t border-harvest-border bg-harvest-panel p-3"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt,image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={streaming || uploadingFile}
                className="shrink-0 rounded-lg border border-white/10 bg-harvest-panel2 px-3 py-2 text-sm text-harvest-textDim transition hover:border-harvest-gold/50 hover:text-harvest-gold disabled:opacity-40"
                title="Attach a PDF, Word doc, text file, or image · Adjuntar un PDF, Word, texto o imagen"
              >
                📎
              </button>
              {speechRecognition.isSupported && (
                <button
                  type="button"
                  onClick={() =>
                    speechRecognition.isListening
                      ? speechRecognition.stop()
                      : speechRecognition.start((text) => setInput((prev) => (prev ? `${prev} ${text}` : text)))
                  }
                  className={`shrink-0 rounded-lg border px-3 py-2 text-sm transition ${
                    speechRecognition.isListening
                      ? "animate-pulse border-red-500 bg-red-950/40 text-red-300"
                      : "border-white/10 bg-harvest-panel2 text-harvest-textDim hover:border-harvest-gold/50 hover:text-harvest-gold"
                  }`}
                  title="Speak instead of typing · Hablar en vez de escribir"
                >
                  {speechRecognition.isListening ? "🔴" : "🎤"}
                </button>
              )}
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything · Pregunta lo que quieras"
                className="min-w-0 flex-1 rounded-lg border border-white/10 bg-harvest-panel2 px-3 py-2 text-sm outline-none focus:border-harvest-gold"
                disabled={streaming}
              />
              <button
                type="submit"
                disabled={streaming || (!input.trim() && !attachedFile)}
                className="rounded-lg bg-harvest-goldDeep px-4 py-2 text-sm font-semibold text-harvest-bg transition hover:bg-harvest-gold disabled:opacity-40"
              >
                {streaming ? "…" : "Send"}
              </button>
            </form>
          </>
        )}

        {view === "quiz" && <QuizPanel selectedModule={selectedModule} />}
        {view === "case" && <CaseStudyPanel selectedModule={selectedModule} />}
        {view === "assessment" && <AssessmentPanel />}
      </main>
    </div>
  );
}

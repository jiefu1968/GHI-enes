"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Missionary {
  id: string;
  name: string;
  createdAt: string;
  lastHumanContactAt: string | null;
  contactHealth: "recent" | "due" | "overdue" | "never";
  entryAssessment: { totalScore: number } | null;
}
interface Flag {
  id: number;
  missionaryId: string;
  missionary: { name: string } | null; // API nests it under `missionary.name`, not a flat `name` field — see /api/mentor/flags (listUrgentFlags in src/lib/mentor.ts)
  message: string;
  reason: string;
  timestamp: string;
}

export default function MentorDashboard() {
  const router = useRouter();
  const [missionaries, setMissionaries] = useState<Missionary[]>([]);
  const [flags, setFlags] = useState<Flag[]>([]);
  const [selected, setSelected] = useState<Missionary | null>(null);
  const [digest, setDigest] = useState<string | null>(null);
  const [digestLoading, setDigestLoading] = useState(false);
  const [broadcast, setBroadcast] = useState("");
  const [directMsg, setDirectMsg] = useState("");

  async function refresh() {
    const [rosterRes, flagsRes] = await Promise.all([fetch("/api/mentor/roster"), fetch("/api/mentor/flags")]);
    const roster = await rosterRes.json();
    const flagData = await flagsRes.json();
    setMissionaries(roster.missionaries ?? []);
    setFlags(flagData.flags ?? []);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function loadDigest(m: Missionary) {
    setSelected(m);
    setDigest(null);
    setDigestLoading(true);
    const res = await fetch("/api/mentor/digest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ missionaryId: m.id, missionaryName: m.name }),
    });
    const data = await res.json();
    setDigest(data.summary ?? "No digest available.");
    setDigestLoading(false);
  }

  async function resolveFlag(id: number) {
    await fetch(`/api/mentor/flags/${id}/resolve`, { method: "POST" });
    refresh();
  }

  async function logHumanContact(missionaryId: string) {
    await fetch("/api/mentor/human-contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ missionaryId }),
    });
    refresh();
  }

  // Health badge is deliberately a nudge, not an alarm — a mentor's own
  // judgment about a specific relationship always overrides a generic
  // day-count threshold.
  function healthBadge(m: Missionary) {
    const map = {
      recent: { emoji: "🟢", label: "Recent human contact", cls: "text-green-400" },
      due: { emoji: "🟡", label: "Check-in due soon", cls: "text-yellow-400" },
      overdue: { emoji: "🔴", label: "Overdue for human contact", cls: "text-red-400" },
      never: { emoji: "⚪", label: "No logged human contact yet", cls: "text-harvest-textDim" },
    } as const;
    const info = map[m.contactHealth];
    const daysAgo = m.lastHumanContactAt
      ? Math.floor((Date.now() - new Date(m.lastHumanContactAt).getTime()) / (1000 * 60 * 60 * 24))
      : null;
    const detail = daysAgo === null ? "never logged" : daysAgo === 0 ? "today" : `${daysAgo}d ago`;
    return (
      <span className={`ml-1.5 text-xs ${info.cls}`} title={`${info.label} · ${detail}`}>
        {info.emoji} {detail}
      </span>
    );
  }

  async function sendBroadcast() {
    if (!broadcast.trim()) return;
    await fetch("/api/mentor/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ missionaryId: null, content: broadcast.trim() }),
    });
    setBroadcast("");
  }

  async function sendDirect() {
    if (!selected || !directMsg.trim()) return;
    await fetch("/api/mentor/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ missionaryId: selected.id, content: directMsg.trim() }),
    });
    setDirectMsg("");
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/mentor-login");
    router.refresh();
  }

  return (
    <div className="min-h-screen p-6">
      <header className="mx-auto mb-6 flex max-w-6xl items-center justify-between">
        <div>
          <h1 className="font-serif text-xl text-harvest-gold">🧭 Mentor Dashboard · Panel del Mentor</h1>
          <p className="text-sm text-harvest-textDim">{missionaries.length} missionários acompanhados · misioneros seguidos</p>
        </div>
        <button onClick={logout} className="text-xs text-harvest-textDim hover:text-harvest-gold">
          Sair · Salir
        </button>
      </header>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Roster */}
        <section className="rounded-xl border border-harvest-border bg-harvest-panel p-4 lg:col-span-1">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-harvest-textDim">
            Missionários · Misioneros
          </h2>
          <p className="mb-2 text-xs text-harvest-textDim">
            🟢 recent · 🟡 due soon · 🔴 overdue · ⚪ never — real human contact, not AI use
          </p>
          <div className="flex flex-col gap-1.5">
            {missionaries.length === 0 && <p className="text-sm text-harvest-textDim">No missionaries yet · Ningún misionero aún.</p>}
            {missionaries.map((m) => (
              <button
                key={m.id}
                onClick={() => loadDigest(m)}
                className={`flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
                  selected?.id === m.id ? "bg-harvest-goldDeep/20 text-harvest-gold" : "hover:bg-harvest-panel2"
                }`}
              >
                <span className="flex items-center gap-2">
                  {m.name}
                  {m.entryAssessment && (
                    <span
                      className="rounded-full bg-harvest-panel2 px-1.5 py-0.5 text-[10px] font-semibold text-harvest-textDim"
                      title="Initial Assessment Score · Puntuación del Diagnóstico Inicial"
                    >
                      🎯 {m.entryAssessment.totalScore}/100
                    </span>
                  )}
                </span>
                {healthBadge(m)}
              </button>
            ))}
          </div>

          <h2 className="mb-3 mt-6 text-sm font-semibold uppercase tracking-wide text-harvest-textDim">
            Transmitir para todos · Difundir a todos
          </h2>
          <textarea
            value={broadcast}
            onChange={(e) => setBroadcast(e.target.value)}
            placeholder="Message to everyone · Mensaje para todos…"
            className="mb-2 w-full resize-none rounded-lg border border-white/10 bg-harvest-panel2 px-3 py-2 text-sm outline-none focus:border-harvest-gold"
            rows={3}
          />
          <button
            onClick={sendBroadcast}
            className="w-full rounded-lg bg-harvest-goldDeep px-3 py-2 text-sm font-semibold text-white hover:bg-harvest-gold"
          >
            Send · Enviar
          </button>
        </section>

        {/* Digest + direct message */}
        <section className="rounded-xl border border-harvest-border bg-harvest-panel p-4 lg:col-span-1">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-harvest-textDim">
            Resumo · Resumen
          </h2>
          {!selected && <p className="text-sm text-harvest-textDim">Select a missionary to see their summary · Selecciona un misionero.</p>}
          {selected && (
            <>
              <p className="mb-2 text-sm font-semibold text-harvest-gold">{selected.name}</p>
              <button
                onClick={() => logHumanContact(selected.id)}
                className="mb-4 w-full rounded-lg border border-green-700/50 bg-green-950/30 px-3 py-2 text-sm font-semibold text-green-300 hover:bg-green-900/40"
              >
                ✅ Registrar conversa humana real hoje · Registrar conversación humana real hoy
              </button>
              {digestLoading && <p className="text-sm text-harvest-textDim">Gerando… · Generando…</p>}
              {digest && (
                <div className="prose-chat text-sm text-harvest-text">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{digest}</ReactMarkdown>
                </div>
              )}

              <h3 className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wide text-harvest-textDim">
                Mensagem direta · Mensaje directo
              </h3>
              <textarea
                value={directMsg}
                onChange={(e) => setDirectMsg(e.target.value)}
                placeholder={`Message to ${selected.name}… · Mensaje para ${selected.name}…`}
                className="mb-2 w-full resize-none rounded-lg border border-white/10 bg-harvest-panel2 px-3 py-2 text-sm outline-none focus:border-harvest-gold"
                rows={3}
              />
              <button
                onClick={sendDirect}
                className="w-full rounded-lg bg-harvest-goldDeep px-3 py-2 text-sm font-semibold text-white hover:bg-harvest-gold"
              >
                Send
              </button>
            </>
          )}
        </section>

        {/* Urgent flags */}
        <section className="rounded-xl border border-harvest-border bg-harvest-panel p-4 lg:col-span-1">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-harvest-textDim">
            🚩 Urgent Alerts ({flags.length}) · Alertas urgentes
          </h2>
          <div className="flex flex-col gap-3">
            {flags.length === 0 && <p className="text-sm text-harvest-textDim">No open alerts · Ninguna alerta abierta.</p>}
            {flags.map((f) => (
              <div key={f.id} className="rounded-lg border border-red-900/40 bg-red-950/20 p-3">
                <p className="text-xs font-bold text-red-300">{f.reason}</p>
                <p className="mt-1 text-sm text-harvest-text">"{f.message}"</p>
                <p className="mt-1 text-xs text-harvest-textDim">
                  {f.missionary?.name ?? "Unknown missionary · Desconocido"} · {new Date(f.timestamp).toLocaleString()}
                </p>
                <button
                  onClick={() => resolveFlag(f.id)}
                  className="mt-2 rounded-md border border-harvest-goldDeep/50 px-2 py-1 text-xs text-harvest-gold hover:bg-harvest-goldDeep/15"
                >
                  Resolved · Resuelto
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

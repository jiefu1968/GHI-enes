/**
 * Mentor-mentee feature: DB access (Prisma/Postgres replacement for
 * harvest_db.py's SQLite functions) + escalation detection + digest
 * agent. Ported from harvest_db.py and harvest_mentor.py.
 */

import { prisma } from "./db";
import { callWithRetry, type ChatMessage } from "./groq";

// ── Missionaries ──

export async function getOrCreateMissionary(missionaryId: string, name: string) {
  return prisma.missionary.upsert({
    where: { id: missionaryId },
    update: { name },
    create: { id: missionaryId, name },
  });
}

export async function getMissionary(missionaryId: string) {
  return prisma.missionary.findUnique({ where: { id: missionaryId } });
}

// Best-effort identity continuity: if the browser session cookie expired
// (7-day TTL) or the missionary switched device/browser, a fresh
// /api/session/identify call would otherwise mint a brand-new random id
// and silently fragment that person's history + urgent-flag trail across
// multiple "missionary" rows in the mentor's roster. Reusing an existing
// row with an exact, case-insensitive name match is not perfect — two
// real people could share a name, and a spelling change starts a new
// row — but it is a meaningfully safer default than always fragmenting.
// Call this BEFORE minting a new id in the identify route.
export async function findMissionaryByName(name: string) {
  return prisma.missionary.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
    orderBy: { createdAt: "asc" }, // prefer the original/oldest record
  });
}

export async function listMissionaries() {
  return prisma.missionary.findMany({
    orderBy: { name: "asc" },
    include: { entryAssessment: true },
  });
}

// ── Human relationship health ──
//
// Deliberately separate from activity_log: activity_log fills up from AI
// chat use alone, which would make "last contact" always look recent even
// for someone who has quietly stopped having any real conversation with
// their mentor. This is only ever written by an explicit mentor action
// (see /api/mentor/human-contact), never inferred from AI usage.

export async function logHumanContact(missionaryId: string) {
  return prisma.missionary.update({
    where: { id: missionaryId },
    data: { lastHumanContactAt: new Date() },
  });
}

// Buckets used by the mentor dashboard to color-code the roster —
// thresholds are a starting default, not a clinical judgment.
export type ContactHealth = "recent" | "due" | "overdue" | "never";

export function contactHealthFor(lastHumanContactAt: Date | null): ContactHealth {
  if (!lastHumanContactAt) return "never";
  const days = (Date.now() - lastHumanContactAt.getTime()) / (1000 * 60 * 60 * 24);
  if (days <= 14) return "recent";
  if (days <= 30) return "due";
  return "overdue";
}

// ── Field context (for destination-based module recommendations) ──
//
// Purely a client-side sorting hint (see lib/recommendations.ts) — never
// passed to the AI as an instruction, so it can't be used to steer agent
// behavior, only to reorder which modules a missionary sees first.

export async function setFieldContext(missionaryId: string, fieldContext: string) {
  return prisma.missionary.update({
    where: { id: missionaryId },
    data: { fieldContext },
  });
}

// ── Activity log ──

export async function logActivity(
  missionaryId: string,
  role: string,
  content: string,
  agentKey = "",
  module: number | null = null
) {
  if (!missionaryId) return; // anonymous session — nothing to track for a mentor
  await prisma.activityLog.create({
    data: { missionaryId, role, content, agentKey, module: module ?? undefined },
  });
}

export async function getRecentActivity(missionaryId: string, limit = 60) {
  const rows = await prisma.activityLog.findMany({
    where: { missionaryId },
    orderBy: { id: "desc" },
    take: limit,
  });
  return rows.reverse();
}

export async function lastActivityAt(missionaryId: string): Promise<Date | null> {
  const row = await prisma.activityLog.findFirst({
    where: { missionaryId },
    orderBy: { id: "desc" },
  });
  return row?.timestamp ?? null;
}

// ── Escalation detection ──
//
// Same shape as checkTheologicalConcerns(): a small keyword pre-filter,
// not a classifier. It's a steering/flagging signal, not a diagnosis.

const ESCALATION_KEYWORDS: Record<string, string> = {
  // English
  "want to quit": "Discouragement / considering quitting",
  "want to give up": "Discouragement / considering quitting",
  "i'm scared": "Fear or safety concern",
  "i am scared": "Fear or safety concern",
  "unsafe": "Possible safety concern",
  "in danger": "Possible safety concern",
  "burnout": "Possible burnout",
  "burned out": "Possible burnout",
  "depressed": "Possible mental health concern",
  "suicidal": "Urgent: possible self-harm risk",
  "want to hurt myself": "Urgent: possible self-harm risk",
  "hurt myself": "Urgent: possible self-harm risk",
  "kill myself": "Urgent: possible self-harm risk",
  "want to die": "Urgent: possible self-harm risk",
  "end my life": "Urgent: possible self-harm risk",
  "ending my life": "Urgent: possible self-harm risk",
  "don't want to live": "Urgent: possible self-harm risk",
  "no reason to live": "Urgent: possible self-harm risk",
  "better off dead": "Urgent: possible self-harm risk",
  "self-harm": "Urgent: possible self-harm risk",
  "self harm": "Urgent: possible self-harm risk",
  "talk to a human": "Explicit request for human contact",
  "talk to my mentor": "Explicit request for mentor contact",
  "need help urgently": "Explicit urgent help request",
  // Spanish
  "quiero rendirme": "Discouragement / considering quitting",
  "quiero renunciar": "Discouragement / considering quitting",
  "tengo miedo": "Fear or safety concern",
  "no estoy seguro": "Possible safety concern",
  "no estoy segura": "Possible safety concern",
  "estoy en peligro": "Possible safety concern",
  "agotamiento": "Possible burnout",
  "quemado": "Possible burnout",
  "deprimido": "Possible mental health concern",
  "deprimida": "Possible mental health concern",
  "quiero morir": "Urgent: possible self-harm risk",
  "quiero matarme": "Urgent: possible self-harm risk",
  "hacerme daño": "Urgent: possible self-harm risk",
  "lastimarme": "Urgent: possible self-harm risk",
  "terminar con mi vida": "Urgent: possible self-harm risk",
  "no quiero vivir": "Urgent: possible self-harm risk",
  "sin razón para vivir": "Urgent: possible self-harm risk",
  "mejor muerto": "Urgent: possible self-harm risk",
  "hablar con un humano": "Explicit request for human contact",
  "hablar con mi mentor": "Explicit request for mentor contact",
  "necesito ayuda urgente": "Explicit urgent help request",
  // Chinese (Simplified) — this deployment's audience is English/Spanish,
  // but these entries are kept as extra, harmless detection coverage in
  // case a message arrives in Chinese anyway (e.g. a shared device, or a
  // person more comfortable typing in Chinese despite the platform's
  // language). Substring matching has no word-boundary issue in Chinese,
  // so these are kept short. Traditional variants added where the
  // characters differ from Simplified.
  "想放弃": "Discouragement / considering quitting",
  "想放棄": "Discouragement / considering quitting",
  "我害怕": "Fear or safety concern",
  "不安全": "Possible safety concern",
  "有危险": "Possible safety concern",
  "有危險": "Possible safety concern",
  "倦怠": "Possible burnout",
  "精疲力竭": "Possible burnout",
  "抑郁": "Possible mental health concern",
  "抑鬱": "Possible mental health concern",
  "想自杀": "Urgent: possible self-harm risk",
  "想自殺": "Urgent: possible self-harm risk",
  "自杀": "Urgent: possible self-harm risk",
  "自殺": "Urgent: possible self-harm risk",
  "想死": "Urgent: possible self-harm risk",
  "不想活": "Urgent: possible self-harm risk",
  "活不下去": "Urgent: possible self-harm risk",
  "结束我的生命": "Urgent: possible self-harm risk",
  "結束我的生命": "Urgent: possible self-harm risk",
  "伤害自己": "Urgent: possible self-harm risk",
  "傷害自己": "Urgent: possible self-harm risk",
  "想和真人": "Explicit request for human contact",
  "想找人聊": "Explicit request for human contact",
  "联系我的导师": "Explicit request for mentor contact",
  "聯繫我的導師": "Explicit request for mentor contact",
  "需要紧急帮助": "Explicit urgent help request",
  "需要緊急幫助": "Explicit urgent help request",
};

export function checkEscalation(userMessage: string): string | null {
  const msg = userMessage.toLowerCase();
  for (const [keyword, reason] of Object.entries(ESCALATION_KEYWORDS)) {
    if (msg.includes(keyword)) return reason;
  }
  return null;
}

/**
 * True when an escalation reason indicates an acute self-harm / suicide
 * risk (as opposed to milder discouragement/burnout flags). The chat
 * route uses this to decide whether to surface an immediate, in-the-moment
 * support message to the person — not just silently queue a mentor flag,
 * since a mentor may be offline for hours. See buildCrisisSupportBlock().
 */
export function isSelfHarmRisk(reason: string | null): boolean {
  return !!reason && reason.startsWith("Urgent: possible self-harm");
}

/**
 * A short, compassionate support block shown to the person immediately
 * when their message trips a self-harm-risk keyword, BEFORE the normal AI
 * answer. Deliberately does NOT ask assessment questions, name any
 * method, or try to counsel — it validates, urges contact with a real
 * person right now, and points to resources that work regardless of the
 * person's country/language.
 *
 * The links below are international, free, and language-agnostic
 * directories — adjust or add a region-specific hotline for your actual
 * deployment field(s) here in one place. This is intentionally the ONLY
 * place crisis resources are defined so a mentor/org can localize it.
 */
export function buildCrisisSupportBlock(): string {
  return (
    `> 💛 **You are not alone. / No estás solo(a). / 你并不孤单。**\n>\n` +
    `> **English:** I noticed you might be going through a really difficult moment. ` +
    `Please talk now with someone you trust — your mentor, a friend, a leader — or with ` +
    `a support service. If your life is at immediate risk, contact your local emergency ` +
    `service right now. International directory of helplines: https://findahelpline.com — ` +
    `emotional support (Befrienders): https://www.befrienders.org\n>\n` +
    `> **Español:** Noté que podrías estar pasando por un momento muy difícil. ` +
    `Por favor, habla ahora con alguien de confianza — tu mentor, un amigo, un líder — o con ` +
    `un servicio de apoyo. Si tu vida corre peligro inmediato, contacta ya al servicio de ` +
    `emergencia local. Directorio internacional de líneas de ayuda: https://findahelpline.com — ` +
    `apoyo emocional (Befrienders): https://www.befrienders.org\n>\n` +
    `> Your mentor has been notified. / Tu mentor ha sido notificado. / 你的导师已收到通知。\n\n---\n\n`
  );
}

export async function flagUrgent(missionaryId: string, message: string, reason: string) {
  if (!missionaryId) return;
  await prisma.urgentFlag.create({ data: { missionaryId, message, reason } });
}

export async function listUrgentFlags(resolved = false) {
  return prisma.urgentFlag.findMany({
    where: { resolved },
    orderBy: { id: "desc" },
    include: { missionary: { select: { name: true } } },
  });
}

export async function resolveFlag(flagId: number) {
  await prisma.urgentFlag.update({ where: { id: flagId }, data: { resolved: true } });
}

// ── Mentor messages ──

export async function sendMentorMessage(missionaryId: string | null, content: string) {
  await prisma.mentorMessage.create({ data: { missionaryId, content } });
}

export async function getUndeliveredMessages(missionaryId: string) {
  return prisma.mentorMessage.findMany({
    where: {
      OR: [{ missionaryId }, { missionaryId: null }],
      receipts: { none: { missionaryId } },
    },
    orderBy: { id: "asc" },
  });
}

export async function markDelivered(messageIds: number[], missionaryId: string) {
  if (messageIds.length === 0) return;
  await prisma.mentorMessageReceipt.createMany({
    data: messageIds.map((messageId) => ({ messageId, missionaryId })),
    skipDuplicates: true,
  });
}

// ── Digests ──

export async function saveDigest(missionaryId: string, summary: string) {
  await prisma.digest.create({ data: { missionaryId, summary } });
}

export async function getLatestDigest(missionaryId: string) {
  return prisma.digest.findFirst({
    where: { missionaryId },
    orderBy: { id: "desc" },
  });
}

// ── Digest agent ──
//
// Not user-facing — only called from the mentor dashboard. Reads recent
// activity_log rows for one missionary and asks the model for a short
// bilingual summary a mentor can scan in under a minute.

const DIGEST_SYSTEM = `You are the Mentor Digest Agent for the Global Harvest Initiative.
You write a SHORT bilingual (Portuguese, then Spanish) summary of one
missionary's recent activity, for their human mentor to review. You are NOT talking to
the missionary — you are briefing the mentor.

Structure your response as:
**English:**
- Modules/topics covered (be specific)
- Overall tone / engagement level
- Anything the mentor should know or follow up on (encouragement needed, confusion,
  a question that deserves a personal conversation) — or "Nothing notable" if there isn't any
---
**Español:**
[Same structure, in Spanish]

Keep it under 150 words per language. Do not quote long passages verbatim — summarize
in your own words. Never fabricate detail not present in the activity provided.`;

export async function generateDigest(missionaryId: string, missionaryName: string): Promise<string> {
  const activity = await getRecentActivity(missionaryId, 60);
  if (activity.length === 0) {
    const summary =
      `**English:** No activity recorded yet for ${missionaryName}.\n` +
      `---\n**Español:** Aún no hay actividad registrada para ${missionaryName}.`;
    await saveDigest(missionaryId, summary);
    return summary;
  }

  const transcriptLines = activity.map((row) => {
    const tag = row.role === "user" ? "Missionary" : "Agent";
    const mod = row.module ? ` (module ${row.module})` : "";
    return `${tag}${mod}: ${row.content.slice(0, 400)}`;
  });
  const transcript = transcriptLines.join("\n");

  const prompt = `Missionary: ${missionaryName}\n\nRecent activity log:\n${transcript}\n\nWrite the digest.`;
  const messages: ChatMessage[] = [
    { role: "system", content: DIGEST_SYSTEM },
    { role: "user", content: prompt },
  ];
  const { text, error } = await callWithRetry(messages, { maxTokens: 700, temperature: 0.4 });
  const summary = text ?? `⚠️ Could not generate digest: ${error}`;
  await saveDigest(missionaryId, summary);
  return summary;
}

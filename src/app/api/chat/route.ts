import { NextRequest } from "next/server";
import { readSession } from "@/lib/auth";
import { routeToAgent, routeToAgentSmart } from "@/lib/routing";
import { callAgentStream, callAgentStreamWithCritic, type ChatMessage } from "@/lib/groq";
import { checkEscalation, flagUrgent, logActivity, isSelfHarmRisk, buildCrisisSupportBlock } from "@/lib/mentor";
import { ENABLE_SUPERVISOR, ENABLE_CRITIC } from "@/lib/env";
import { SENSITIVE_MODULES, HUMAN_TOUCH_REMINDER_EVERY_N_TURNS, buildHumanTouchReminder } from "@/lib/curriculumConfig";
import type { ResponseLangMode } from "@/lib/language";

// Reads BM25 content from disk (fs) — must run on Node.js, not Edge.
export const runtime = "nodejs";

const VALID_RESPONSE_LANGUAGES: ResponseLangMode[] = ["auto", "pt", "es"];

interface ChatRequestBody {
  message: string;
  history: ChatMessage[];
  selectedModule: number | null;
  selectedAgent: string; // "orchestrator" | "mod_XX" | "quiz_master" | ...
  responseLanguage?: ResponseLangMode;
  groupModules?: number[]; // sidebar group filter — see lib/moduleGroups.ts
}

export async function POST(req: NextRequest) {
  const session = await readSession();
  if (!session) return new Response("Not authenticated", { status: 401 });

  const body = (await req.json().catch(() => null)) as ChatRequestBody | null;
  if (!body || !body.message?.trim()) {
    return new Response("Missing message", { status: 400 });
  }

  const { message, history = [], selectedModule, selectedAgent, responseLanguage: rawLang, groupModules } = body;
  const responseLanguage: ResponseLangMode = VALID_RESPONSE_LANGUAGES.includes(rawLang as ResponseLangMode)
    ? (rawLang as ResponseLangMode)
    : "auto";

  // Routing: the smart supervisor (lib/supervisor.ts) only actually runs
  // for ambiguous free-text turns — see routeToAgentSmart's own comments
  // for the fast paths that skip it. ENABLE_SUPERVISOR=false restores the
  // original pure-keyword routeToAgent() with no LLM classification call.
  const { agentKey, secondaryModules } = ENABLE_SUPERVISOR
    ? await routeToAgentSmart(message, selectedModule, selectedAgent || "orchestrator", history, groupModules)
    : { agentKey: routeToAgent(message, selectedModule, selectedAgent || "orchestrator"), secondaryModules: [] as number[] };

  // Human-touch reminder check: derived from the agent actually answering
  // (agentKey), not the requested selectedModule, since the supervisor
  // may have routed here regardless of what the client asked for. Turn
  // count is approximated from this session's whole history (not
  // filtered to same-module turns specifically) — a simple, honest
  // approximation rather than a precise same-module counter, which would
  // need a DB round-trip keyed on missionaryId that anonymous sessions
  // don't have anyway. See curriculumConfig.ts's comment on this constant.
  const agentModuleNum = agentKey.startsWith("mod_") ? parseInt(agentKey.slice(4), 10) : null;
  const userTurnCount = history.filter((h) => h.role === "user").length + 1;
  const shouldRemindHumanTouch =
    agentModuleNum !== null &&
    SENSITIVE_MODULES.includes(agentModuleNum) &&
    userTurnCount % HUMAN_TOUCH_REMINDER_EVERY_N_TURNS === 0;

  // Pastoral-care escalation pre-filter — same keyword check as the
  // Python version, run before the agent call so a flagged message still
  // gets a normal AI response, but is also queued for the human mentor.
  //
  // The check now runs for EVERY session, not only identified ones: an
  // anonymous user in crisis still needs the immediate support block
  // below, even though there's no missionaryId to attach a mentor flag
  // to. Flagging/logging to the DB still requires a missionaryId.
  const escalationReason = checkEscalation(message);
  const showCrisisBlock = isSelfHarmRisk(escalationReason);
  if (session.missionaryId) {
    if (escalationReason) {
      await flagUrgent(session.missionaryId, message, escalationReason);
    }
    await logActivity(session.missionaryId, "user", message, agentKey, selectedModule ?? null);
  }

  const encoder = new TextEncoder();
  let previous = "";
  let full = "";

  // ENABLE_CRITIC=false restores the original live token-by-token stream
  // with no post-generation review — see callAgentStreamWithCritic's
  // module comment in lib/groq.ts for the UX tradeoff this makes.
  // maxTokens raised from 1400 to 2200 (2026-07-23): reasoning models like
  // the current PRIMARY_MODEL default spend part of max_tokens on hidden
  // reasoning before writing the visible answer, which was silently
  // truncating normal-length responses — see groq.ts's finish_reason
  // check in callAgentStream for how truncation is now at least surfaced
  // to the missionary when it does still happen.
  const agentGenerator = ENABLE_CRITIC
    ? callAgentStreamWithCritic(agentKey, message, history, selectedModule, 2200, secondaryModules, responseLanguage)
    : callAgentStream(agentKey, message, history, selectedModule, 2200, secondaryModules, responseLanguage);

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        // On a self-harm-risk message, surface human-support resources
        // immediately — before (and independent of) whatever the model
        // says — so the person sees real help even if the AI answer is
        // slow, gets truncated, or the model handles it poorly.
        if (showCrisisBlock) {
          const crisis = buildCrisisSupportBlock();
          controller.enqueue(encoder.encode(crisis));
          full += crisis;
        }
        for await (const partial of agentGenerator) {
          const delta = partial.slice(previous.length);
          previous = partial;
          full = partial;
          if (delta) controller.enqueue(encoder.encode(delta));
        }
        if (shouldRemindHumanTouch && full) {
          const reminder = buildHumanTouchReminder();
          controller.enqueue(encoder.encode(reminder));
          full += reminder;
        }
      } catch (e) {
        controller.enqueue(encoder.encode(`\n⚠️ Stream error: ${String(e)}`));
      } finally {
        if (session.missionaryId && full) {
          await logActivity(session.missionaryId, "assistant", full, agentKey, selectedModule ?? null);
        }
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Agent-Key": agentKey,
      "Cache-Control": "no-cache",
    },
  });
}

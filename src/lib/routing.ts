// Routing logic ported from harvest_session.py's route_to_agent().
// Session *state* (history, missionary identity, progress) lives in the
// client + is persisted per-turn via API calls rather than an in-memory
// Python object, since Next.js API routes are stateless between requests.

import { MODULE_AGENT_MAP } from "./agents";
import { callSupervisor, type SupervisorResult } from "./supervisor";
import type { ChatMessage } from "./groq";

export function routeToAgent(userMessage: string, selectedModule: number | null | undefined, activeAgent: string): string {
  if (activeAgent && activeAgent.startsWith("mod_")) return activeAgent;
  if (selectedModule && MODULE_AGENT_MAP[selectedModule]) return MODULE_AGENT_MAP[selectedModule]!;

  const msgLower = userMessage.toLowerCase();
  const quizWords = ["quiz", "test", "assess", "examen", "evaluación", "evaluacion"];
  if (quizWords.some((w) => msgLower.includes(w))) return "quiz_master";

  return activeAgent;
}

/**
 * Smart routing entrypoint (adds an LLM supervisor step ahead of the
 * deterministic router above).
 *
 * Explicit human choices are never second-guessed: if the UI already has
 * a specific module or agent selected/active, we skip the supervisor
 * entirely and go straight to the deterministic path — no extra latency
 * or cost for the common case of "I'm already inside Module 12 and I
 * asked a follow-up question." The supervisor only runs for the genuinely
 * ambiguous case: free text sent to the general orchestrator with no
 * module selected, where a keyword match is unreliable.
 *
 * Falls back to routeToAgent() (deterministic) on any supervisor failure,
 * so a missionary never sees a routing error — worst case is the old,
 * slightly-less-smart keyword behavior.
 */
export async function routeToAgentSmart(
  userMessage: string,
  selectedModule: number | null | undefined,
  activeAgent: string,
  history: ChatMessage[] = [],
  allowedModules?: number[]
): Promise<{ agentKey: string; secondaryModules: number[]; usedSupervisor: boolean }> {
  // Deterministic fast paths — explicit choices are respected as-is.
  if (activeAgent && activeAgent.startsWith("mod_")) {
    return { agentKey: activeAgent, secondaryModules: [], usedSupervisor: false };
  }
  if (selectedModule && MODULE_AGENT_MAP[selectedModule]) {
    return { agentKey: MODULE_AGENT_MAP[selectedModule]!, secondaryModules: [], usedSupervisor: false };
  }
  if (activeAgent === "quiz_master") {
    return { agentKey: "quiz_master", secondaryModules: [], usedSupervisor: false };
  }

  // Ambiguous case: ask the supervisor to classify intent + relevant module(s),
  // optionally restricted to a sidebar-selected group (see moduleGroups.ts).
  const result: SupervisorResult | null = await callSupervisor(userMessage, history, allowedModules);
  if (result) {
    return { agentKey: result.agentKey, secondaryModules: result.secondaryModules, usedSupervisor: true };
  }

  // Supervisor unavailable/failed — fall back to the original keyword router.
  return { agentKey: routeToAgent(userMessage, selectedModule, activeAgent), secondaryModules: [], usedSupervisor: false };
}

// NOTE: an unused QUICK_START_PROMPTS/getQuickStartMessage pair used to
// live here (dead code — quickStarts.ts is the actual source of truth
// used by the UI, see Sidebar.tsx/ChatApp.tsx). Removed rather than
// translated during the EN/PT/ES localization pass.

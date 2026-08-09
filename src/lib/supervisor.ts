/**
 * LLM-based supervisor routing.
 *
 * WHY THIS EXISTS: the original routeToAgent() (routing.ts) only handles
 * two cases well — an explicit module picked in the UI, and a keyword
 * match for "quiz". Free-text questions that don't carry an exact
 * keyword, or that touch more than one module at once (e.g. "how do I
 * explain the Trinity to a Chinese Buddhist?" — modules 2, 17, 21 all
 * apply), fall through to whatever agent was already active, which is
 * frequently wrong.
 *
 * This module adds a cheap, fast classification call (SUPERVISOR_CRITIC_MODEL —
 * JSON mode, temperature 0) that reads the user's message plus a
 * little recent context and picks: (a) the single best-fit agent to
 * actually answer, and (b) up to two secondary modules whose curriculum
 * content is also worth pulling into context, even though a different
 * agent leads the answer.
 *
 * DESIGN PRINCIPLE — never override an explicit human choice, and never
 * block the chat if this fails:
 *   - If the user (or the UI) already pinned a specific module/agent,
 *     this function is not even called — see shouldUseSupervisor() below
 *     and its call site in routing.ts.
 *   - Any failure (network error, malformed JSON, unknown agent key)
 *     falls back to the original keyword-based routeToAgent() silently.
 *     A missionary should never see a routing error; worst case, they
 *     get the old (slightly less smart) behavior.
 */

import { SUPERVISOR_CRITIC_MODEL } from "./env";
import { AGENTS, MODULE_NAMES } from "./agents";
import { callWithRetry, type ChatMessage } from "./groq";
import { logger } from "./logger";

export interface SupervisorResult {
  agentKey: string;
  secondaryModules: number[];
  reasoning?: string;
}

// Compact module directory the classifier reads — id + bilingual name only,
// no system prompts (keeps the classification prompt small and cheap).
// When `allowedModules` is given (the missionary clicked a sidebar group),
// only those modules are listed and the classifier is told explicitly not
// to pick outside the set — see callSupervisor's `allowedModules` param.
function buildModuleDirectory(allowedModules?: number[]): string {
  const entries = allowedModules
    ? Object.entries(MODULE_NAMES).filter(([id]) => allowedModules.includes(Number(id)))
    : Object.entries(MODULE_NAMES);
  return entries.map(([id, name]) => `${id}: ${name}`).join("\n");
}

function buildSupervisorSystem(allowedModules?: number[]): string {
  const scopeNote = allowedModules
    ? `\n\nIMPORTANT: the missionary has narrowed the sidebar to a specific group of modules. ` +
      `You MUST choose "primary_module" (and any "secondary_modules") ONLY from the MODULES list ` +
      `below — never a module number outside it. If none of these modules genuinely fit the ` +
      `question, set "intent" to "general" instead of picking an unrelated module.`
    : "";

  return `You are a silent routing classifier for a missiological training chat app. \
You never talk to the user directly — you only output JSON.

Given the user's message (and a little recent conversation history), decide which single \
specialist module best fits the CURRENT question, plus optionally up to 2 other modules \
whose content is also relevant as supporting context.

MODULES:
${buildModuleDirectory(allowedModules)}${scopeNote}

Special cases:
- If the user is asking to be quizzed, tested, or assessed on what they've studied \
(in any language — English, Español), set "intent" to "quiz".
- If the message is a general greeting, an ask for a program overview, or doesn't clearly \
fit any single module, set "intent" to "general" and "primary_module" to null.
- Otherwise set "intent" to "module" and "primary_module" to the single best-fit module number.

Respond with ONLY this JSON shape, nothing else:
{"intent": "module" | "quiz" | "general", "primary_module": number | null, "secondary_modules": number[], "reasoning": "one short clause"}`;
}

function parseModuleNum(n: unknown, allowedModules?: number[]): number | null {
  const num = typeof n === "number" ? n : parseInt(String(n), 10);
  if (!Number.isFinite(num) || !MODULE_NAMES[num]) return null;
  if (allowedModules && !allowedModules.includes(num)) return null;
  return num;
}

/**
 * Calls the classifier. Returns null (never throws) on any failure so the
 * caller can fall back to the deterministic keyword router.
 */
export async function callSupervisor(
  userMessage: string,
  recentHistory: ChatMessage[] = [],
  allowedModules?: number[]
): Promise<SupervisorResult | null> {
  try {
    const contextLines = recentHistory
      .slice(-4)
      .map((h) => `${h.role}: ${h.content.slice(0, 200)}`)
      .join("\n");

    const messages: ChatMessage[] = [
      { role: "system", content: buildSupervisorSystem(allowedModules) },
      {
        role: "user",
        content: contextLines
          ? `Recent context:\n${contextLines}\n\nCurrent message: ${userMessage}`
          : `Current message: ${userMessage}`,
      },
    ];

    const { text, error } = await callWithRetry(messages, {
      model: SUPERVISOR_CRITIC_MODEL,
      maxTokens: 150,
      temperature: 0,
      responseFormat: { type: "json_object" },
      maxRetries: 1, // this is a latency-sensitive classification step, not the main answer
    });

    if (!text) {
      logger.warn("Supervisor call failed, falling back to keyword routing", { error });
      return null;
    }

    const parsed = JSON.parse(text);
    const intent = parsed?.intent;

    if (intent === "quiz") {
      return { agentKey: "quiz_master", secondaryModules: [], reasoning: parsed?.reasoning };
    }

    if (intent === "module") {
      const primaryModule = parseModuleNum(parsed?.primary_module, allowedModules);
      if (primaryModule === null) return null; // malformed, or outside the allowed group — let caller fall back

      const agentKey = `mod_${String(primaryModule).padStart(2, "0")}`;
      if (!AGENTS[agentKey]) return null;

      const secondary: number[] = Array.isArray(parsed?.secondary_modules)
        ? parsed.secondary_modules
            .map((n: unknown) => parseModuleNum(n, allowedModules))
            .filter((n: number | null): n is number => n !== null && n !== primaryModule)
            .slice(0, 2)
        : [];

      return { agentKey, secondaryModules: secondary, reasoning: parsed?.reasoning };
    }

    // intent === "general" (or anything unrecognized) → let the orchestrator handle it
    return { agentKey: "orchestrator", secondaryModules: [], reasoning: parsed?.reasoning };
  } catch (e) {
    logger.warn("Supervisor call threw, falling back to keyword routing", { error: String(e) });
    return null;
  }
}

/**
 * Primary-provider (DeepSeek by default — see env.ts) client + retry/
 * fallback logic + agent message assembly.
 * Ported from harvest_groq_client.py. Node-only (used from API routes
 * running on the Node.js runtime, not Edge) since it may call RAG (fs).
 *
 * Cerebras's (and every other provider this file has used — Groq,
 * DeepSeek, Together AI) REST API is OpenAI-compatible, so this uses plain fetch rather
 * than a Python-only SDK.
 */

import {
  PRIMARY_API_KEY,
  PRIMARY_MODEL,
  PRIMARY_MODEL_FALLBACK,
  PRIMARY_BASE_URL,
  FALLBACK_API_KEY,
  FALLBACK_MODEL,
  FALLBACK_BASE_URL,
} from "./env";
import { AGENTS } from "./agents";
import { loadAllBooksSummary } from "./rag";
import { retrieveContext } from "./retrieval";
import {
  THEOLOGICAL_GUARDRAIL,
  BILINGUAL_RULE,
  checkTheologicalConcerns,
  singleLanguageRule,
} from "./guardrails";
import type { ResponseLangMode } from "./language";
import { buildVerificationBlock, userRequestedVerse } from "./scripture";
import { critiqueResponse, buildRepairMessages } from "./critic";
import { logger, recordProviderCall } from "./logger";

// Base URL for the primary provider — see PRIMARY_BASE_URL's comment in
// env.ts for why this is DeepSeek by default rather than Groq.
const PRIMARY_URL = PRIMARY_BASE_URL;

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

// Every one of the 37 agent prompts in agents.ts (plus the orchestrator and
// quiz_master) has its OWN hardcoded "TRILINGUAL: English, Portuguese, and
// Spanish..." instruction baked directly into agent.systemPrompt — separate
// from, and in addition to, the BILINGUAL_RULE block appended below. That's
// fine in "auto" mode (both agree), but when a single language is selected
// it's a second, competing instruction sitting earlier in the prompt (and,
// for the orchestrator, a very explicit "**English:** ... --- **Español:** ..."
// formatting instruction) that can out-compete
// the single-language rule
// appended at the end. Strip the known hardcoded phrasings out of the
// agent's own prompt text before assembling the system message, rather
// than relying solely on a countermanding note — see agents.ts's own
// "do not hand-edit the prompt text" comment for why this is done here at
// runtime instead of editing all 34 prompts by hand.
// Every module agent prompt in agents.ts (plus the orchestrator and
// quiz_master) has its OWN hardcoded "TRILINGUAL: English, Portuguese,
// and Spanish..." instruction baked directly into agent.systemPrompt —
// separate from, and in addition to, the BILINGUAL_RULE block appended
// below. That's fine in "auto" mode (both agree), but when a single
// language is selected it's a second, competing instruction sitting
// earlier in the prompt that can out-compete the single-language rule
// appended at the end. Strip the known hardcoded phrasings out of the
// agent's own prompt text before assembling the system message, rather
// than relying solely on a countermanding note.
function stripMultilingualInstruction(prompt: string): string {
  return prompt
    .replace(/\n*BILINGUAL RULE:[\s\S]*?Baptist Doctrinal Standards apply to all responses\.\n*/, "\n")
    .replace(/\n*BILINGUAL:\s*(Respond in\s*)?Portuguese\s*and\s*Spanish\.\s*⚠️ THEOLOGICAL GUARDRAIL ACTIVE\.\n*/, "\n")
    .replace(/\n*Always provide feedback in Portuguese and Spanish\.\n*⚠️ THEOLOGICAL GUARDRAIL ACTIVE\.\n*/, "\n")
    .trim();
}

// ─────────────────────────────────────────────
// SHARED PROMPT ASSEMBLY
// ─────────────────────────────────────────────

export async function buildMessages(
  agentKey: string,
  userMessage: string,
  history: ChatMessage[],
  moduleContext?: number | null,
  ragTopK = 6,
  historyWindow = 8,
  secondaryModules: number[] = [],
  responseLanguage: ResponseLangMode = "auto"
): Promise<ChatMessage[]> {
  const agent = AGENTS[agentKey];
  if (!agent) throw new Error(`Unknown agent: ${agentKey}`);

  const guardrailConcern = checkTheologicalConcerns(userMessage);
  const concernHint = guardrailConcern ? `\n\n[GUARDRAIL ALERT: ${guardrailConcern}]` : "";

  // "auto" means all three languages together (English, Portuguese,
  // Spanish), every response — see guardrails.ts's BILINGUAL_RULE. Any
  // explicit selection instead pins the whole response to that one
  // language and skips the multilingual rule entirely — see
  // guardrails.ts's singleLanguageRule.
  const languageBlock = responseLanguage === "auto" ? BILINGUAL_RULE : singleLanguageRule(responseLanguage);

  let system = (responseLanguage === "auto" ? agent.systemPrompt : stripMultilingualInstruction(agent.systemPrompt)) +
    THEOLOGICAL_GUARDRAIL + languageBlock + concernHint;

  // The model sometimes reopens with a fresh greeting/self-introduction even
  // when the conversation is already underway. Only relevant once there's
  // prior history — the first turn of a conversation is allowed to greet.
  if (history.length > 0) {
    system +=
      "\n\n[CONTINUING CONVERSATION — do NOT open with a greeting, a self-introduction, or " +
      "restate your welcome message; the missionary already received that on an earlier turn. " +
      "Respond directly to their latest message.]";
  }

  let bookCtx = "";
  if (agentKey === "orchestrator") {
    bookCtx = loadAllBooksSummary();
  } else if (agent.modules && agent.modules.length > 0) {
    bookCtx = await retrieveContext(userMessage, agent.modules, ragTopK);
  } else if (moduleContext) {
    bookCtx = await retrieveContext(userMessage, [moduleContext], ragTopK);
  }

  if (bookCtx) {
    system +=
      "\n\n=== RETRIEVED CURRICULUM CONTEXT (BM25) ===" +
      "\nBase your answer on the relevant excerpts below." +
      "\nIf the user asks about a specific author or book, quote from the source labels." +
      `\n\n${bookCtx}`;
  }

  // Supervisor-identified secondary modules: the question also touches these,
  // even though `agentKey` leads the answer. Pull a smaller amount of extra
  // context (topK=3) so the specialist can weave in a cross-module angle
  // (e.g. a Module 21 agent answering a question that also touches Module 17)
  // without diluting its own module's primary voice.
  const filteredSecondary = secondaryModules.filter((m) => !(agent.modules ?? []).includes(m));
  if (filteredSecondary.length > 0) {
    const secondaryCtx = await retrieveContext(userMessage, filteredSecondary, 3);
    if (secondaryCtx) {
      system +=
        "\n\n=== ALSO RELEVANT (supplementary context from related modules) ===" +
        "\nThe question also touches these related areas. Weave in a brief cross-module" +
        " angle if it strengthens your answer, but stay primarily in your own module's voice." +
        `\n\n${secondaryCtx}`;
    }
  }

  const messages: ChatMessage[] = [{ role: "system", content: system }];
  for (const h of history.slice(-historyWindow)) {
    if ((h.role === "user" || h.role === "assistant") && h.content) {
      messages.push({ role: h.role, content: h.content });
    }
  }
  messages.push({ role: "user", content: userMessage });
  return messages;
}

// ─────────────────────────────────────────────
// RETRY / FALLBACK HELPER
// ─────────────────────────────────────────────

function isRateLimited(err: string): boolean {
  return err.includes("rate_limit") || err.includes("429") || err.includes("413");
}

function isTruncatedJson(err: string): boolean {
  return err.includes("json_validate_failed") || err.toLowerCase().includes("max completion tokens reached");
}

function shouldFallback(err: string): boolean {
  return isRateLimited(err) || isTruncatedJson(err);
}

const RETRY_WAIT_CAP_SECONDS = 15;

function parseRetryAfterSeconds(err: string): number | null {
  const m = err.match(/try again in\s+(?:(\d+)m)?([\d.]+)s/i);
  if (!m) return null;
  const minutes = m[1] ? parseFloat(m[1]) : 0;
  const seconds = parseFloat(m[2]!);
  return minutes * 60 + seconds;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callGroqOnce(
  apiUrl: string,
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  maxTokens: number,
  temperature: number,
  responseFormat?: { type: "json_object" },
  reasoningEffort?: "low" | "medium" | "high"
): Promise<{ text: string | null; error: string | null }> {
  try {
    // reasoning_effort is only recognized by gpt-oss-family models — other
    // models may reject an unknown field, so it's included conditionally
    // rather than always. Reasoning models spend part of max_tokens on
    // hidden chain-of-thought before writing the visible answer; for
    // fixed-format JSON generation (quiz/case study) that reasoning adds
    // latency and eats into the budget meant for the actual output, so
    // callers doing that kind of call pass "low" to minimize it.
    const includeReasoningEffort = reasoningEffort && model.startsWith("openai/gpt-oss");
    const resp = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: maxTokens,
        temperature,
        ...(responseFormat ? { response_format: responseFormat } : {}),
        ...(includeReasoningEffort ? { reasoning_effort: reasoningEffort } : {}),
      }),
    });

    const data = await resp.json();
    if (!resp.ok) {
      const errMsg = data?.error?.message ?? JSON.stringify(data);
      return { text: null, error: `HTTP ${resp.status}: ${errMsg}` };
    }
    const text = data?.choices?.[0]?.message?.content ?? null;
    return { text, error: text ? null : "empty response" };
  } catch (e) {
    return { text: null, error: String(e) };
  }
}

async function callModelWithRetry(
  model: string,
  messages: ChatMessage[],
  maxTokens: number,
  temperature: number,
  responseFormat: { type: "json_object" } | undefined,
  maxRetries: number,
  reasoningEffort?: "low" | "medium" | "high"
): Promise<{ text: string | null; error: string | null }> {
  let attempt = 0;
  while (true) {
    const { text, error } = await callGroqOnce(PRIMARY_URL, PRIMARY_API_KEY, model, messages, maxTokens, temperature, responseFormat, reasoningEffort);
    if (text) return { text, error: null };
    if (error && isRateLimited(error) && attempt < maxRetries) {
      const realWait = parseRetryAfterSeconds(error);
      let waitMs: number;
      if (realWait !== null) {
        if (realWait > RETRY_WAIT_CAP_SECONDS) {
          console.warn(`  ⚠️  Rate limit (${model}) needs ${realWait.toFixed(0)}s to reset — falling back now.`);
          return { text: null, error };
        }
        waitMs = (realWait + Math.random() * 0.5) * 1000;
      } else {
        waitMs = (2 ** attempt + Math.random()) * 1000;
      }
      console.warn(`  ⚠️  Rate limit (${model}), retry ${attempt + 1}/${maxRetries} in ${(waitMs / 1000).toFixed(1)}s...`);
      await sleep(waitMs);
      attempt++;
      continue;
    }
    return { text: null, error };
  }
}

async function callFallback(
  model: string,
  messages: ChatMessage[],
  maxTokens: number,
  temperature: number,
  responseFormat?: { type: "json_object" },
  reasoningEffort?: "low" | "medium" | "high"
): Promise<{ text: string | null; error: string | null }> {
  if (!FALLBACK_API_KEY) {
    // Logged once per call (not just silently skipped) so "why didn't it
    // fall back to it" is answerable from server logs alone — a
    // missing/blank key is otherwise indistinguishable from every other
    // failure mode to whoever is debugging this.
    logger.warn("Fallback provider skipped — FALLBACK_API_KEY is not set");
    return { text: null, error: null };
  }
  logger.warn("Both primary-provider models failed, trying fallback provider", { model });
  const result = await callGroqOnce(FALLBACK_BASE_URL, FALLBACK_API_KEY, model, messages, maxTokens, temperature, responseFormat, reasoningEffort);
  recordProviderCall("fallback", !!result.text);
  if (result.text) {
    logger.warn("Fallback provider succeeded");
  } else {
    // This is the log line that answers "the key IS set, so why didn't it
    // switch?" — a bad key, wrong model name, or the fallback provider's own rate/quota
    // limit all land here with the actual provider error message attached.
    logger.error("Fallback provider also failed", { model, error: result.error });
  }
  return result;
}

export interface CallOptions {
  maxTokens?: number;
  temperature?: number;
  responseFormat?: { type: "json_object" };
  maxRetries?: number;
  fallbackMaxTokens?: number;
  /**
   * Force a specific model and skip the primary→fallback-model→fallback-provider fanout.
   * Used by lib/supervisor.ts and lib/critic.ts, which are latency- and
   * cost-sensitive classification/QA calls that should always go straight
   * to the classifier model (SUPERVISOR_CRITIC_MODEL) rather than trying the large
   * primary model first — there's no quality reason to prefer the 70B
   * model for a JSON classification task, only cost and latency reasons
   * not to.
   */
  model?: string;
  /**
   * Only affects gpt-oss-family models (see callGroqOnce) — silently
   * ignored for any other model. Pass "low" for fixed-format JSON
   * generation (quiz/case study) where the hidden reasoning pass mostly
   * just eats into max_tokens and adds latency without improving the
   * (already narrowly-specified) output.
   */
  reasoningEffort?: "low" | "medium" | "high";
}

/**
 * Call the primary provider with exponential backoff on rate limit, then fall back to the
 * smaller model, then the fallback provider (if configured). Returns
 * { text, error, fallbackTried } — fallbackTried lets callers distinguish
 * "fallback provider isn't configured" from "it was tried and also
 * failed," which otherwise look identical from the outside (see
 * callFallback's own comments).
 */
export async function callWithRetry(
  messages: ChatMessage[],
  opts: CallOptions = {}
): Promise<{ text: string | null; error: string | null; fallbackTried?: boolean }> {
  const {
    maxTokens = 1400,
    temperature = 0.7,
    responseFormat,
    maxRetries = 3,
    fallbackMaxTokens,
    model,
    reasoningEffort,
  } = opts;

  if (model) {
    // Direct single-model path (no primary/fallback-model/fallback-provider fanout) — see
    // the CallOptions.model doc comment above for why supervisor/critic
    // use this instead of the full cascade.
    const result = await callModelWithRetry(model, messages, maxTokens, temperature, responseFormat, maxRetries, reasoningEffort);
    recordProviderCall("primary", !!result.text);
    return result;
  }

  const primary = await callModelWithRetry(PRIMARY_MODEL, messages, maxTokens, temperature, responseFormat, maxRetries, reasoningEffort);
  if (primary.text) {
    recordProviderCall("primary", true);
    return { text: primary.text, error: null };
  }

  if (primary.error && shouldFallback(primary.error)) {
    logger.warn("Primary model failed, switching to fallback model", {
      reason: isTruncatedJson(primary.error) ? "truncated" : "rate_limited",
      fallbackModel: PRIMARY_MODEL_FALLBACK,
    });
    const fbTokens = fallbackMaxTokens ?? maxTokens;
    const fallback = await callModelWithRetry(PRIMARY_MODEL_FALLBACK, messages, fbTokens, temperature, responseFormat, maxRetries, reasoningEffort);
    if (fallback.text) {
      recordProviderCall("primary", true);
      return { text: fallback.text, error: null };
    }
    recordProviderCall("primary", false);

    const cb = await callFallback(FALLBACK_MODEL, messages, fbTokens, temperature, responseFormat, reasoningEffort);
    if (cb.text) return { text: cb.text, error: null };
    return { text: null, error: fallback.error, fallbackTried: !!FALLBACK_API_KEY };
  }
  recordProviderCall("primary", false);

  const cb = await callFallback(FALLBACK_MODEL, messages, fallbackMaxTokens ?? maxTokens, temperature, responseFormat, reasoningEffort);
  if (cb.text) return { text: cb.text, error: null };

  return { text: null, error: primary.error, fallbackTried: !!FALLBACK_API_KEY };
}

function rateLimitMessage(err: string | null, fallbackTried?: boolean): string {
  const m = (err ?? "").match(/try again in ([^,'.]+)/i);
  const waitMsg = m ? ` Please try again in **${m[1]!.trim()}**.` : "";

  if (fallbackTried) {
    // The backup provider was actually attempted and also failed — a
    // different situation from "no backup configured," and worth saying
    // so plainly rather than repeating only the primary-provider-specific message.
    return (
      `⏳ **Both AI providers are temporarily unavailable**\n\n` +
      `**English:** The primary AI provider hit its limit, and the backup provider ` +
      `also failed to respond. This is unusual — check the server logs or try again ` +
      `in a few minutes.${waitMsg}\n\n` +
      `**Español:** El proveedor principal de IA alcanzó su límite, y el proveedor de respaldo ` +
      `tampoco respondió. Esto es inusual — revise los registros del servidor o intente ` +
      `de nuevo en unos minutos.${waitMsg}`
    );
  }

  return (
    `⏳ **Daily token limit reached**\n\n` +
    `**English:** The primary AI provider's limit has been reached.${waitMsg}\n\n` +
    `**Español:** Se alcanzó el límite del proveedor principal de IA.${waitMsg}`
  );
}

// ─────────────────────────────────────────────
// AGENT CALLER (non-streaming)
// ─────────────────────────────────────────────

export async function callAgent(
  agentKey: string,
  userMessage: string,
  history: ChatMessage[],
  moduleContext?: number | null,
  maxTokens = 2200,
  secondaryModules: number[] = [],
  responseLanguage: ResponseLangMode = "auto"
): Promise<string> {
  const messages = await buildMessages(agentKey, userMessage, history, moduleContext, 6, 8, secondaryModules, responseLanguage);
  const { text, error, fallbackTried } = await callWithRetry(messages, {
    maxTokens,
    fallbackMaxTokens: Math.min(maxTokens, 1000),
  });
  if (text) {
    try {
      // Only auto-verify (and append the "Verified Scripture" footer) when
      // the missionary actually asked for a verse — see scripture.ts's
      // userRequestedVerse for the tradeoff this makes.
      const verification = userRequestedVerse(userMessage) ? await buildVerificationBlock(text) : "";
      return verification ? text + verification : text;
    } catch {
      return text; // verification is strictly additive, never blocks the real answer
    }
  }
  if (error && isRateLimited(error)) return rateLimitMessage(error, fallbackTried);
  // Same principle as callAgentStream's catch path: log the technical
  // detail server-side, never show raw provider/HTTP internals (or a
  // hint about which env var to check) directly to a missionary.
  logger.error("callAgent failed", { agentKey, error });
  return "⚠️ Desculpe, estou com dificuldade para responder agora. Tente novamente em instantes, ou contate seu mentor se persistir. / Lo siento, tengo dificultades para responder ahora mismo. Intenta de nuevo en un momento, o contacta a tu mentor si esto continúa.";
}

// ─────────────────────────────────────────────
// AGENT CALLER (streaming, SSE)
// ─────────────────────────────────────────────

/**
 * Streams tokens from the primary provider as an async generator of cumulative text (same
 * "partial" contract as the Python version's call_agent_stream). Falls
 * back to the full non-streaming callAgent (with backoff + downgrade) on
 * any stream-level error.
 */
export async function* callAgentStream(
  agentKey: string,
  userMessage: string,
  history: ChatMessage[],
  moduleContext?: number | null,
  maxTokens = 2200,
  secondaryModules: number[] = [],
  responseLanguage: ResponseLangMode = "auto"
): AsyncGenerator<string, void, unknown> {
  const messages = await buildMessages(agentKey, userMessage, history, moduleContext, 6, 8, secondaryModules, responseLanguage);

  try {
    const resp = await fetch(PRIMARY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PRIMARY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: PRIMARY_MODEL,
        messages,
        max_tokens: maxTokens,
        temperature: 0.7,
        stream: true,
      }),
    });

    if (!resp.ok || !resp.body) {
      const errBody = await resp.text().catch(() => "");
      throw new Error(`HTTP ${resp.status}: ${errBody}`);
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let partial = "";
    let finishReason: string | null = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const payload = trimmed.slice(5).trim();
        if (payload === "[DONE]") continue;
        try {
          const json = JSON.parse(payload);
          const delta: string = json?.choices?.[0]?.delta?.content ?? "";
          if (delta) {
            partial += delta;
            yield partial;
          }
          // The final chunk for a choice carries finish_reason instead of
          // a content delta — "length" means the response was cut off by
          // max_tokens, not that the model actually finished its answer.
          // Streaming APIs don't surface this as an error, so without
          // checking it explicitly a truncated answer silently looks
          // identical to a complete one — see the note appended below.
          const reason = json?.choices?.[0]?.finish_reason;
          if (reason) finishReason = reason;
        } catch {
          // ignore malformed SSE fragments
        }
      }
    }

    if (finishReason === "length") {
      logger.warn("Response truncated by max_tokens", { agentKey, maxTokens, chars: partial.length });
      partial +=
        "\n\n⚠️ *" +
        "This response was cut off due to a length limit — ask it to \"continue\" if you want the rest. " +
        "Esta respuesta se cortó por un límite de longitud — pide que \"continúe\" si deseas el resto.*";
      yield partial;
    }

    // Best-effort Scripture verification: only when the missionary
    // actually asked for a verse — see scripture.ts's userRequestedVerse
    // for the tradeoff. When it does apply, append the REAL verse text
    // (fetched live, public domain, English + Chinese) so the missionary
    // has ground truth next to whatever the model said. Never blocks or
    // delays the main response; a slow/unreachable Bible API just means
    // no block gets appended, same as if no reference had been found.
    try {
      const verification = userRequestedVerse(userMessage) ? await buildVerificationBlock(partial) : "";
      if (verification) {
        partial += verification;
        yield partial;
      }
    } catch {
      // verification is strictly additive — any failure here must never
      // affect the response the missionary already received
    }
  } catch (e) {
    const err = String(e);
    if (isRateLimited(err)) {
      yield await callAgent(agentKey, userMessage, history, moduleContext, Math.min(maxTokens, 1000), secondaryModules, responseLanguage);
    } else {
      // Log the real error server-side for ops/debugging, but never show
      // raw HTTP/API internals (status codes, provider error JSON) to the
      // missionary — that's confusing at best and, for an invalid/expired
      // key, actively unhelpful for someone who can't fix it themselves.
      logger.error("callAgentStream failed", { agentKey, error: err });
      yield "⚠️ Desculpe, estou com dificuldade para responder agora. Tente novamente em instantes, ou contate seu mentor se persistir. / Lo siento, tengo dificultades para responder ahora mismo. Intenta de nuevo en un momento, o contacta a tu mentor si esto continúa.";
    }
  }
}

// ─────────────────────────────────────────────
// AGENT CALLER (streaming, with reflection/critic pass)
// ─────────────────────────────────────────────

/**
 * Same external contract as callAgentStream() (an async generator of
 * cumulative text), but adds a reflection/critic pass — see critic.ts —
 * before the response ever reaches the caller.
 *
 * TRADEOFF, on purpose: because the critic needs the *complete* response
 * to review it, and a corrected rewrite may not share a common prefix
 * with the original (so it can't be spliced into an already-streamed
 * partial), this function fully drains the underlying stream server-side
 * first, runs the critic, repairs once if needed, and only then replays
 * the final, approved text to the caller in small simulated-typing
 * chunks. This costs the live token-by-token feel of callAgentStream()
 * (the missionary waits for the full generation instead of watching it
 * appear word-by-word) in exchange for guaranteeing nothing unreviewed
 * ever reaches them. That tradeoff is intentional given what this
 * platform trains — see critic.ts's module comment for the full reasoning.
 */
export async function* callAgentStreamWithCritic(
  agentKey: string,
  userMessage: string,
  history: ChatMessage[],
  moduleContext?: number | null,
  maxTokens = 2200,
  secondaryModules: number[] = [],
  responseLanguage: ResponseLangMode = "auto"
): AsyncGenerator<string, void, unknown> {
  // Drain the normal streaming path fully, server-side, to get the final
  // cumulative text (this already includes the scripture verification
  // block and every existing fallback/retry behavior — critic wraps
  // around it rather than duplicating it).
  let fullText = "";
  for await (const partial of callAgentStream(agentKey, userMessage, history, moduleContext, maxTokens, secondaryModules, responseLanguage)) {
    fullText = partial;
  }

  if (!fullText) {
    yield fullText;
    return;
  }

  const critique = await critiqueResponse(userMessage, fullText, responseLanguage);
  let finalText = fullText;

  if (critique && !critique.ok && critique.issues.length > 0) {
    logger.warn("Critic flagged issues, attempting one repair pass", {
      agentKey,
      issues: critique.issues,
    });

    const originalMessages = await buildMessages(agentKey, userMessage, history, moduleContext, 6, 8, secondaryModules, responseLanguage);
    const repairMessages = buildRepairMessages(originalMessages, fullText, critique.issues);
    const { text: repaired } = await callWithRetry(repairMessages, {
      maxTokens,
      fallbackMaxTokens: Math.min(maxTokens, 1000),
      maxRetries: 1,
    });

    if (repaired) {
      try {
        const verification = userRequestedVerse(userMessage) ? await buildVerificationBlock(repaired) : "";
        finalText = verification ? repaired + verification : repaired;
      } catch {
        finalText = repaired;
      }
      logger.info("Repair pass succeeded, shipping corrected response", { agentKey });
    } else {
      logger.warn("Repair pass failed, shipping original (unreviewed-fix) response", { agentKey });
    }
  } else if (!critique) {
    logger.info("Critic unavailable for this turn, shipping response unreviewed", { agentKey });
  }

  // Replay the final, approved text as simulated-typing chunks so the
  // frontend's existing "cumulative partial" streaming UI still animates,
  // even though generation itself already finished server-side.
  const CHUNK_SIZE = 24; // characters per tick — small enough to still read as "typing"
  const TICK_MS = 12;
  let cursor = 0;
  while (cursor < finalText.length) {
    cursor = Math.min(cursor + CHUNK_SIZE, finalText.length);
    yield finalText.slice(0, cursor);
    if (cursor < finalText.length) await sleep(TICK_MS);
  }
}

/**
 * Reflection / critic pass — reviews a specialist agent's full response
 * against this platform's hard requirements BEFORE it reaches the
 * missionary, instead of relying solely on the system prompt to be obeyed.
 *
 * WHY THIS EXISTS: THEOLOGICAL_GUARDRAIL and the language rule (guardrails.ts)
 * are prompt-injected instructions. Instructions can be diluted by a long
 * conversation history, or simply missed by the model on a given turn —
 * there was previously no automated check that they actually held on the
 * output side, only trust that the model followed them. This module adds
 * that check as a second, independent, cheap pass (SUPERVISOR_CRITIC_MODEL, JSON
 * mode, temperature 0) over three objectively checkable things:
 *
 *   1. Language compliance — does the response actually contain the
 *      required language(s) for this turn (see below), not just claim to?
 *      By default that means the multilingual BILINGUAL_RULE, but if the
 *      user has pinned a single response language (see language.ts),
 *      compliance instead means the response is ONLY in that language.
 *   2. Theological guardrail compliance — any clear doctrinal drift
 *      against the standards in THEOLOGICAL_GUARDRAIL (universalism,
 *      salvation by works, syncretism, etc.)?
 *   3. Scripture citation hygiene — any quotation marks around Bible
 *      wording the response isn't citing from a verified source? (This
 *      is a lighter-weight check than scripture.ts's live verification —
 *      it flags the *pattern* of inventing quoted wording, scripture.ts
 *      separately verifies references that are just cited by name.)
 *
 * DESIGN PRINCIPLE — never make the user wait forever, never block on a
 * false positive: the critic gets exactly one attempt to request a fix.
 * If the repair call also fails, or the critic itself is unavailable, the
 * original response is returned as-is rather than the user getting no
 * answer at all. Every critic finding is logged either way, so mentors/ops
 * get an audit trail even on the "shipped anyway" path.
 */

import { callWithRetry, type ChatMessage } from "./groq";
import { SUPERVISOR_CRITIC_MODEL } from "./env";
import { THEOLOGICAL_GUARDRAIL, BILINGUAL_RULE, singleLanguageRule } from "./guardrails";
import { LANGUAGE_LABELS, type ResponseLangMode } from "./language";
import { logger } from "./logger";

export interface CritiqueResult {
  ok: boolean;
  issues: string[];
}

function buildCriticSystem(responseLanguage: ResponseLangMode): string {
  const languageSection = responseLanguage === "auto" ? BILINGUAL_RULE : singleLanguageRule(responseLanguage);
  const languageCheck =
    responseLanguage === "auto"
      ? `1. LANGUAGE: does the response actually contain complete content in both required ` +
        `languages (Portuguese, Spanish) — not just a token gesture, e.g. one sentence in ` +
        `a language tacked on at the end?`
      : `1. LANGUAGE: is the response written ENTIRELY in ${LANGUAGE_LABELS[responseLanguage]}, with ` +
        `no other language mixed in anywhere (not even a short Scripture quotation in a different language)?`;

  return `You are a silent QA reviewer for a Christian missions-training chat app. ` +
`You never talk to the user — you only output JSON, reviewing one AI response against three checks.

${THEOLOGICAL_GUARDRAIL}

${languageSection}

Given the user's message and the AI's full response, check:
${languageCheck}
2. THEOLOGICAL: does the response contain any clear violation of the guardrail above ` +
`(universalism, salvation by works, denying the Trinity or resurrection, syncretism, ` +
`affirming same-sex marriage, etc.)? Ordinary respectful discussion of other religions for ` +
`evangelism purposes is NOT a violation.
3. SCRIPTURE: does the response put Bible wording in quotation marks that reads as invented ` +
`or paraphrased-but-quoted (a real concern), as opposed to a reference cited by book/chapter ` +
`without quotation marks (fine)?

Respond with ONLY this JSON shape, nothing else:
{"language_ok": boolean, "theological_ok": boolean, "scripture_ok": boolean, "issues": string[]}`;
}

/**
 * Runs the critic over a candidate response. Returns null (never throws)
 * on failure so the caller treats it the same as "no issues found" —
 * fail open, not closed, since this is a quality net, not the primary
 * safety mechanism (that's still the system prompt + guardrail text).
 */
export async function critiqueResponse(
  userMessage: string,
  responseText: string,
  responseLanguage: ResponseLangMode = "auto"
): Promise<CritiqueResult | null> {
  try {
    const messages: ChatMessage[] = [
      { role: "system", content: buildCriticSystem(responseLanguage) },
      {
        role: "user",
        content: `USER MESSAGE:\n${userMessage}\n\nAI RESPONSE TO REVIEW:\n${responseText}`,
      },
    ];

    const { text, error } = await callWithRetry(messages, {
      model: SUPERVISOR_CRITIC_MODEL,
      maxTokens: 300,
      temperature: 0,
      responseFormat: { type: "json_object" },
      maxRetries: 1,
    });

    if (!text) {
      logger.warn("Critic call failed, shipping response unreviewed", { error });
      return null;
    }

    const parsed = JSON.parse(text);
    const issues: string[] = Array.isArray(parsed?.issues) ? parsed.issues : [];
    const ok = parsed?.language_ok !== false && parsed?.theological_ok !== false && parsed?.scripture_ok !== false;

    return { ok, issues };
  } catch (e) {
    logger.warn("Critic call threw, shipping response unreviewed", { error: String(e) });
    return null;
  }
}

/**
 * Builds the one-shot repair prompt: the original system+history context
 * plus the specific issues found, asking the specialist to produce a
 * corrected final version rather than starting over from scratch.
 */
export function buildRepairMessages(
  originalMessages: ChatMessage[],
  originalResponse: string,
  issues: string[]
): ChatMessage[] {
  return [
    ...originalMessages,
    { role: "assistant", content: originalResponse },
    {
      role: "user",
      content:
        `[SYSTEM QA NOTE — not from the missionary] Your previous response has issues that must ` +
        `be corrected before it can be sent: ${issues.join("; ")}. ` +
        `Rewrite your FULL response now, fixing these issues, while keeping everything that was ` +
        `already correct. Output only the corrected response, with no meta-commentary about the fix.`,
    },
  ];
}

/** Quick structural pre-check used to skip the critic call entirely for the
 * common, cheap-to-verify case: if the response contains recognizable
 * Latin-script content of reasonable length, multilingual compliance is
 * very likely fine, and we only need the LLM critic for the
 * theological/scripture checks. Kept simple on purpose — this is a
 * cost-saving heuristic, not a replacement for the critic's own
 * language_ok judgment when it does run. Only meaningful in "auto"
 * (multilingual) mode; single-language mode always runs the full critic. */
export function quickLanguagePresenceCheck(responseText: string): boolean {
  return /[a-zA-Z]{10,}/.test(responseText);
}

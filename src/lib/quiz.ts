/**
 * Quiz generator — 5 MCQ questions per call, ported from harvest_quiz.py.
 * Rendering is handled by the React <QuizPanel> component instead of the
 * original's hand-rolled HTML+onclick+SVG-onload trick, so only the
 * generation logic (prompting + JSON-mode call + retry/top-up) is ported
 * here.
 *
 * LANGUAGE MODE: this build serves Portuguese/Spanish only (a separate,
 * narrower deployment from the English/Portuguese/Spanish build — see
 * language.ts). By default every field is generated in both languages
 * (see the `_pt`/`_es` field sets below). A `lang` parameter
 * ("all" | "pt" | "es") lets the caller pin a single output language
 * instead — the schema and prompt sent to the model only ask for that
 * one language's fields, which also cuts token usage roughly in half.
 * The offline fallback bank (questionBank.ts) is hand-authored in
 * English only and is NOT served on this build's total-outage path (see
 * generateQuizQuestions) — an English-only fallback would defeat the
 * purpose of a Portuguese/Spanish-only deployment, so that path simply
 * returns an apologetic bilingual error instead.
 */

import { retrieveContext } from "./retrieval";
import { MODULE_NAMES } from "./agents";
import { MODULE_SEEDS } from "./caseSeeds";
import { callWithRetry } from "./groq";
import { LANGUAGE_LABELS, type GenLangMode, type ContentLanguage } from "./language";

export interface QuizQuestion {
  n: number;
  q_pt?: string;
  q_es?: string;
  a?: string; a_es?: string;
  b?: string; b_es?: string;
  c?: string; c_es?: string;
  d?: string; d_es?: string;
  e?: string; e_es?: string;
  correct: string; // a|b|c|d|e
  why_correct_pt?: string;
  why_correct_es?: string;
  why_wrong_pt?: string;
  why_wrong_es?: string;
}

export interface QuizResult {
  module_title?: string;
  questions?: QuizQuestion[];
  error?: string;
}

// English keeps the bare (unsuffixed) option letters — Spanish uses
// the _es suffix. (No ambiguity here since there are only two languages;
// English was picked as the "primary" simply because it's listed first
// in ContentLanguage — internally still keyed "pt", see language.ts.)
const QUIZ_SCHEMA_ALL = `{
  "module_title": "...",
  "questions": [
    {
      "n": 1,
      "q_pt": "Question in English?",
      "q_es": "¿Pregunta en español?",
      "a": "Option A", "a_es": "Opción A",
      "b": "Option B", "b_es": "Opción B",
      "c": "Option C", "c_es": "Opción C",
      "d": "Option D", "d_es": "Opción D",
      "e": "Option E", "e_es": "Opción E",
      "correct": "b",
      "why_correct_pt": "Why B is correct...",
      "why_correct_es": "Por qué B es correcto...",
      "why_wrong_pt": "A: reason. C: reason. D: reason. E: reason.",
      "why_wrong_es": "A: razón. C: razón. D: razón. E: razón."
    }
  ]
}`;

function letterKey(letter: string, lang: ContentLanguage): string {
  return lang === "pt" ? letter : `${letter}_${lang}`;
}

function buildSingleLangSchema(lang: ContentLanguage): string {
  const qKey = `q_${lang}`;
  const wcKey = `why_correct_${lang}`;
  const wwKey = `why_wrong_${lang}`;
  return `{
  "module_title": "...",
  "questions": [
    {
      "n": 1,
      "${qKey}": "Question text?",
      "${letterKey("a", lang)}": "Option A",
      "${letterKey("b", lang)}": "Option B",
      "${letterKey("c", lang)}": "Option C",
      "${letterKey("d", lang)}": "Option D",
      "${letterKey("e", lang)}": "Option E",
      "correct": "b",
      "${wcKey}": "Why B is correct...",
      "${wwKey}": "A: reason. C: reason. D: reason. E: reason."
    }
  ]
}`;
}

function buildQuizSystem(lang: GenLangMode): string {
  const schema = lang === "all" ? QUIZ_SCHEMA_ALL : buildSingleLangSchema(lang);
  const languageRule =
    lang === "all"
      ? "- All options (a–e) must have Portuguese AND Spanish fields"
      : `- Write EVERYTHING only in ${LANGUAGE_LABELS[lang]} — do not include any other language anywhere`;

  return `You are the Assessment Agent for the Global Harvest Initiative.
Generate exactly 5 ADVANCED multiple-choice quiz questions grounded in the curriculum content.

Respond with a JSON object matching this schema exactly:
${schema}

QUESTION DIFFICULTY (distribute across the 5 questions):
- Comprehension: explain a nuanced concept from the curriculum — NOT simple recall
- Biblical analysis: interpret a Scripture passage in its missiological context
- Cross-cultural application: apply a principle to a real scenario (Muslim, Buddhist, Chinese, diaspora)
- Critical comparison: distinguish two similar but importantly different concepts
- Synthesis: combine multiple principles to evaluate a real ministry decision or dilemma

ADVANCED STANDARDS:
- Questions must require ANALYSIS, not memory — challenge the student to think
- Distractors must be partially true or commonly confused — never obviously wrong
- At least 2 questions must cite a specific Bible verse (book chapter:verse) in the question or answer
- Set scenarios in specific named countries and cultural contexts
- Test cross-cultural tensions: filial piety vs. discipleship, honor/shame vs. guilt/innocence, contextualization vs. syncretism
- why_correct: 1-2 concise sentences explaining the theological and cultural reasoning
- why_wrong: one short phrase per wrong option showing WHY it fails — not a full sentence

CRITICAL RULES:
- NEVER reference author names or book titles — test CONCEPTS and PRINCIPLES only
- Each question has exactly ONE correct answer (a/b/c/d/e)
${languageRule}`;
}

function extractJson(raw: string): any {
  const text = raw.replace(/```(?:json)?/g, "").trim();
  return JSON.parse(text);
}

async function quizCallBatch(system: string, prompt: string, expectedCount = 5, maxAttempts = 3): Promise<QuizResult> {
  let accumulated: QuizQuestion[] = [];
  let currentPrompt = prompt;
  let moduleTitle: string | undefined;
  let lastError: string | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const remaining = expectedCount - accumulated.length;
    const messages = [
      { role: "system" as const, content: system },
      { role: "user" as const, content: currentPrompt },
    ];
    // Bilingual (English + Español) mode packs question + 5 options + explanation twice per question — 3600 was tight enough to truncate mid-JSON for some modules ("Unterminated string" parse failures). 5200 gives real headroom while still being a small fraction of the model's context window.
    const tokens = remaining >= expectedCount ? 5200 : Math.max(1100, 900 * remaining);

    const { text, error } = await callWithRetry(messages, {
      maxTokens: tokens,
      temperature: 0.5,
      responseFormat: { type: "json_object" },
      reasoningEffort: "low",
    });

    if (text) {
      try {
        const data = extractJson(text);
        moduleTitle = moduleTitle ?? data.module_title;
        accumulated = accumulated.concat(data.questions ?? []);
      } catch (e) {
        lastError = `JSON parse error: ${e}`;
      }
    } else if (error) {
      lastError = error;
    }

    if (accumulated.length >= expectedCount) {
      return { module_title: moduleTitle, questions: accumulated.slice(0, expectedCount) };
    }

    if (attempt < maxAttempts - 1) {
      const stillNeeded = expectedCount - accumulated.length;
      console.warn(`  ⚠️  Quiz batch has ${accumulated.length}/${expectedCount}, asking for ${stillNeeded} more...`);
      currentPrompt =
        `${prompt}\n\nYou previously provided ${accumulated.length} question(s) for this batch. ` +
        `Generate exactly ${stillNeeded} NEW additional question(s) — do not repeat the earlier ` +
        `ones. Return only the JSON object with a 'questions' array containing just these ` +
        `${stillNeeded} new question(s).`;
    }
  }

  if (accumulated.length > 0) {
    return { module_title: moduleTitle, questions: accumulated };
  }
  const detail = lastError ? ` Details: ${lastError}` : "";
  return { error: `Model returned no usable questions after ${maxAttempts} attempts.${detail}` };
}

export async function generateQuizQuestions(
  moduleNum: number,
  customInstructions = "",
  lang: GenLangMode = "all"
): Promise<QuizResult> {
  const title = MODULE_NAMES[moduleNum] ?? `Module ${moduleNum}`;
  const seedQuery = MODULE_SEEDS[moduleNum] ?? title;
  const bookCtx = await retrieveContext(seedQuery, [moduleNum], 6, 5000);
  const ctxBlock = bookCtx ? `\n\n=== CURRICULUM CONTENT (BM25) ===\n${bookCtx}` : "";

  const system = buildQuizSystem(lang) + ctxBlock;
  // When the instructor gives specific directions, those override the
  // generic topic-mix below — ALL 5 questions should center on the
  // requested focus, not just loosely relate to it. Without this
  // explicit override language, the model tended to treat instructor
  // directions as one extra consideration alongside the generic mix
  // rather than the actual topic to build every question around (e.g.
  // asking for "hamartiology in a Hindu context" produced generic
  // contextualization questions that only tangentially touched sin).
  const customBlock = customInstructions.trim()
    ? `\n\n⭐ INSTRUCTOR DIRECTIONS (this OVERRIDES the generic topic mix above — ` +
      `ALL 5 questions must center specifically on this, not just loosely relate to it):\n` +
      `${customInstructions.trim()}`
    : "";

  const prompt =
    `Module ${moduleNum}: ${title}\n` +
    (customInstructions.trim()
      ? `Generate 5 questions.`
      : `Generate 5 questions covering a mix of: comprehension of key concepts, biblical text ` +
        `analysis, cross-cultural application to real field scenarios, and critical comparison of ` +
        `similar concepts.`) +
    `${customBlock}\n\n` +
    `IMPORTANT: the 'questions' array must contain EXACTLY 5 question objects — not 3, not 4. ` +
    `Count them before responding. Return only the JSON.`;

  const result = await quizCallBatch(system, prompt, 5, 3);
  if (result.error) {
    // Last resort: both Groq and Cerebras (via callWithRetry's own
    // internal fallback chain) are completely unreachable. This build's
    // offline fallback bank (questionBank.ts) is English-only, and
    // serving English on a Portuguese/Spanish-only deployment would be
    // more confusing than helpful — so this rare path returns the plain
    // error instead of a mismatched-language fallback question.
    console.warn(`  ⚠️  Quiz generation failed for module ${moduleNum}; no offline fallback on this build.`);
    return result;
  }

  const questions = result.questions ?? [];
  questions.forEach((q, i) => (q.n = i + 1));

  return { module_title: title, questions };
}

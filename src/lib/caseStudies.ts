/**
 * Case study generator — ported from harvest_case_studies.py. Generates
 * one deeply-researched missionary case study per call.
 *
 * LANGUAGE MODE: this build serves Portuguese/Spanish only (a separate,
 * narrower deployment from the English/Portuguese/Spanish build — see
 * language.ts). By default every field is generated in both languages.
 * A `lang` parameter ("all" | "pt" | "es") lets the caller pin a single
 * output language instead — the schema and prompt only ask for that one
 * language's fields, cutting token usage roughly in half. This build's
 * offline fallback bank is not used (see generateCaseStudies) since
 * questionBank.ts is English-only — mismatched with a Portuguese/
 * Spanish-only deployment.
 */

import { retrieveContext } from "./retrieval";
import { MODULE_NAMES } from "./agents";
import { MODULE_SEEDS } from "./caseSeeds";
import { callWithRetry } from "./groq";
import { offlineFallbackCase } from "./questionBank";
import { LANGUAGE_LABELS, type GenLangMode, type ContentLanguage } from "./language";

export interface CaseStudy {
  n: number;
  title_pt?: string; title_es?: string;
  context_pt?: string; context_es?: string;
  challenge_pt?: string; challenge_es?: string;
  principles_pt?: string[]; principles_es?: string[];
  discussion_questions_pt?: string[]; discussion_questions_es?: string[];
  recommended_approach_pt?: string; recommended_approach_es?: string;
  scripture_anchor_pt?: string; scripture_anchor_es?: string;
  lesson_pt?: string; lesson_es?: string;
}

export interface CaseStudyResult {
  module_title?: string;
  cases?: CaseStudy[];
  error?: string;
}

const CASE_SCHEMA_ALL = `{
  "module_title": "...",
  "cases": [
    {
      "n": 1,
      "title_pt": "Case title",
      "title_es": "Título del caso",
      "context_pt": "Rich context: country, ethnic group, religion, the missionary's situation (4-6 sentences).",
      "context_es": "Contexto detallado: país, grupo étnico, religión, situación del misionero (4-6 frases).",
      "challenge_pt": "The specific dilemma or decision the missionary faces (3-4 sentences).",
      "challenge_es": "El dilema o decisión específica que enfrenta el misionero (3-4 frases).",
      "principles_pt": ["Key principle from the curriculum", "Second principle", "Third principle"],
      "principles_es": ["Principio clave del currículo", "Segundo principio", "Tercer principio"],
      "discussion_questions_pt": ["Analytical question 1?", "Application question 2?", "Evaluation question 3?"],
      "discussion_questions_es": ["¿Pregunta analítica 1?", "¿Pregunta de aplicación 2?", "¿Pregunta de evaluación 3?"],
      "recommended_approach_pt": "A thoughtful, theologically grounded response that acknowledges the cultural tension and biblical principles (4-6 sentences).",
      "recommended_approach_es": "Respuesta matizada y fundamentada teológicamente que reconoce la tensión cultural y los principios bíblicos (4-6 frases).",
      "scripture_anchor_pt": "A specific verse (Book chapter:verse) and 2-3 sentences of application.",
      "scripture_anchor_es": "Versículo específico (Libro capítulo:versículo) y 2-3 frases de aplicación.",
      "lesson_pt": "Main pedagogical lesson in 2-3 sentences.",
      "lesson_es": "Lección pedagógica principal en 2-3 frases."
    }
  ]
}`;

function buildSingleLangSchema(lang: ContentLanguage): string {
  return `{
  "module_title": "...",
  "cases": [
    {
      "n": 1,
      "title_${lang}": "Case title",
      "context_${lang}": "Rich background: country, people group, religion, missionary situation (4-6 sentences).",
      "challenge_${lang}": "The specific dilemma or decision the missionary faces (3-4 sentences).",
      "principles_${lang}": ["Key principle from the curriculum", "Second principle", "Third principle"],
      "discussion_questions_${lang}": ["Analytical question 1?", "Application question 2?", "Evaluation question 3?"],
      "recommended_approach_${lang}": "Nuanced, theologically grounded response that acknowledges the cultural tension and biblical principles (4-6 sentences).",
      "scripture_anchor_${lang}": "Specific verse (Book chapter:verse) and 2-3 sentences of application.",
      "lesson_${lang}": "Core pedagogical takeaway in 2-3 sentences."
    }
  ]
}`;
}

function buildCaseSystem(full: boolean, lang: GenLangMode): string {
  const schema = lang === "all" ? CASE_SCHEMA_ALL : buildSingleLangSchema(lang);
  const languageRule =
    lang === "all"
      ? "bilingual PT+ES all fields"
      : `everything only in ${LANGUAGE_LABELS[lang]} — no other language anywhere`;

  if (full) {
    return `You are the Case Study Author for the Global Harvest Initiative.
Write ONE deeply researched, realistic missionary case study grounded in the curriculum content.

Respond with a JSON object with "module_title" and "cases" (array with ONE case), matching this schema exactly:
${schema}

QUALITY STANDARDS:
- Set the case in a SPECIFIC named country and people group — make it feel real
- The missionary character's background should fit the target context whenever contextually appropriate
- The dilemma must be GENUINE — no easy answers; the culturally tempting choice is wrong or incomplete
- Context must include: country, city or region, cultural/religious background, missionary's situation
- If the case involves someone with bad intent (an informant, a social engineer, a plausible-sounding
  contact), that person must ALSO have already provided real, verifiable help or value before making the
  risky ask — never an obvious red flag from the first interaction. Realistic manipulation builds
  trust first; a case where the deception is instantly obvious teaches nothing.
- Principles must come directly from the curriculum content provided, not generic mission theory
- Discussion questions must push toward analysis, application, and evaluation — not simple recall
- Recommended approach must be theologically sound AND culturally sensitive, and must explicitly name
  a real cost, risk, or trade-off accepted by choosing it — never a clean resolution where nothing is
  given up. If the approach involves declining or restricting something (data, access, a cultural
  practice), state what legitimate benefit is sacrificed by doing so.
- If the case touches syncretism or contextualization, name the SPECIFIC theological distinction at
  stake (e.g., the line between honoring the dead and venerating them; between contextualized form and
  altered content) — never just say "avoid syncretism" without saying where the actual line is and why.
- If the case touches digital or physical security practice, name CONCRETE tools, apps, or specific
  habits (e.g., "Signal with usernames instead of phone numbers," "strip photo geolocation before
  taking the picture, not just before sending it") — never generic terms like "use encryption" or
  "be careful with data" with nothing specific underneath them.
- If the case genuinely combines two distinct decision domains (e.g., a security choice AND a cultural
  adaptation choice), structure it as two clearly separated decision points the reader reasons through
  in turn, rather than merging both into a single blended resolution.
- Scripture anchor must be specifically applicable, not generic
- NEVER reference author names or book titles
- Write ${languageRule}

LENGTH: be vivid but economical. context/challenge/recommended_approach fields: 4-7 sentences each
(each language's version should be a natural translation of the same case, not an independent essay).
3-5 principles, 3-4 discussion questions. This must all fit comfortably within the response budget —
do not let any single field run long at the expense of finishing the JSON object.`;
  }

  return `You are a missionary case study author. Write ONE realistic case study.
Respond with a JSON object with "module_title" and "cases" (one case), matching this schema:
${schema}
Rules: specific country and people group; genuine dilemma with no clean resolution — the recommended
approach must name a real cost or trade-off it accepts; any deceptive character must have given real
help before the risky ask (never an obvious red flag); name concrete tools/practices for any security
detail, and the specific theological line for any syncretism concern; write ${languageRule};
principles from curriculum; no author/book references. Keep every field short and concrete —
2-3 sentences per text field, 3 principles, 3 discussion questions. Finishing the complete JSON
object matters more than length; do not run any field long.`;
}

const CASE_TYPE_COMBINED = {
  label: "cultural, strategic, and/or theological dilemma",
  instructions:
    "The case should involve a realistic, multi-dimensional dilemma that draws on one or more of: " +
    "a cultural/interpersonal tension (ancestor veneration, honor-shame dynamics, family pressure, " +
    "face/honor conflicts), a strategic ministry decision (church structure, contextualization of " +
    "worship, leadership handover, dependency vs. empowerment), and/or a theological/ethical " +
    "challenge (syncretism pressure, persecution response, false teaching, interfaith marriage). " +
    "Pick whichever combination makes the richest, most realistic scenario for this module — it " +
    "does not need to touch all three.",
};

function requiredFieldsFor(lang: GenLangMode): { text: string[]; list: string[] } {
  if (lang === "all") {
    return {
      text: [
        "title_pt", "title_es", "context_pt", "context_es", "challenge_pt", "challenge_es",
        "recommended_approach_pt", "recommended_approach_es",
        "scripture_anchor_pt", "scripture_anchor_es",
        "lesson_pt", "lesson_es",
      ],
      list: ["principles_pt", "principles_es", "discussion_questions_pt", "discussion_questions_es"],
    };
  }
  return {
    text: [
      `title_${lang}`, `context_${lang}`, `challenge_${lang}`,
      `recommended_approach_${lang}`, `scripture_anchor_${lang}`, `lesson_${lang}`,
    ],
    list: [`principles_${lang}`, `discussion_questions_${lang}`],
  };
}

function parseCaseJson(raw: string, lang: GenLangMode): { module_title?: string; cases: any[] } {
  const text = raw.replace(/```(?:json)?/g, "").trim();
  const data = JSON.parse(text);
  const cases: any[] = data.cases ?? [];
  const required = requiredFieldsFor(lang);
  for (const c of cases) {
    for (const key of required.text) if (c[key] === undefined) c[key] = "—";
    for (const key of required.list) if (c[key] === undefined) c[key] = [];
  }
  return { module_title: data.module_title, cases };
}

async function generateSingleCase(
  caseNum: number,
  caseType: string,
  caseInstructions: string,
  moduleNum: number,
  title: string,
  bookCtx: string,
  lang: GenLangMode
): Promise<{ case: CaseStudy | null; error: string | null }> {
  const ctxBlock = bookCtx ? `\n\n=== CURRICULUM CONTENT (BM25) ===\n${bookCtx}` : "";
  const system = buildCaseSystem(true, lang) + ctxBlock;

  const prompt =
    `Module ${moduleNum}: ${title}\n\n` +
    `Write Case ${caseNum} — type: ${caseType}\n\n` +
    `${caseInstructions}\n\n` +
    `Make it deeply realistic: name the country, city, people group. ` +
    `Mine the curriculum content for specific principles. ` +
    `Return only the JSON object (one case in the 'cases' array, n=${caseNum}).`;

  const messages = [
    { role: "system" as const, content: system },
    { role: "user" as const, content: prompt },
  ];

  let { text, error } = await callWithRetry(messages, {
    maxTokens: 4600,
    temperature: 0.6,
    responseFormat: { type: "json_object" },
    reasoningEffort: "low",
  });

  if (!text) {
    const shortCtx = await retrieveContext(MODULE_SEEDS[moduleNum] ?? title, [moduleNum], 2, 1000);
    const fbSystem = buildCaseSystem(false, lang) + (shortCtx ? `\n\n=== CONTENT ===\n${shortCtx}` : "");
    const fbMessages = [
      { role: "system" as const, content: fbSystem },
      { role: "user" as const, content: prompt },
    ];
    const fb = await callWithRetry(fbMessages, {
      maxTokens: 3700,
      temperature: 0.6,
      responseFormat: { type: "json_object" },
      reasoningEffort: "low",
    });
    text = fb.text;
    error = fb.error ?? error;
    if (!text) return { case: null, error };
  }

  try {
    const parsed = parseCaseJson(text, lang);
    const cases = parsed.cases ?? [];
    if (cases.length === 0) return { case: null, error: "Model returned no cases in its response." };
    const c = cases[0];
    c.n = caseNum;
    return { case: c as CaseStudy, error: null };
  } catch (e) {
    return { case: null, error: `JSON parse error: ${e}` };
  }
}

export async function generateCaseStudies(
  moduleNum: number,
  customInstructions = "",
  lang: GenLangMode = "all"
): Promise<CaseStudyResult> {
  const title = MODULE_NAMES[moduleNum] ?? `Module ${moduleNum}`;
  const seed = MODULE_SEEDS[moduleNum] ?? title;
  const bookCtx = await retrieveContext(seed, [moduleNum], 7, 5000);

  // Same override language as quiz.ts's identical fix — see that
  // comment for why this needs to be explicit rather than just
  // appended as one more consideration alongside the generic
  // combined-type instructions.
  const extra = customInstructions.trim()
    ? `\n\n⭐ INSTRUCTOR DIRECTIONS (this OVERRIDES the generic dilemma-type guidance above — ` +
      `the case must center specifically on this, not just loosely relate to it):\n` +
      `${customInstructions.trim()}`
    : "";
  const { label, instructions } = CASE_TYPE_COMBINED;

  const { case: theCase, error } = await generateSingleCase(1, label, instructions + extra, moduleNum, title, bookCtx, lang);

  if (!theCase) {
    // Last resort: both the primary and fallback-model Groq/Cerebras
    // attempts inside generateSingleCase have failed. Serve the
    // hand-authored offline fallback bank (questionBank.ts, bilingual
    // English/Spanish to match this deployment) instead of a bare
    // error, so a missionary still gets *something* useful during a
    // provider outage.
    const fallback = offlineFallbackCase(moduleNum, title);
    if (fallback) return fallback;
    const detail = error ? `\n\nDetails: ${error}` : "";
    return { error: `Could not generate the case study after retrying.${detail}` };
  }

  return { module_title: title, cases: [theCase] };
}

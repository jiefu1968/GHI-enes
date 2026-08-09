// Shared response-language types, used by chat (guardrails.ts/groq.ts),
// quiz.ts, and caseStudies.ts, plus their client components.
//
// This build serves an English/Spanish-only audience — a sibling
// deployment to the Portuguese/Spanish and English/Chinese builds, all
// three sharing the same underlying architecture and API providers.
// Portuguese has been removed from every user-facing layer: the UI,
// the AI's output language, quiz/case study generation, and mentor
// tooling. The internal field/type identifier stays "pt" throughout
// this codebase (quiz.ts, caseStudies.ts, entryAssessment.ts, the
// Prisma schema) purely to minimize the size and risk of this port —
// only WHAT LANGUAGE that slot actually contains (English, not
// Portuguese) and its user-facing LABEL changed, not the field name
// itself. The AI agents' own internal instructions (system prompts in
// agents.ts) remain written in English — that's invisible plumbing the
// model reads, not something the missionary ever sees.

export type ContentLanguage = "pt" | "es"; // "pt" slot now carries English — see note above

// Chat: "auto" means both languages together, every response — see
// guardrails.ts's BILINGUAL_RULE.
export type ResponseLangMode = "auto" | ContentLanguage;

// Quiz / case study: "all" means both languages together (same spirit
// as chat's "auto").
export type GenLangMode = "all" | ContentLanguage;

export const LANGUAGE_LABELS: Record<ContentLanguage, string> = {
  pt: "English",
  es: "Español",
};

// Generic, module-agnostic question templates — shown when a missional
// Christian selects a specific specialist in the sidebar but hasn't
// asked anything yet (see MessageList.tsx's ModuleWelcome). People often
// don't know what to ask a specialist they've never talked to before;
// these give them a one-click starting point.
//
// Deliberately TEMPLATE-based rather than hand-written per module —
// authoring genuinely good, specific examples for all 37 modules would
// be ~150 lines of real content work. Instead, "{module}" gets filled in
// with that module's own name (in each language) at render time, so one
// small set of templates covers every specialist automatically. If a
// particular module deserves a sharper, hand-written example later, add
// it to MODULE_SPECIFIC_SUGGESTIONS below and it'll be used instead of
// the generic templates for that module only.

export interface PromptTemplate {
  en: string;
  es: string;
}

export const PROMPT_SUGGESTION_TEMPLATES: PromptTemplate[] = [
  {
    en: "Explain the key idea of {module} in simple terms, as if teaching someone new to the topic.",
    es: "Explica la idea clave de {module} en términos sencillos, como si le enseñaras a alguien nuevo en el tema.",
  },
  {
    en: "Give me a real-world scenario where understanding {module} would matter.",
    es: "Dame un escenario real donde entender {module} sea importante.",
  },
  {
    en: "What's a common misconception people have about {module}?",
    es: "¿Cuál es un malentendido común que la gente tiene sobre {module}?",
  },
  {
    en: "What's the single most important thing to remember about {module}?",
    es: "¿Cuál es la cosa más importante que hay que recordar sobre {module}?",
  },
];

// Optional per-module overrides — leave empty by default. If you want
// sharper, hand-written examples for a specific module instead of the
// generic templates above, add an entry here keyed by module number,
// with the SAME shape as PROMPT_SUGGESTION_TEMPLATES. Any module WITHOUT
// an entry here just uses the generic templates, filled with that
// module's name.
export const MODULE_SPECIFIC_SUGGESTIONS: Record<number, PromptTemplate[]> = {};

export function suggestionsForModule(moduleNum: number): PromptTemplate[] {
  return MODULE_SPECIFIC_SUGGESTIONS[moduleNum] ?? PROMPT_SUGGESTION_TEMPLATES;
}

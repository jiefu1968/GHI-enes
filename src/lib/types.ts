// Client-safe types only — do not import from lib/groq.ts, lib/mentor.ts,
// etc. into client components; those touch env vars / Prisma / fs and
// would otherwise get pulled into the browser bundle.

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AgentSummary {
  key: string;
  name: string;
  emoji: string;
  color?: string;
  moduleNum?: number;
}

import type { ChatMessage } from "./types";

// ── Local-only chat lines ─────────────────────────────────────────────
// Some lines in the chat are purely UI — e.g. the "Now talking to <agent>"
// card shown when the person clicks a different specialist mid-conversation.
// They must NEVER be sent to the model as history, nor appear in exported
// PDFs. Rather than widen the shared ChatMessage type (used all over the
// app), they are ordinary assistant messages whose content starts with an
// invisible marker; isLocalMessage()/stripLocalMessages() are the single
// place that knows about it.
const MARK = "\u2063\u2063ghi-local:";

export type IntroTarget =
  | { kind: "module"; moduleNum: number }
  | { kind: "group"; groupId: string }
  | { kind: "coordinator" };

export function makeIntroMessage(target: IntroTarget): ChatMessage {
  const payload =
    target.kind === "module" ? `m:${target.moduleNum}` : target.kind === "group" ? `g:${target.groupId}` : "o";
  return { role: "assistant", content: MARK + payload };
}

export function parseIntro(content: string): IntroTarget | null {
  if (!content.startsWith(MARK)) return null;
  const payload = content.slice(MARK.length);
  if (payload.startsWith("m:")) {
    const n = Number(payload.slice(2));
    return Number.isFinite(n) ? { kind: "module", moduleNum: n } : null;
  }
  if (payload.startsWith("g:")) return { kind: "group", groupId: payload.slice(2) };
  if (payload === "o") return { kind: "coordinator" };
  return null;
}

export function isLocalMessage(m: ChatMessage): boolean {
  return typeof m.content === "string" && m.content.startsWith(MARK);
}

export function stripLocalMessages(list: ChatMessage[]): ChatMessage[] {
  return list.filter((m) => !isLocalMessage(m));
}

// An attached file is pasted into the user's message as a delimited block
// (see ChatApp.send). It should not be reprinted in a single-answer PDF.
export function stripAttachmentBlock(text: string): string {
  return text.replace(/\[Attached file:[\s\S]*?\[End of attached file\]\s*/g, "").trim();
}

// ── <br> inside markdown ───────────────────────────────────────────────
// Models often put "<br>" inside table cells to force a line break.
// react-markdown (correctly) does not render raw HTML, so the tag showed up
// as literal text. We swap it for a token before parsing and turn the token
// back into a real <br/> when rendering (see MessageList.tsx).
export const BR_TOKEN = "\u2060BR\u2060";
export function protectLineBreaks(text: string): string {
  return text.replace(/<br\s*\/?>/gi, BR_TOKEN);
}
// For text-to-speech: a spoken pause, not the word "br".
export function plainFromBreaks(text: string): string {
  return text.replace(/<br\s*\/?>/gi, " ");
}

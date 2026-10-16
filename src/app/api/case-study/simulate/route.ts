import { NextResponse } from "next/server";
import { requireSession } from "@/lib/apiAuth";
import { isContentLanguage } from "@/lib/caseTranslate";
import { isSimAction, sanitizeHistory, simulateCase } from "@/lib/caseSimulate";
import type { CaseStudy } from "@/lib/caseStudies";

// POST { action: "start" | "reply" | "finish", case, history, lang } -> { reply }
export async function POST(req: Request) {
  const { response } = await requireSession("user");
  if (response) return response;

  let body: { action?: unknown; case?: unknown; history?: unknown; lang?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!isSimAction(body.action)) return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  if (!isContentLanguage(body.lang)) return NextResponse.json({ error: "Unsupported language." }, { status: 400 });
  if (!body.case || typeof body.case !== "object" || Array.isArray(body.case)) {
    return NextResponse.json({ error: "Missing case." }, { status: 400 });
  }

  const result = await simulateCase({
    action: body.action,
    theCase: body.case as CaseStudy,
    history: sanitizeHistory(body.history),
    lang: body.lang,
  });
  if (!result.reply) {
    return NextResponse.json({ error: result.error ?? "Simulation failed." }, { status: result.status ?? 502 });
  }
  return NextResponse.json({ reply: result.reply });
}

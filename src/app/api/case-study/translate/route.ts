import { NextResponse } from "next/server";
import { requireSession } from "@/lib/apiAuth";
import { isContentLanguage, translateCase } from "@/lib/caseTranslate";
import type { CaseStudy } from "@/lib/caseStudies";

// POST { case, targetLang } -> { case }   (the same case, with the new language added)
export async function POST(req: Request) {
  const { response } = await requireSession("user");
  if (response) return response;

  let body: { case?: unknown; targetLang?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!isContentLanguage(body.targetLang)) {
    return NextResponse.json({ error: "Unsupported target language." }, { status: 400 });
  }
  if (!body.case || typeof body.case !== "object" || Array.isArray(body.case)) {
    return NextResponse.json({ error: "Missing case to translate." }, { status: 400 });
  }

  const result = await translateCase(body.case as CaseStudy, body.targetLang);
  if (!result.case) {
    return NextResponse.json({ error: result.error ?? "Translation failed." }, { status: 502 });
  }
  return NextResponse.json({ case: result.case });
}

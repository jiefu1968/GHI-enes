import { NextRequest, NextResponse } from "next/server";
import { readSession } from "@/lib/auth";
import { generateCaseStudies } from "@/lib/caseStudies";
import { logActivity } from "@/lib/mentor";
import { TOTAL_MODULES } from "@/lib/curriculumConfig";
import type { GenLangMode } from "@/lib/language";

export const runtime = "nodejs";

const VALID_GEN_LANGUAGES: GenLangMode[] = ["all", "pt", "es"];

export async function POST(req: NextRequest) {
  const session = await readSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { module, customInstructions, lang: rawLang } = (await req.json().catch(() => ({}))) as {
    module?: number;
    customInstructions?: string;
    lang?: GenLangMode;
  };
  if (!module || module < 1 || module > TOTAL_MODULES) {
    return NextResponse.json({ error: `module must be 1-${TOTAL_MODULES}` }, { status: 400 });
  }
  const lang: GenLangMode = VALID_GEN_LANGUAGES.includes(rawLang as GenLangMode) ? (rawLang as GenLangMode) : "all";

  const result = await generateCaseStudies(module, customInstructions ?? "", lang);

  if (session.missionaryId && !result.error) {
    await logActivity(session.missionaryId, "assistant", `[Case study generated: ${result.module_title}]`, "case_study", module);
  }

  return NextResponse.json(result);
}

import { NextRequest, NextResponse } from "next/server";
import { readSession } from "@/lib/auth";
import { ASSESSMENT_QUESTIONS, type AssessmentArea } from "@/lib/entryAssessment";

export const runtime = "nodejs";

// POST /api/assessment/check — reveals correct/incorrect PER QUESTION and
// a score, but ONLY for the one area (~20 questions) the client asks
// about — never the other 4 areas' answers. This is intentionally
// separate from the final POST /api/assessment (which scores and saves
// the full 100-question result): checking one area mid-test is a
// read-only, non-persisted peek, so retaking/reviewing an area doesn't
// touch the one-time saved snapshot the mentor sees.
export async function POST(req: NextRequest) {
  const session = await readSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    area?: AssessmentArea;
    answers?: Record<number, number>;
  };
  const { area, answers } = body;
  if (!area || !answers || typeof answers !== "object") {
    return NextResponse.json({ error: "area and answers are required" }, { status: 400 });
  }

  const areaQuestions = ASSESSMENT_QUESTIONS.filter((q) => q.area === area);
  if (areaQuestions.length === 0) {
    return NextResponse.json({ error: "Unknown area" }, { status: 400 });
  }

  let score = 0;
  const results = areaQuestions.map((q) => {
    const selected = answers[q.id];
    const isCorrect = selected === q.correct;
    if (isCorrect) score += 1;
    return { id: q.id, correct: q.correct, isCorrect };
  });

  return NextResponse.json({ results, score, total: areaQuestions.length });
}

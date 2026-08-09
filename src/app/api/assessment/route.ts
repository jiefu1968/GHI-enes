import { NextRequest, NextResponse } from "next/server";
import { readSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ASSESSMENT_QUESTIONS, type AssessmentArea } from "@/lib/entryAssessment";

export const runtime = "nodejs";

const AREAS: AssessmentArea[] = ["foundations", "formation", "intercultural", "strategy", "evangelism"];

// GET: fetch the 100 fixed questions (never sent with the `correct`
// field so a curious client can't peek at answers via devtools) plus
// the missionary's existing result, if they've already taken it — the
// client shows the result screen directly in that case instead of the
// test itself, since this is meant to be a one-time entry snapshot.
export async function GET() {
  const session = await readSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const questions = ASSESSMENT_QUESTIONS.map(({ correct, ...rest }) => rest);

  let existing = null;
  if (session.missionaryId) {
    existing = await prisma.entryAssessment.findUnique({ where: { missionaryId: session.missionaryId } });
  }

  return NextResponse.json({ questions, result: existing });
}

// POST: receives { answers: { [questionId]: selectedOptionIndex } },
// scores it server-side against ASSESSMENT_QUESTIONS (never trusting a
// client-computed score), and upserts the result — retaking overwrites
// the previous snapshot rather than keeping history, matching the
// "one-time entry diagnostic" design (see entryAssessment.ts's own
// comment on the Prisma model).
export async function POST(req: NextRequest) {
  const session = await readSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (!session.missionaryId) {
    return NextResponse.json({ error: "No missionary identity on this session — set your name first." }, { status: 400 });
  }

  const { answers } = (await req.json().catch(() => ({}))) as { answers?: Record<number, number> };
  if (!answers || typeof answers !== "object") {
    return NextResponse.json({ error: "answers object is required" }, { status: 400 });
  }

  const scoresByArea: Record<AssessmentArea, number> = {
    foundations: 0, formation: 0, intercultural: 0, strategy: 0, evangelism: 0,
  };
  let total = 0;
  for (const q of ASSESSMENT_QUESTIONS) {
    const selected = answers[q.id];
    if (selected === q.correct) {
      scoresByArea[q.area] += 1;
      total += 1;
    }
  }

  const result = await prisma.entryAssessment.upsert({
    where: { missionaryId: session.missionaryId },
    create: {
      missionaryId: session.missionaryId,
      foundationsScore: scoresByArea.foundations,
      formationScore: scoresByArea.formation,
      interculturalScore: scoresByArea.intercultural,
      strategyScore: scoresByArea.strategy,
      evangelismScore: scoresByArea.evangelism,
      totalScore: total,
      answers,
    },
    update: {
      foundationsScore: scoresByArea.foundations,
      formationScore: scoresByArea.formation,
      interculturalScore: scoresByArea.intercultural,
      strategyScore: scoresByArea.strategy,
      evangelismScore: scoresByArea.evangelism,
      totalScore: total,
      answers,
      completedAt: new Date(),
    },
  });

  return NextResponse.json({ result });
}

import { NextRequest, NextResponse } from "next/server";
import { readSession } from "@/lib/auth";
import { getMissionary, setFieldContext } from "@/lib/mentor";
import { recommendModules } from "@/lib/recommendations";

export const runtime = "nodejs";

// GET: returns the missionary's saved field context (if any) plus the
// current ranked module recommendations for it — see lib/recommendations.ts
// for why this is a pure client-facing sort hint, never sent to the AI.
export async function GET() {
  const session = await readSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (!session.missionaryId) {
    return NextResponse.json({ fieldContext: null, recommendations: [] });
  }

  const missionary = await getMissionary(session.missionaryId);
  const fieldContext = missionary?.fieldContext ?? null;
  const recommendations = fieldContext ? recommendModules(fieldContext) : [];
  return NextResponse.json({ fieldContext, recommendations });
}

export async function POST(req: NextRequest) {
  const session = await readSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (!session.missionaryId) {
    return NextResponse.json({ error: "Set your name first (see the sidebar) before setting a field context." }, { status: 400 });
  }

  const { fieldContext } = (await req.json().catch(() => ({}))) as { fieldContext?: string };
  if (!fieldContext || !fieldContext.trim()) {
    return NextResponse.json({ error: "fieldContext required" }, { status: 400 });
  }

  await setFieldContext(session.missionaryId, fieldContext.trim());
  const recommendations = recommendModules(fieldContext.trim());
  return NextResponse.json({ ok: true, fieldContext: fieldContext.trim(), recommendations });
}

import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/apiAuth";
import { sendMentorMessage } from "@/lib/mentor";

export const runtime = "nodejs";

// missionaryId omitted/null = broadcast to every missionary in the roster.
export async function POST(req: NextRequest) {
  const { response } = await requireSession("mentor");
  if (response) return response;

  const { missionaryId, content } = (await req.json().catch(() => ({}))) as {
    missionaryId?: string | null;
    content?: string;
  };
  if (!content || !content.trim()) {
    return NextResponse.json({ error: "content required" }, { status: 400 });
  }

  await sendMentorMessage(missionaryId ?? null, content.trim());
  return NextResponse.json({ ok: true });
}

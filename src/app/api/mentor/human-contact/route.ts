import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/apiAuth";
import { logHumanContact } from "@/lib/mentor";

export const runtime = "nodejs";

// Mentor-only action: records that a REAL (voice/video/in-person)
// conversation happened with this missionary — deliberately never set
// automatically from AI chat activity. See lib/mentor.ts's comment on
// contactHealthFor() for why this is tracked separately from activity_log.
export async function POST(req: NextRequest) {
  const { response } = await requireSession("mentor");
  if (response) return response;

  const { missionaryId } = (await req.json().catch(() => ({}))) as { missionaryId?: string };
  if (!missionaryId) {
    return NextResponse.json({ error: "missionaryId required" }, { status: 400 });
  }

  const updated = await logHumanContact(missionaryId);
  return NextResponse.json({ ok: true, lastHumanContactAt: updated.lastHumanContactAt });
}

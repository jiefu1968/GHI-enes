import { NextRequest, NextResponse } from "next/server";
import { readSession, createSessionCookie } from "@/lib/auth";
import { getOrCreateMissionary, findMissionaryByName } from "@/lib/mentor";

export const runtime = "nodejs";

// Sets the missionary's name for mentor tracking — mirrors the "Your
// name, for your mentor" sidebar field in the original Gradio UI.
// Optional: an empty/never-called identify means fully anonymous use,
// same as leaving that field blank originally (nothing gets logged).
export async function POST(req: NextRequest) {
  const session = await readSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { name } = (await req.json().catch(() => ({}))) as { name?: string };
  if (!name || !name.trim()) {
    return NextResponse.json({ error: "Name required" }, { status: 400 });
  }
  const trimmedName = name.trim();

  // If this browser session already has an id, keep using it. Otherwise
  // (fresh login after the 7-day cookie expired, new device/browser, or
  // cleared cookies), look for an existing missionary with the same name
  // before minting a new id, so activity + urgent-flag history stays
  // attached to one person instead of fragmenting in the mentor roster.
  const existing = session.missionaryId ? null : await findMissionaryByName(trimmedName);
  const missionaryId = session.missionaryId ?? existing?.id ?? crypto.randomUUID();
  await getOrCreateMissionary(missionaryId, trimmedName);
  await createSessionCookie({ ...session, missionaryId, missionaryName: trimmedName });

  return NextResponse.json({ ok: true, missionaryId, missionaryName: trimmedName });
}

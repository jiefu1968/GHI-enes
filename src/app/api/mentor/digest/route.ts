import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/apiAuth";
import { generateDigest, getLatestDigest } from "@/lib/mentor";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { response } = await requireSession("mentor");
  if (response) return response;

  const { missionaryId, missionaryName } = (await req.json().catch(() => ({}))) as {
    missionaryId?: string;
    missionaryName?: string;
  };
  if (!missionaryId || !missionaryName) {
    return NextResponse.json({ error: "missionaryId and missionaryName required" }, { status: 400 });
  }

  const summary = await generateDigest(missionaryId, missionaryName);
  return NextResponse.json({ summary });
}

export async function GET(req: NextRequest) {
  const { response } = await requireSession("mentor");
  if (response) return response;

  const missionaryId = req.nextUrl.searchParams.get("missionaryId");
  if (!missionaryId) return NextResponse.json({ error: "missionaryId required" }, { status: 400 });

  const digest = await getLatestDigest(missionaryId);
  return NextResponse.json({ digest });
}

import { NextRequest, NextResponse } from "next/server";
import { verifyAccessCode, createSessionCookie } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { code } = (await req.json().catch(() => ({}))) as { code?: string };
  if (!code || !verifyAccessCode("mentor", code)) {
    return NextResponse.json({ error: "Invalid mentor access code" }, { status: 401 });
  }
  await createSessionCookie({ role: "mentor" });
  return NextResponse.json({ ok: true });
}

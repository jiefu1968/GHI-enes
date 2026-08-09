import { NextRequest, NextResponse } from "next/server";
import { verifyAccessCode, createSessionCookie } from "@/lib/auth";

export const runtime = "nodejs";

// Matches the original ACCESS_CODE gate. Missionary identity ("Your name,
// for your mentor") is a separate, optional step — see
// /api/session/identify — same as the original UI where it's a sidebar
// field entered after the app has already loaded, not part of login.
export async function POST(req: NextRequest) {
  const { code } = (await req.json().catch(() => ({}))) as { code?: string };
  if (!code || !verifyAccessCode("user", code)) {
    return NextResponse.json({ error: "Invalid access code" }, { status: 401 });
  }
  await createSessionCookie({ role: "user" });
  return NextResponse.json({ ok: true });
}

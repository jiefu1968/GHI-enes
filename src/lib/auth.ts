/**
 * Lightweight access-code auth, replacing the implicit "type the code
 * into the Gradio textbox" gate from the original app. Two independent
 * gates, matching ACCESS_CODE / MENTOR_ACCESS_CODE from harvest_config.py:
 *   - "user"   role: general Research Chat access
 *   - "mentor" role: unlocks the Mentor Dashboard
 *
 * Sessions are signed JWTs (HS256) in httpOnly cookies via `jose` — no
 * server-side session store needed, which keeps this stateless and
 * horizontally scalable across replicas (a requirement called out in the
 * project's own architecture notes for the mentor feature).
 */

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { ACCESS_CODE, MENTOR_ACCESS_CODE, SESSION_SECRET } from "./env";

const encodedSecret = new TextEncoder().encode(SESSION_SECRET);
const COOKIE_NAME = "gh_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export type SessionRole = "user" | "mentor";

export interface SessionPayload {
  role: SessionRole;
  missionaryId?: string;
  missionaryName?: string;
}

// ACCESS_CODE / MENTOR_ACCESS_CODE may hold either a single code (original
// behavior, unchanged) or a comma-separated list — e.g.
// ACCESS_CODE="harvest2026,team-manila-2026,team-bangkok-2026" — so a
// sending organization can issue a distinct code per partner org or
// cohort (for revocation or usage tracking) without any auth rework.
// Whitespace around each code is trimmed; empty entries are ignored.
export function verifyAccessCode(role: SessionRole, code: string): boolean {
  const expected = role === "mentor" ? MENTOR_ACCESS_CODE : ACCESS_CODE;
  const validCodes = expected
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
  return validCodes.includes(code.trim());
}

export async function createSessionCookie(payload: SessionPayload) {
  const token = await new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(encodedSecret);

  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function readSession(): Promise<SessionPayload | null> {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, encodedSecret);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export function clearSessionCookie() {
  cookies().delete(COOKIE_NAME);
}

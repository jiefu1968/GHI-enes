import { NextResponse } from "next/server";
import { readSession, type SessionRole } from "./auth";

/**
 * Guards an API route by required role. "user" role also passes for
 * "mentor" sessions (a mentor can still use the chat), but "mentor"
 * routes require exactly the mentor role.
 */
export async function requireSession(minRole: SessionRole) {
  const session = await readSession();
  if (!session) {
    return { session: null, response: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };
  }
  if (minRole === "mentor" && session.role !== "mentor") {
    return { session: null, response: NextResponse.json({ error: "Mentor access required" }, { status: 403 }) };
  }
  return { session, response: null };
}

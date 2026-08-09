import { NextResponse } from "next/server";
import { readSession } from "@/lib/auth";
import { getUndeliveredMessages, markDelivered } from "@/lib/mentor";

export const runtime = "nodejs";

// Called from the missionary-side chat client at the start of a session
// (or periodically) to pick up mentor broadcasts/direct messages,
// matching the original "delivered at the start of the next chat turn"
// behavior.
export async function GET() {
  const session = await readSession();
  if (!session || !session.missionaryId) return NextResponse.json({ messages: [] });

  const messages = await getUndeliveredMessages(session.missionaryId);
  if (messages.length > 0) {
    await markDelivered(messages.map((m) => m.id), session.missionaryId);
  }
  return NextResponse.json({ messages });
}

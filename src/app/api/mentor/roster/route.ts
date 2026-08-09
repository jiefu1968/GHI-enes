import { NextResponse } from "next/server";
import { requireSession } from "@/lib/apiAuth";
import { listMissionaries, listUrgentFlags, contactHealthFor } from "@/lib/mentor";

export const runtime = "nodejs";

export async function GET() {
  const { response } = await requireSession("mentor");
  if (response) return response;

  const [missionaries, openFlags] = await Promise.all([listMissionaries(), listUrgentFlags(false)]);
  const withHealth = missionaries.map((m) => ({
    ...m,
    contactHealth: contactHealthFor(m.lastHumanContactAt),
  }));
  return NextResponse.json({ missionaries: withHealth, openFlagCount: openFlags.length });
}

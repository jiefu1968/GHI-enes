import { NextResponse } from "next/server";
import { requireSession } from "@/lib/apiAuth";
import { listUrgentFlags } from "@/lib/mentor";

export const runtime = "nodejs";

export async function GET() {
  const { response } = await requireSession("mentor");
  if (response) return response;

  const flags = await listUrgentFlags(false);
  return NextResponse.json({ flags });
}

import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/apiAuth";
import { resolveFlag } from "@/lib/mentor";

export const runtime = "nodejs";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const { response } = await requireSession("mentor");
  if (response) return response;

  const flagId = Number(params.id);
  if (!Number.isFinite(flagId)) return NextResponse.json({ error: "invalid id" }, { status: 400 });

  await resolveFlag(flagId);
  return NextResponse.json({ ok: true });
}

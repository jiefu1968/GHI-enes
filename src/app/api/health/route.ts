import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getProviderCounters } from "@/lib/logger";

export const runtime = "nodejs";

/**
 * Health check — no auth required (uptime monitors need to hit this
 * without a session cookie). Point any free uptime monitor (UptimeRobot,
 * Better Uptime, Pingdom, a simple cron + curl, etc.) at
 * GET /api/health and alert on anything but a 200 with "ok": true.
 *
 * Checks:
 * - Database reachable (a trivial query against Postgres via Prisma)
 * - PRIMARY_API_KEY is at least present (not validated against the real
 *   API — that would cost a real request on every health check poll;
 *   presence-only is enough to catch "someone deployed without setting
 *   the env var," the most common real-world failure mode)
 * - Rough in-memory provider call counters since last restart (see
 *   src/lib/logger.ts — NOT a substitute for the Groq/Cerebras billing
 *   consoles, just a quick eyeball sanity check)
 */
export async function GET() {
  const checks: Record<string, { ok: boolean; detail?: string }> = {};

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { ok: true };
  } catch (e) {
    checks.database = { ok: false, detail: String(e) };
  }

  const hasPrimaryKey = !!process.env.PRIMARY_API_KEY && process.env.PRIMARY_API_KEY !== "your-api-key-here";
  checks.primaryApiKeyConfigured = { ok: hasPrimaryKey };

  const allOk = Object.values(checks).every((c) => c.ok);

  return NextResponse.json(
    {
      ok: allOk,
      checks,
      providerCounters: getProviderCounters(),
      timestamp: new Date().toISOString(),
    },
    { status: allOk ? 200 : 503 }
  );
}

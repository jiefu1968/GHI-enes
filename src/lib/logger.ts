/**
 * Minimal structured logging — JSON lines to stdout/stderr.
 *
 * WHY THIS EXISTS: the launch checklist flagged "configure basic
 * monitoring (API errors, DB outages, Groq usage cost)" as an
 * unaddressed yellow/important item. Wiring a real APM (Sentry,
 * Datadog, etc.) requires an account and API key only the
 * organization can create — not something to fabricate here. This
 * gives the codebase a single, consistent logging surface that (a) is
 * useful immediately, since most hosting platforms (Vercel, Railway,
 * Render, etc.) already capture and let you search stdout/stderr as
 * structured logs with zero extra setup, and (b) makes it a one-line
 * change per call site to pipe into a real APM later — swap the
 * `console.log`/`console.error` calls below for `Sentry.captureException`
 * or similar, without touching any of the ~15 call sites across the
 * codebase that import this module.
 */

type LogLevel = "info" | "warn" | "error";

interface LogFields {
  [key: string]: unknown;
}

function emit(level: LogLevel, message: string, fields?: LogFields) {
  const line = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...fields,
  };
  const serialized = JSON.stringify(line);
  if (level === "error") console.error(serialized);
  else if (level === "warn") console.warn(serialized);
  else console.log(serialized);
}

export const logger = {
  info: (message: string, fields?: LogFields) => emit("info", message, fields),
  warn: (message: string, fields?: LogFields) => emit("warn", message, fields),
  error: (message: string, fields?: LogFields) => emit("error", message, fields),
};

/**
 * Call this from any Groq/Cerebras request path to track approximate
 * usage without a real metrics backend. In-memory only — resets on
 * every deploy/restart, so it is NOT a substitute for a real billing
 * dashboard (use the Groq/Cerebras consoles for that), but is enough
 * to eyeball request volume and error rate from the log stream, or to
 * expose via /api/health for a quick sanity check.
 */
// Counters are keyed by the provider's ROLE (primary vs. fallback), not a
// hardcoded vendor name — the actual vendor is configurable (Cerebras,
// Together, Groq, …) and was drifting out of sync with these labels, so
// the log stream reported "groq" even when calling Cerebras. Role is
// stable regardless of which vendor is wired in.
const counters = {
  primaryRequests: 0,
  primaryErrors: 0,
  fallbackRequests: 0,
  fallbackErrors: 0,
  startedAt: new Date().toISOString(),
};

export function recordProviderCall(role: "primary" | "fallback", ok: boolean) {
  if (role === "primary") {
    counters.primaryRequests++;
    if (!ok) counters.primaryErrors++;
  } else {
    counters.fallbackRequests++;
    if (!ok) counters.fallbackErrors++;
  }
}

export function getProviderCounters() {
  return { ...counters };
}

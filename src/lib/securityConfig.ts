/**
 * Detects secrets and access codes that are still at a publicly-known default
 * value in production.
 *
 * Why: env.ts falls back to a hard-coded default when a variable is missing on
 * the host (SESSION_SECRET, ACCESS_CODE, MENTOR_ACCESS_CODE). Those defaults are
 * in the source code, so anyone who knows them can forge a session cookie or
 * sign in — as a mentor, if MENTOR_ACCESS_CODE is the default.
 *
 * Behaviour (production only; nothing happens in development):
 *  - A code that is deliberately kept can be acknowledged with ACCEPT_DEFAULT_ACCESS_CODE=true or
 *    ACCEPT_DEFAULT_MENTOR_CODE=true: that code is then neither warned about nor blocked by ENFORCE.
 *  - ALWAYS logs one greppable "SECURITY:" error line per problem, so a bad
 *    configuration is visible in the host's logs.
 *  - Refuses to start (throws) ONLY when ENFORCE_SECURE_CONFIG=true. It is
 *    opt-in on purpose: crashing by default would take a running deployment
 *    down on a redeploy where a variable is still missing. Turn it on once the
 *    logs show no SECURITY lines.
 *
 * Pure and dependency-free, so it is safe in the Edge runtime (middleware.ts
 * imports env.ts) and trivial to test. It never prints the values it checks.
 */

export type SecurityVariable = "SESSION_SECRET" | "ACCESS_CODE" | "MENTOR_ACCESS_CODE";

export interface SecurityProblem {
  variable: SecurityVariable;
  message: string;
}

export interface SecurityInput {
  nodeEnv: string | undefined;
  sessionSecret: string;
  accessCode: string;
  mentorAccessCode: string;
  enforce?: boolean;
  // Explicit, per-code acknowledgement: the owner KNOWS the old default code is still in use and
  // accepts it. Silences (and exempts from ENFORCE) only that code. SESSION_SECRET has no such escape:
  // it is never typed by anyone, so replacing it costs nothing but a re-login.
  acceptDefaultAccessCode?: boolean;
  acceptDefaultMentorCode?: boolean;
}

// Values that ship in the source code or in .env.example. Anything equal to one
// of these is public knowledge.
const KNOWN_SESSION_SECRETS = ["dev-only-insecure-secret-change-me", "change-me-to-a-real-random-secret"];
const KNOWN_ACCESS_CODES = ["harvest2026", "set-your-own-code", "change-me", "changeme"];
const KNOWN_MENTOR_CODES = ["mentor2026", "set-your-own-mentor-code", "change-me", "changeme"];

// ACCESS_CODE / MENTOR_ACCESS_CODE may hold several codes separated by commas
// ("team-a,team-b"). One public code in the list is enough to be a hole.
function codeList(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s !== "");
}

export function findSecurityProblems(input: SecurityInput): SecurityProblem[] {
  const problems: SecurityProblem[] = [];

  if (KNOWN_SESSION_SECRETS.includes(input.sessionSecret.trim())) {
    problems.push({
      variable: "SESSION_SECRET",
      message:
        "SESSION_SECRET is set to a known placeholder in production — session cookies are forgeable. Set a real random value (openssl rand -base64 32) and redeploy.",
    });
  }
  if (!input.acceptDefaultAccessCode && codeList(input.accessCode).some((c) => KNOWN_ACCESS_CODES.includes(c))) {
    problems.push({
      variable: "ACCESS_CODE",
      message:
        "ACCESS_CODE includes a publicly known default in production — anyone can sign in as a learner. Set your own code(s) (comma-separated for several) and redeploy, or keep it on purpose with ACCEPT_DEFAULT_ACCESS_CODE=true.",
    });
  }
  if (!input.acceptDefaultMentorCode && codeList(input.mentorAccessCode).some((c) => KNOWN_MENTOR_CODES.includes(c))) {
    problems.push({
      variable: "MENTOR_ACCESS_CODE",
      message:
        "MENTOR_ACCESS_CODE includes a publicly known default in production — anyone can sign in as a mentor and read every learner's data. Set your own code(s) and redeploy, or keep it on purpose with ACCEPT_DEFAULT_MENTOR_CODE=true.",
    });
  }
  return problems;
}

/**
 * Logs every problem (production only) and, when `enforce` is true, throws so
 * the app refuses to run with insecure defaults. Returns the problems found.
 */
export function enforceSecurityConfig(
  input: SecurityInput,
  log: (line: string) => void = (line) => console.error(line)
): SecurityProblem[] {
  if (input.nodeEnv !== "production") return [];
  const problems = findSecurityProblems(input);

  for (const p of problems) {
    log(
      JSON.stringify({
        level: "error",
        message: `SECURITY: ${p.message}${input.enforce ? "" : " (Set ENFORCE_SECURE_CONFIG=true to refuse to start in this state.)"}`,
        timestamp: new Date().toISOString(),
      })
    );
  }

  if (problems.length > 0 && input.enforce) {
    throw new Error(
      `Refusing to start: insecure configuration in production (${problems.map((p) => p.variable).join(", ")}). ` +
        "Set real values on the host, or remove ENFORCE_SECURE_CONFIG to only warn."
    );
  }
  return problems;
}

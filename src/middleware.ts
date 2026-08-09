import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { SESSION_SECRET } from "@/lib/env";

// Edge-safe re-check of the session cookie (can't import lib/auth.ts's
// next/headers-based helpers here, so this reads the cookie directly).
// Full role verification for mutating actions still happens per-route
// via requireSession() — this middleware only gates page navigation so
// unauthenticated users get redirected to the right login screen instead
// of a blank/broken page.

const encodedSecret = new TextEncoder().encode(SESSION_SECRET);

async function getRole(req: NextRequest): Promise<"user" | "mentor" | null> {
  const token = req.cookies.get("gh_session")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, encodedSecret);
    return (payload as any).role ?? null;
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const role = await getRole(req);

  if (pathname.startsWith("/chat") && !role) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if (pathname.startsWith("/mentor") && role !== "mentor") {
    return NextResponse.redirect(new URL("/mentor-login", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/chat/:path*", "/mentor/:path*"],
};

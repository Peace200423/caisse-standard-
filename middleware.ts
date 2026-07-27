import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  const path = req.nextUrl.pathname;
  const isApi = path.startsWith("/api/");

  const protectedApiPrefixes = [
    "/api/objectifs",
    "/api/indicateurs",
    "/api/export",
    "/api/members",
    "/api/valeurs",
    "/api/upload",
    "/api/organization",
  ];
  const isProtectedApi = isApi && protectedApiPrefixes.some((p) => path.startsWith(p));

  if (isProtectedApi && !session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  if (path.startsWith("/dashboard")) {
    if (!session) return NextResponse.redirect(new URL("/login", req.url));
    if (session.role === "agent") return NextResponse.redirect(new URL("/terrain", req.url));
  }

  if (path.startsWith("/terrain")) {
    if (!session) return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/terrain/:path*",
    "/api/objectifs/:path*",
    "/api/indicateurs/:path*",
    "/api/export/:path*",
    "/api/members/:path*",
    "/api/valeurs/:path*",
    "/api/upload/:path*",
    "/api/organization/:path*",
  ],
};

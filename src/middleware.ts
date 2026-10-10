import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/api/auth", "/_next", "/favicon.ico"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public assets and login endpoint
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Check auth session cookie
  const sessionCookie = req.cookies.get("medisense_session");

  if (!sessionCookie || !sessionCookie.value) {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const raw = Buffer.from(sessionCookie.value, "base64").toString("utf-8");
    const parsed = JSON.parse(raw);
    if (!parsed.isLoggedIn || parsed.username !== "trashika") {
      const loginUrl = new URL("/login", req.url);
      return NextResponse.redirect(loginUrl);
    }
  } catch (e) {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static files, _next, favicon.ico
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const accessToken =
    req.cookies.get("sb-access-token") ?? req.cookies.get("auth_token");
  const isProtected =
    pathname.startsWith("/notes") || pathname.startsWith("/personalization");

  if (isProtected && !accessToken) {
    const loginUrl = new URL("/auth/register", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/notes/:path*", "/personalization/:path*"],
};

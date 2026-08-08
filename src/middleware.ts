// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  try {
    const { pathname } = req.nextUrl;

    if (
      pathname.startsWith("/_next") ||
      pathname.startsWith("/static") ||
      pathname.includes(".")
    ) {
      return NextResponse.next();
    }

    if (pathname.startsWith("/dashboard")) {
      const cookieHeader = req.headers.get("cookie") || "";

      const hasCustomToken = /(?:^|;\s*)token=/.test(cookieHeader);
      const hasNextAuthCookie =
        /(?:^|;\s*)next-auth\.session-token=/.test(cookieHeader) ||
        /(?:^|;\s*)__Secure-next-auth\.session-token=/.test(cookieHeader);

      if (!hasCustomToken && !hasNextAuthCookie) {
        const loginUrl = new URL("/login", req.url);
        loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
        return NextResponse.redirect(loginUrl);
      }

      return NextResponse.next();
    }

    return NextResponse.next();
  } catch (err) {
    console.error("[middleware] error:", err);
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/dashboard/:path*"],
};

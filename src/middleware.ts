// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

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

      const hasCustomToken = cookieHeader.includes("token=");
      const hasNextAuthCookie =
        cookieHeader.includes("next-auth.session-token") ||
        cookieHeader.includes("__Secure-next-auth.session-token");

      if (!hasCustomToken && !hasNextAuthCookie) {
        const loginUrl = new URL("/login", req.url);
        loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
        return NextResponse.redirect(loginUrl);
      }

      try {
        if (hasNextAuthCookie) {
          const nextAuthToken = await getToken({
            req,
            secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET,
          });

          if (nextAuthToken?.email) {
            if (!nextAuthToken.emailVerified) {
              const confirmUrl = new URL(
                `/auth/confirm-code?email=${encodeURIComponent(String(nextAuthToken.email))}`,
                req.url
              );
              return NextResponse.redirect(confirmUrl);
            }
            return NextResponse.next();
          }
        }

        if (hasCustomToken) {
          const meUrl = new URL("/api/auth/me", req.url).toString();
          const resp = await fetch(meUrl, {
            method: "GET",
            headers: { cookie: cookieHeader },
            cache: "no-store",
          });

          if (!resp.ok) {
            const loginUrl = new URL("/login", req.url);
            loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
            return NextResponse.redirect(loginUrl);
          }

          const data = await resp.json().catch(() => null);
          if (!data?.user) {
            const loginUrl = new URL("/login", req.url);
            loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
            return NextResponse.redirect(loginUrl);
          }

          if (!data.user.emailVerified) {
            const confirmUrl = new URL(
              `/auth/confirm-code?email=${encodeURIComponent(data.user.email)}`,
              req.url
            );
            return NextResponse.redirect(confirmUrl);
          }

          return NextResponse.next();
        }

        const loginUrl = new URL("/login", req.url);
        loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
        return NextResponse.redirect(loginUrl);
      } catch (err) {
        console.error("[middleware] error validating session:", err);
        const loginUrl = new URL("/login", req.url);
        loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
        return NextResponse.redirect(loginUrl);
      }
    }

    return NextResponse.next();
  } catch (err) {
    console.error("[middleware] error inesperado:", err);
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/dashboard/:path*"],
};

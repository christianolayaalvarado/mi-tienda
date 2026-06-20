import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  try {
    const { pathname } = req.nextUrl;

    // Ignorar recursos estáticos o internos
    if (
      pathname.startsWith("/_next") ||
      pathname.startsWith("/static") ||
      pathname.includes(".")
    ) {
      return NextResponse.next();
    }

    // Proteger rutas bajo /dashboard
    if (pathname.startsWith("/dashboard")) {
      const sessionUrl = new URL("/api/auth/session", req.url).toString();

      const resp = await fetch(sessionUrl, {
        method: "GET",
        headers: {
          cookie: req.headers.get("cookie") || "",
        },
        cache: "no-store",
      });

      if (!resp.ok) {
        const loginUrl = new URL("/login", req.url);
        loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
        return NextResponse.redirect(loginUrl);
      }

      const data = await resp.json().catch(() => null);

      // 🔒 Si no hay sesión o usuario
      if (!data || !data.user) {
        const loginUrl = new URL("/login", req.url);
        loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
        return NextResponse.redirect(loginUrl);
      }

      // 🚨 Si el usuario no está verificado
      if (!data.user.emailVerified) {
        const confirmUrl = new URL(
          `/auth/confirm-code?email=${encodeURIComponent(data.user.email)}`,
          req.url
        );
        return NextResponse.redirect(confirmUrl);
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
// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  try {
    const { pathname } = req.nextUrl;

    // No ejecutar middleware en recursos estáticos o rutas internas de Next
    if (pathname.startsWith("/_next") || pathname.startsWith("/static") || pathname.includes(".")) {
      return NextResponse.next();
    }

    // Solo comprobar token cuando la ruta lo requiera
    if (pathname.startsWith("/dashboard")) {
      // Llamada interna al endpoint de sesión, pasando la cookie de la petición
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
            if (!data || !data.user) {
              const loginUrl = new URL("/login", req.url);
              loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
              return NextResponse.redirect(loginUrl);
            }
    }

    return NextResponse.next();
  } catch (err) {
    console.error("[middleware] unexpected error:", err);
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/dashboard/:path*"],
};

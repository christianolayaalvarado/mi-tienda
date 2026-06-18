// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  try {
    const { pathname } = req.nextUrl;

    // No ejecutar middleware en recursos estáticos o rutas internas de Next
    if (pathname.startsWith("/_next") || pathname.startsWith("/static") || pathname.includes(".")) {
      return NextResponse.next();
    }

    // Solo comprobar token cuando la ruta lo requiera (evita coste en todas las peticiones)
    if (pathname.startsWith("/dashboard")) {
      const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
      console.log("[middleware] pathname:", pathname, "tokenExists:", !!token);

      // Intento seguro de leer cookies (Edge runtime puede exponer req.cookies)
      try {
        const cookies: Record<string, string> = {};
        for (const [k, v] of req.cookies.entries()) cookies[k] = v;
        console.log("[middleware] cookies:", cookies);
      } catch (e) {
        console.log("[middleware] cookies read error:", e?.message ?? e);
      }

      if (!token) {
        const loginUrl = new URL("/login", req.url);
        loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
        return NextResponse.redirect(loginUrl);
      }
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

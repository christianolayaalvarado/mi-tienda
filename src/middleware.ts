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
      // Intentar leer cookie de forma compatible con Edge runtime
      let sessionCookie = undefined;

      try {
        // Intento directo por nombre (NextRequest.cookies.get)
        sessionCookie =
          req.cookies.get("next-auth.session-token")?.value ||
          req.cookies.get("__Secure-next-auth.session-token")?.value ||
          req.cookies.get("__Host-next-auth.session-token")?.value;
      } catch (e) {
        // Si falla, lo ignoramos y usamos header cookie como fallback
        sessionCookie = undefined;
      }

      // Fallback: leer header Cookie y parsear manualmente si existe
      if (!sessionCookie) {
        const cookieHeader = req.headers.get("cookie");
        if (cookieHeader) {
          // parse simple: buscar next-auth.session-token o variantes
          const match = cookieHeader.match(/(?:^|;\s*)(?:__Host-)?(?:__Secure-)?next-auth\.session-token=([^;]+)/);
          if (match) sessionCookie = decodeURIComponent(match[1]);
        }
      }

      // Log temporal para depuración en Vercel
      console.log("[middleware] pathname:", pathname, "sessionCookieExists:", !!sessionCookie);

      // Usar getToken para validar token (getToken leerá cookies internamente también)
      const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
      console.log("[middleware] getToken returned:", !!token);

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

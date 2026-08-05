// src/lib/serverAuth.js
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { getJwtSecret } from "./getJwtSecret";

const DEBUG = Boolean(process.env.DEBUG_SERVER_AUTH === "true");

function getCookieValueFromHeader(cookieHeader = "", name) {
  if (!cookieHeader) return undefined;
  const parts = cookieHeader.split(";").map((c) => c.trim());
  const match = parts.find((c) => c.startsWith(name + "="));
  return match ? match.split("=").slice(1).join("=") : undefined;
}

export async function getServerAuthUser(req) {
  try {
    // Check if NextAuth session cookie exists
    let hasSessionCookie = false;
    if (req?.headers?.get) {
      const cookieHeader = req.headers.get("cookie") || "";
      hasSessionCookie = !!getCookieValueFromHeader(cookieHeader, "next-auth.session-token");
    }
    if (!hasSessionCookie) {
      try {
        const cookieStore = await cookies();
        hasSessionCookie = !!cookieStore.get("next-auth.session-token")?.value;
      } catch {}
    }

    // 1) Intentar obtener sesión de next-auth (Google/Facebook login)
    try {
      const session = await getServerSession(authOptions);
      if (session?.user) {
        if (DEBUG) console.log("[serverAuth] next-auth session found", { email: session.user.email });
        return { ...session.user, source: "nextauth" };
      }
    } catch (e) {
      if (DEBUG) console.warn("[serverAuth] getServerSession failed:", e?.message || e);
    }

    // 2) If next-auth session cookie exists but getServerSession failed,
    //    do NOT fall back to custom token — the user is a social login user
    if (hasSessionCookie) {
      if (DEBUG) console.log("[serverAuth] session cookie present but getServerSession failed, returning null");
      return null;
    }

    // 3) Intentar extraer token desde la cabecera cookie (credentials login only)
    let tokenValue = null;

    if (req?.headers?.get) {
      const cookieHeader = req.headers.get("cookie") || "";
      if (DEBUG) console.log("[serverAuth] cookieHeader (from req.headers):", cookieHeader ? "[present]" : "[empty]");
      tokenValue = getCookieValueFromHeader(cookieHeader, "token");
    }

    // 3) Si no está en la cabecera, intentar usar next/headers cookies() (server-only)
    if (!tokenValue) {
      try {
        const cookieStore = await cookies();
        const cookieObj = cookieStore.get("token");
        tokenValue = cookieObj?.value;
        if (DEBUG) console.log("[serverAuth] cookie (from next/headers):", tokenValue ? "[present]" : "[empty]");
      } catch (e) {
        if (DEBUG) console.warn("[serverAuth] cookies() unavailable or failed:", e?.message || e);
      }
    }

    if (!tokenValue) {
      if (DEBUG) console.log("[serverAuth] no token found");
      return null;
    }

    // token puede venir codificado en URI component
    try {
      tokenValue = decodeURIComponent(tokenValue);
    } catch {
      // ignore decode errors and use raw value
    }

    // 4) Verificar JWT
    const payload = jwt.verify(tokenValue, getJwtSecret());
    if (!payload || !payload.email) {
      if (DEBUG) console.log("[serverAuth] token payload invalid or missing email");
      return null;
    }

    if (DEBUG) console.log("[serverAuth] token valid for", payload.email);
    return { ...payload, source: "token" };
  } catch (err) {
    // Mostrar solo errores no esperados en modo debug
    if (DEBUG) {
      console.warn("[serverAuth] token validation error:", err?.name, err?.message || err);
    }
    return null;
  }
}

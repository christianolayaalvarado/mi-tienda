// src/lib/serverAuth.js
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "./getJwtSecret";

const DEBUG = Boolean(process.env.DEBUG_SERVER_AUTH === "true");

function getCookieValueFromHeader(cookieHeader = "", name) {
  if (!cookieHeader) return undefined;
  const parts = cookieHeader.split(";").map((c) => c.trim());
  const match = parts.find((c) => c.startsWith(name + "="));
  return match ? match.split("=").slice(1).join("=") : undefined;
}

async function verifyNextAuthJWT(tokenValue) {
  try {
    const { jwtVerify } = await import("jose");
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET);
    const { payload } = await jwtVerify(tokenValue, secret);
    return payload;
  } catch {
    return null;
  }
}

export async function getServerAuthUser(req) {
  try {
    // PRIMARY: Read cookies via next/headers (works in Vercel serverless Route Handlers)
    let customToken = null;
    let naToken = null;

    try {
      const cookieStore = await cookies();
      customToken = cookieStore.get("token")?.value || null;
      naToken =
        cookieStore.get("next-auth.session-token")?.value ||
        cookieStore.get("__Secure-next-auth.session-token")?.value ||
        null;
    } catch {}

    // FALLBACK: Read from req.headers if cookies() didn't yield results
    if (!customToken && !naToken && req?.headers?.get) {
      const cookieHeader = req.headers.get("cookie") || "";
      if (cookieHeader) {
        customToken = getCookieValueFromHeader(cookieHeader, "token") || null;
        naToken =
          getCookieValueFromHeader(cookieHeader, "next-auth.session-token") ||
          getCookieValueFromHeader(cookieHeader, "__Secure-next-auth.session-token") ||
          null;
      }
    }

    // 1) Try custom token cookie first (credentials login — most recent explicit login)
    if (customToken) {
      try {
        const decoded = decodeURIComponent(customToken);
        const payload = jwt.verify(decoded, getJwtSecret());
        if (payload?.email) {
          if (DEBUG) console.log("[serverAuth] custom token valid for", payload.email);
          return { ...payload, source: "token" };
        }
      } catch {}
    }

    // 2) Try manual NextAuth JWT verification (Google/Facebook login)
    if (naToken) {
      try { naToken = decodeURIComponent(naToken); } catch {}
      const payload = await verifyNextAuthJWT(naToken);
      if (payload?.email) {
        if (DEBUG) console.log("[serverAuth] manually verified NextAuth JWT for", payload.email);
        return { email: payload.email, id: payload.id, name: payload.name, source: "nextauth-jwt" };
      }
    }

    if (DEBUG) console.log("[serverAuth] no auth found");
    return null;
  } catch (err) {
    if (DEBUG) {
      console.warn("[serverAuth] auth error:", err?.name, err?.message || err);
    }
    return null;
  }
}

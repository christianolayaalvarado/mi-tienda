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
    // Collect cookies
    let cookieHeader = "";
    if (req?.headers?.get) {
      cookieHeader = req.headers.get("cookie") || "";
    }

    const hasNextAuthCookie =
      cookieHeader.includes("next-auth.session-token") ||
      cookieHeader.includes("__Secure-next-auth.session-token");

    if (!hasNextAuthCookie) {
      try {
        const cookieStore = await cookies();
        const naCookie = cookieStore.get("next-auth.session-token")?.value || cookieStore.get("__Secure-next-auth.session-token")?.value;
        if (naCookie) cookieHeader = cookieHeader || `next-auth.session-token=${naCookie}`;
      } catch {}
    }

    // 1) Try getServerSession (NextAuth built-in)
    try {
      const session = await getServerSession(authOptions);
      if (session?.user) {
        if (DEBUG) console.log("[serverAuth] next-auth session found", { email: session.user.email });
        return { ...session.user, source: "nextauth" };
      }
    } catch (e) {
      if (DEBUG) console.warn("[serverAuth] getServerSession failed:", e?.message || e);
    }

    // 2) If getServerSession failed but NextAuth cookie exists, manually verify JWT
    if (hasNextAuthCookie) {
      let tokenValue = getCookieValueFromHeader(cookieHeader, "next-auth.session-token");
      if (!tokenValue) tokenValue = getCookieValueFromHeader(cookieHeader, "__Secure-next-auth.session-token");

      if (tokenValue) {
        try {
          tokenValue = decodeURIComponent(tokenValue);
        } catch {}

        const payload = await verifyNextAuthJWT(tokenValue);
        if (payload?.email) {
          if (DEBUG) console.log("[serverAuth] manually verified NextAuth JWT for", payload.email);
          return { email: payload.email, id: payload.id, name: payload.name, source: "nextauth-jwt" };
        }
      }

      // Even if JWT verification fails, try looking up by session token existence
      // This is a last resort - shouldn't normally reach here
      if (DEBUG) console.log("[serverAuth] NextAuth cookie present but JWT verification failed");
      return null;
    }

    // 3) Fall back to custom token cookie (credentials login only)
    let tokenValue = null;

    if (req?.headers?.get) {
      tokenValue = getCookieValueFromHeader(cookieHeader, "token");
    }

    if (!tokenValue) {
      try {
        const cookieStore = await cookies();
        const cookieObj = cookieStore.get("token");
        tokenValue = cookieObj?.value;
      } catch {}
    }

    if (!tokenValue) {
      if (DEBUG) console.log("[serverAuth] no token found");
      return null;
    }

    try {
      tokenValue = decodeURIComponent(tokenValue);
    } catch {}

    const payload = jwt.verify(tokenValue, getJwtSecret());
    if (!payload || !payload.email) {
      if (DEBUG) console.log("[serverAuth] token payload invalid or missing email");
      return null;
    }

    if (DEBUG) console.log("[serverAuth] token valid for", payload.email);
    return { ...payload, source: "token" };
  } catch (err) {
    if (DEBUG) {
      console.warn("[serverAuth] token validation error:", err?.name, err?.message || err);
    }
    return null;
  }
}

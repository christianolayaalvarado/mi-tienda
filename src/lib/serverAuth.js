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
    let cookieHeader = "";
    if (req?.headers?.get) {
      cookieHeader = req.headers.get("cookie") || "";
    }

    // 1) Try custom token cookie first (credentials login — most recent explicit login)
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

    if (tokenValue) {
      try {
        const decoded = decodeURIComponent(tokenValue);
        const payload = jwt.verify(decoded, getJwtSecret());
        if (payload?.email) {
          if (DEBUG) console.log("[serverAuth] custom token valid for", payload.email);
          return { ...payload, source: "token" };
        }
      } catch {}
    }

    // 2) Try manual NextAuth JWT verification (Google/Facebook login)
    const nextAuthTokenName = "next-auth.session-token";
    const secureTokenName = "__Secure-next-auth.session-token";

    let naToken = getCookieValueFromHeader(cookieHeader, nextAuthTokenName) || getCookieValueFromHeader(cookieHeader, secureTokenName);

    if (!naToken) {
      try {
        const cookieStore = await cookies();
        naToken = cookieStore.get(nextAuthTokenName)?.value || cookieStore.get(secureTokenName)?.value;
      } catch {}
    }

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

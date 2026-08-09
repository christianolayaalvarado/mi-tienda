import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { getJwtSecret } from "./getJwtSecret";

const DEBUG = Boolean(process.env.DEBUG_AUTH === "true");

function getCookieValueFromHeader(cookieHeader = "", name) {
  if (!cookieHeader) return undefined;
  const parts = cookieHeader.split(";").map((c) => c.trim());
  const match = parts.find((c) => c.startsWith(name + "="));
  return match ? match.split("=").slice(1).join("=") : undefined;
}

/**
 * Verify a NextAuth JWT token using jose (same library NextAuth uses).
 */
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

/**
 * Resolves the authenticated user from cookies.
 * Priority: custom token (credentials) > manual NextAuth JWT verification.
 *
 * @param {Request} [req] - Optional request object. When provided, reads cookies from req.headers first (more reliable).
 */
export async function getAuthUserFromCookie(req) {
  let cookieHeader = "";
  if (req?.headers?.get) {
    cookieHeader = req.headers.get("cookie") || "";
  }

  // 1. Try custom token cookie first (credentials login — most recent explicit login)
  let tokenValue = cookieHeader ? getCookieValueFromHeader(cookieHeader, "token") : undefined;

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
        if (DEBUG) console.log("[authFromCookie] custom token valid for", payload.email);
        return { email: payload.email, id: payload.id, name: payload.name };
      }
    } catch {}
  }

  // 2. Try manual NextAuth JWT verification (Google/Facebook login)
  const nextAuthTokenName = "next-auth.session-token";
  const secureTokenName = "__Secure-next-auth.session-token";

  let naToken = cookieHeader
    ? getCookieValueFromHeader(cookieHeader, nextAuthTokenName) || getCookieValueFromHeader(cookieHeader, secureTokenName)
    : undefined;

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
      if (DEBUG) console.log("[authFromCookie] NextAuth JWT valid for", payload.email);
      return { email: payload.email, id: payload.id, name: payload.name };
    }
  }

  if (DEBUG) console.log("[authFromCookie] no auth found");
  return null;
}

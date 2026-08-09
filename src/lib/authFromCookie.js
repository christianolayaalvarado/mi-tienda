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
 * Read a cookie value by name from the cookie header string.
 */
function readCookie(cookieHeader, name) {
  return getCookieValueFromHeader(cookieHeader, name);
}

/**
 * Resolves the authenticated user from cookies.
 * Priority: custom token (credentials) > manual NextAuth JWT verification.
 * Method: cookies() from next/headers (PRIMARY — works in Vercel serverless)
 *         then req.headers.get("cookie") as fallback (works in middleware/edge).
 *
 * @param {Request} [req] - Optional request object. Fallback for edge contexts.
 */
export async function getAuthUserFromCookie(req) {
  // PRIMARY: Read cookies via next/headers (works in Vercel serverless Route Handlers)
  let customToken = undefined;
  let naToken = undefined;

  try {
    const cookieStore = await cookies();
    customToken = cookieStore.get("token")?.value;
    naToken =
      cookieStore.get("next-auth.session-token")?.value ||
      cookieStore.get("__Secure-next-auth.session-token")?.value;
  } catch {}

  // FALLBACK: Read from req.headers if cookies() didn't yield results
  if (!customToken && !naToken && req?.headers?.get) {
    const cookieHeader = req.headers.get("cookie") || "";
    if (cookieHeader) {
      customToken = readCookie(cookieHeader, "token");
      naToken =
        readCookie(cookieHeader, "next-auth.session-token") ||
        readCookie(cookieHeader, "__Secure-next-auth.session-token");
    }
  }

  // 1. Try custom token cookie first (credentials login — most recent explicit login)
  if (customToken) {
    try {
      const decoded = decodeURIComponent(customToken);
      const payload = jwt.verify(decoded, getJwtSecret());
      if (payload?.email) {
        if (DEBUG) console.log("[authFromCookie] custom token valid for", payload.email);
        return { email: payload.email, id: payload.id, name: payload.name };
      }
    } catch {}
  }

  // 2. Try manual NextAuth JWT verification (Google/Facebook login)
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

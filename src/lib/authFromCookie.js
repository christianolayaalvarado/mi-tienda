import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { getJwtSecret } from "./getJwtSecret";

/**
 * Verify a NextAuth JWT token using jose (same library NextAuth uses).
 * This is the PRIMARY auth method for API routes in Next.js App Router.
 * getServerSession() from next-auth@4 does NOT work reliably in Route Handlers.
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
 * Priority: manual NextAuth JWT (Google/Facebook) > custom token (credentials).
 *
 * When BOTH cookies exist, NextAuth takes precedence because:
 * - Credentials login clears NextAuth cookies (in /api/auth/login)
 * - So if NextAuth cookie still exists, it means Google/Facebook login happened AFTER
 *   the last credentials login and is the most recent authentication.
 */
export async function getAuthUserFromCookie() {
  // 1. Try NextAuth JWT first (Google/Facebook login — most recent)
  try {
    const cookieStore = await cookies();
    let tokenValue = cookieStore.get("next-auth.session-token")?.value || cookieStore.get("__Secure-next-auth.session-token")?.value;
    if (tokenValue) {
      try { tokenValue = decodeURIComponent(tokenValue); } catch {}
      const payload = await verifyNextAuthJWT(tokenValue);
      if (payload?.email) {
        return { email: payload.email, id: payload.id, name: payload.name };
      }
    }
  } catch {}

  // 2. Try custom token cookie (credentials login)
  try {
    const cookieStore = await cookies();
    const tokenValue = cookieStore.get("token")?.value;
    if (tokenValue) {
      const payload = jwt.verify(decodeURIComponent(tokenValue), getJwtSecret());
      if (payload?.email) {
        return { email: payload.email, id: payload.id, name: payload.name };
      }
    }
  } catch {}

  return null;
}

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
 * Priority: custom token (credentials login) > manual NextAuth JWT verification.
 * getServerSession() is intentionally NOT used here because it fails silently
 * in Next.js App Router Route Handlers (next-auth@4 is CJS and can't access
 * the request context properly in the App Router).
 */
export async function getAuthUserFromCookie() {
  // 1. Try custom token cookie first (credentials login — most recent explicit login)
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

  // 2. Try manual NextAuth JWT verification (Google/Facebook login)
  //    Reads the session token cookie directly and verifies with jose.
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

  return null;
}

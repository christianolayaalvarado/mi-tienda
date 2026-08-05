import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { getJwtSecret } from "./getJwtSecret";

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
 * Priority: custom token (credentials login) > NextAuth session (Google/Facebook).
 * The custom token cookie is set by /api/auth/login and represents the most
 * recent explicit login. If it exists, we use it regardless of any stale
 * next-auth.session-token that might still be lingering.
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

  // 2. Try NextAuth session (Google/Facebook login)
  try {
    const { getServerSession } = await import("next-auth");
    const { authOptions } = await import("./authOptions");
    const session = await getServerSession(authOptions);
    if (session?.user?.email) {
      return { email: session.user.email, id: session.user.id, name: session.user.name };
    }
  } catch {}

  // 3. If getServerSession failed, try manually verifying the NextAuth JWT cookie
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

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
 * Priority: NextAuth session (Google/Facebook) > custom token cookie.
 */
export async function getAuthUserFromCookie() {
  // 1. Try NextAuth session first (getServerSession)
  try {
    const { getServerSession } = await import("next-auth");
    const { authOptions } = await import("./authOptions");
    const session = await getServerSession(authOptions);
    if (session?.user?.email) {
      return { email: session.user.email, id: session.user.id, name: session.user.name };
    }
  } catch {}

  // 2. If getServerSession failed, try manually verifying the NextAuth JWT cookie
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

  // 3. Fall back to custom token cookie (credentials login only)
  try {
    const cookieStore = await cookies();
    const tokenValue = cookieStore.get("token")?.value;
    if (!tokenValue) return null;
    const payload = jwt.verify(decodeURIComponent(tokenValue), getJwtSecret());
    if (!payload?.email) return null;
    return payload;
  } catch (error) {
    return null;
  }
}

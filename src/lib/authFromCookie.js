import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { getJwtSecret } from "./getJwtSecret";

/**
 * Resolves the authenticated user from cookies.
 * Priority: NextAuth session (Google/Facebook) > custom token cookie.
 * When next-auth.session-token cookie exists, we NEVER fall back to custom token
 * to prevent showing a different user (e.g. admin@demo.com) after Google login.
 */
export async function getAuthUserFromCookie() {
  // Check if NextAuth session cookie exists at all
  let hasSessionCookie = false;
  try {
    const cookieStore = await cookies();
    hasSessionCookie = !!cookieStore.get("next-auth.session-token")?.value;
  } catch {}

  // 1. Try NextAuth session first (Google/Facebook login)
  try {
    const { getServerSession } = await import("next-auth");
    const { authOptions } = await import("./authOptions");
    const session = await getServerSession(authOptions);
    if (session?.user?.email) {
      return { email: session.user.email, id: session.user.id, name: session.user.name };
    }
  } catch {}

  // 2. If next-auth session cookie exists but getServerSession failed,
  //    do NOT fall back to custom token — the user is a social login user
  //    and the custom token is stale.
  if (hasSessionCookie) {
    return null;
  }

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

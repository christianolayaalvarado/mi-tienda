import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { getJwtSecret } from "./getJwtSecret";

/**
 * Resolves the authenticated user from cookies.
 * Priority: NextAuth session (Google/Facebook) > custom token cookie.
 * When NextAuth session exists, the old custom token cookie is stale
 * and should be cleared.
 */
export async function getAuthUserFromCookie() {
  // 1. Try NextAuth session first (Google/Facebook login)
  try {
    const { getServerSession } = await import("next-auth");
    const { authOptions } = await import("./authOptions");
    const session = await getServerSession(authOptions);
    if (session?.user?.email) {
      return { email: session.user.email, id: session.user.id, name: session.user.name };
    }
  } catch {}

  // 2. Fall back to custom token cookie (credentials login)
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

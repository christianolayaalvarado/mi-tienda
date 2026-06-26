import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || "change_this_secret";

export async function getAuthUserFromCookie() {
  try {
    const cookieStore = await cookies();
    const tokenValue = cookieStore.get("token")?.value;

    if (!tokenValue) return null;

    const payload = jwt.verify(decodeURIComponent(tokenValue), JWT_SECRET);
    if (!payload?.email) return null;

    return payload;
  } catch (error) {
    return null;
  }
}

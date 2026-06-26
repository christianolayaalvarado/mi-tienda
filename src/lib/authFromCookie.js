import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { getJwtSecret } from "./getJwtSecret";

export async function getAuthUserFromCookie() {
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

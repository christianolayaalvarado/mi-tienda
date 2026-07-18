import jwt from "jsonwebtoken";
import { getJwtSecret } from "@/lib/getJwtSecret";
import prisma from "@/lib/prisma";

function getCookieValue(cookieHeader, name) {
  if (!cookieHeader) return undefined;
  const match = cookieHeader.split("; ").find(c => c.startsWith(name + "="));
  return match ? match.split("=").slice(1).join("=") : undefined;
}

export async function GET(req) {
  try {
    const cookieHeader = req.headers.get("cookie") || "";

    // Try custom 'token' cookie first, then NextAuth session token
    let tokenEncoded = getCookieValue(cookieHeader, "token");

    if (!tokenEncoded) {
      const nextAuthToken = getCookieValue(cookieHeader, "next-auth.session-token");
      if (nextAuthToken) {
        tokenEncoded = encodeURIComponent(nextAuthToken);
      }
    }

    if (!tokenEncoded) {
      const auth = req.headers.get("authorization");
      if (auth && auth.startsWith("Bearer ")) {
        tokenEncoded = encodeURIComponent(auth.slice(7));
      }
    }

    if (!tokenEncoded) {
      return new Response(JSON.stringify({ ok: false, message: "No hay token" }), { status: 401, headers: { "Content-Type": "application/json" } });
    }

    const token = decodeURIComponent(tokenEncoded);

    let payload;
    try {
      payload = jwt.verify(token, getJwtSecret());
    } catch (err) {
      return new Response(JSON.stringify({ ok: false, message: "Token inválido o expirado" }), { status: 401, headers: { "Content-Type": "application/json" } });
    }

    let selectedMascot = "box";
    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: payload.id },
        select: { selectedMascot: true },
      });
      if (dbUser?.selectedMascot) {
        selectedMascot = dbUser.selectedMascot;
      }
    } catch {}

    return new Response(JSON.stringify({ ok: true, user: { ...payload, selectedMascot } }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (err) {
    console.error("[/api/auth/me] error:", err);
    return new Response(JSON.stringify({ ok: false, message: "Token inválido o expirado" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }
}

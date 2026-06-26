// src/app/api/auth/me/route.js
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;

function getCookieValue(cookieHeader, name) {
  if (!cookieHeader) return undefined;
  const match = cookieHeader.split("; ").find(c => c.startsWith(name + "="));
  return match ? match.split("=").slice(1).join("=") : undefined;
}

export async function GET(req) {
  try {
    const cookieHeader = req.headers.get("cookie") || "";

    let tokenEncoded = getCookieValue(cookieHeader, "token");

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
      payload = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return new Response(JSON.stringify({ ok: false, message: "Token inválido o expirado" }), { status: 401, headers: { "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ ok: true, user: payload }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (err) {
    console.error("[/api/auth/me] error:", err);
    return new Response(JSON.stringify({ ok: false, message: "Token inválido o expirado" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }
}

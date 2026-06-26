// src/app/api/auth/logout/route.js
import { buildAuthClearCookieHeaders } from "@/lib/authCookies";

export async function POST() {
  try {
    const cookies = buildAuthClearCookieHeaders();

    const headers = new Headers();
    cookies.forEach((c) => headers.append("Set-Cookie", c));
    headers.set("Content-Type", "application/json");

    return new Response(JSON.stringify({ ok: true, message: "Sesión cerrada" }), {
      status: 200,
      headers,
    });
  } catch (err) {
    console.error("[/api/auth/logout] error:", err);
    return new Response(JSON.stringify({ ok: false, message: "Error cerrando sesión" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// src/app/api/auth/refresh/route.js
export async function POST(req) {
  try {
    const cookieHeader = req.headers.get("cookie") || "";

    if (!cookieHeader.includes("refreshToken=")) {
      return new Response(JSON.stringify({ ok: false, message: "No refresh token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, message: "Refresh acknowledged" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[/api/auth/refresh] error:", err);
    return new Response(JSON.stringify({ ok: false, message: "Error interno" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

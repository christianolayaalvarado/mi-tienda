import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || "change_this_secret";

export async function GET(req) {
  try {
    // Leer cookies del request
    const cookieHeader = req.headers.get("cookie") || "";
    const cookies = Object.fromEntries(
      cookieHeader.split(";").map((c) => {
        const [key, ...v] = c.trim().split("=");
        return [key, decodeURIComponent(v.join("="))];
      })
    );

    const token = cookies["token"];
    if (!token) {
      return NextResponse.json({ ok: false, message: "No hay sesión activa" }, { status: 401 });
    }

    // Verificar token
    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      console.error("[session] token inválido:", err);
      return NextResponse.json({ ok: false, message: "Token inválido o expirado" }, { status: 401 });
    }

    // Responder con datos del usuario
    return NextResponse.json(
      {
        ok: true,
        user: {
          id: payload.id,
          email: payload.email,
          name: payload.name,
          emailVerified: payload.emailVerified,
          store: payload.store || null,
          storeCode: payload.storeCode || null,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[/api/auth/session] error:", err);
    return NextResponse.json({ ok: false, message: "Error interno del servidor" }, { status: 500 });
  }
}
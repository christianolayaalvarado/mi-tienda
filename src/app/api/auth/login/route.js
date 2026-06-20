import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || "change_this_secret";
const TOKEN_MAX_AGE = 60 * 60 * 24; // 1 day in seconds

function buildSetCookieHeader(name, value, opts = {}) {
  const parts = [`${name}=${value}`];
  if (opts.maxAge) parts.push(`Max-Age=${opts.maxAge}`);
  if (opts.path) parts.push(`Path=${opts.path}`);
  if (opts.httpOnly) parts.push("HttpOnly");
  if (opts.sameSite) parts.push(`SameSite=${opts.sameSite}`);
  if (opts.secure) parts.push("Secure");
  if (opts.domain) parts.push(`Domain=${opts.domain}`);
  return parts.join("; ");
}

export async function POST(req) {
  try {
    const { email: rawEmail, password } = await req.json();

    if (!rawEmail || !password) {
      return new Response(JSON.stringify({ ok: false, message: "Email y contraseña requeridos" }), { status: 400 });
    }

    const email = rawEmail.toLowerCase();

    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { email },
      include: { stores: true },
    });

    if (!user) {
      return new Response(JSON.stringify({ ok: false, message: "Credenciales inválidas" }), { status: 401 });
    }

    // Comparar contraseña (bcrypt, con fallback a bcryptjs si hay problemas)
    let isValid = false;
    try {
      isValid = await bcrypt.compare(password, user.password);
    } catch (e) {
      try {
        const bcryptjs = require("bcryptjs");
        isValid = bcryptjs.compareSync(password, user.password);
      } catch (err) {
        console.error("[login] bcrypt fallback failed:", err);
        return new Response(JSON.stringify({ ok: false, message: "Error interno" }), { status: 500 });
      }
    }

    if (!isValid) {
      return new Response(JSON.stringify({ ok: false, message: "Credenciales inválidas" }), { status: 401 });
    }

    // Crear payload del token (no incluir datos sensibles)
    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
      emailVerified: user.emailVerified,
      store: user.stores?.[0]?.name || null,
      storeCode: user.stores?.[0]?.code || null,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: `${TOKEN_MAX_AGE}s` });

    // Construir cookie
    const cookie = buildSetCookieHeader("token", token, {
      maxAge: TOKEN_MAX_AGE,
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
      secure: process.env.NODE_ENV === "production",
    });

    // Responder con cookie y datos públicos del usuario
    const safeUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      emailVerified: user.emailVerified,
      store: user.stores?.[0]?.name || null,
      storeCode: user.stores?.[0]?.code || null,
    };

    return new Response(JSON.stringify({ ok: true, user: safeUser }), {
      status: 200,
      headers: {
        "Set-Cookie": cookie,
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    console.error("[/api/auth/login] error:", err);
    return new Response(JSON.stringify({ ok: false, message: "Error interno del servidor" }), { status: 500 });
  }
}

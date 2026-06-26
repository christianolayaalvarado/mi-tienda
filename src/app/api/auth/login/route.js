// src/app/api/auth/login/route.js
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { checkRateLimit } from "@/lib/rateLimit";
import { getJwtSecret } from "@/lib/getJwtSecret";
const TOKEN_MAX_AGE = 60 * 60 * 24; // 1 day in seconds
const COOKIE_SAMESITE = process.env.COOKIE_SAMESITE || "Lax";
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || undefined;
const IS_PROD = process.env.NODE_ENV === "production";

function buildSetCookieHeader(name, value, opts = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];

  if (typeof opts.maxAge === "number") {
    parts.push(`Max-Age=${opts.maxAge}`);
    try {
      const expiresDate = new Date(Date.now() + opts.maxAge * 1000);
      parts.push(`Expires=${expiresDate.toUTCString()}`);
    } catch (e) { }
  }

  parts.push(`Path=${opts.path || "/"}`);
  if (opts.domain) parts.push(`Domain=${opts.domain}`);
  if (opts.httpOnly) parts.push("HttpOnly");
  if (opts.secure) parts.push("Secure");
  if (opts.sameSite) parts.push(`SameSite=${opts.sameSite}`);

  return parts.join("; ");
}

export async function POST(req) {
  try {
    let body;
    try {
      body = await req.json();
    } catch (parseErr) {
      console.error("[/api/auth/login] invalid JSON body:", parseErr?.message);
      return new Response(JSON.stringify({ ok: false, message: "Body inválido: JSON esperado" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    const { email: rawEmail, password } = body || {};
    if (!rawEmail || !password) {
      return new Response(JSON.stringify({ ok: false, message: "Email y contraseña requeridos" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    const email = String(rawEmail).toLowerCase().trim();

    // Rate limiting
    const rateKey = `login:${email}`;
    const { allowed, retryAfter } = checkRateLimit(rateKey);
    if (!allowed) {
      return new Response(
        JSON.stringify({ ok: false, message: `Demasiados intentos. Intenta de nuevo en ${retryAfter} segundos.` }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { stores: true },
    });

    if (!user) {
      return new Response(JSON.stringify({ ok: false, message: "Credenciales inválidas" }), { status: 401, headers: { "Content-Type": "application/json" } });
    }

    if (!user.emailVerified) {
      return new Response(JSON.stringify({ ok: false, message: "Cuenta no verificada" }), { status: 403, headers: { "Content-Type": "application/json" } });
    }

    if (!user.password) {
      console.warn("[/api/auth/login] user has no password hash:", user.id);
      return new Response(JSON.stringify({ ok: false, message: "Credenciales inválidas" }), { status: 401, headers: { "Content-Type": "application/json" } });
    }

    let isValid = false;
    try {
      isValid = await bcrypt.compare(String(password), user.password);
    } catch (e) {
      try {
        const bcryptjs = await import("bcryptjs");
        const compareSync = bcryptjs.compareSync || bcryptjs.default?.compareSync;
        if (typeof compareSync === "function") {
          isValid = compareSync(String(password), user.password);
        } else {
          console.error("[/api/auth/login] bcryptjs compareSync not available");
          return new Response(JSON.stringify({ ok: false, message: "Error interno" }), { status: 500, headers: { "Content-Type": "application/json" } });
        }
      } catch (err) {
        console.error("[/api/auth/login] bcrypt fallback failed:", err);
        return new Response(JSON.stringify({ ok: false, message: "Error interno" }), { status: 500, headers: { "Content-Type": "application/json" } });
      }
    }

    if (!isValid) {
      return new Response(JSON.stringify({ ok: false, message: "Credenciales inválidas" }), { status: 401, headers: { "Content-Type": "application/json" } });
    }

    const payload = {
      id: user.id,
      email: user.email,
      name: user.name || null,
      role: user.role || "USER",
      emailVerified: user.emailVerified,
      store: user.stores?.[0]?.name || null,
      storeCode: user.stores?.[0]?.code || null,
    };

    const token = jwt.sign(payload, getJwtSecret(), { expiresIn: TOKEN_MAX_AGE });

    const cookie = buildSetCookieHeader("token", token, {
      maxAge: TOKEN_MAX_AGE,
      path: "/",
      httpOnly: true,
      sameSite: COOKIE_SAMESITE,
      secure: IS_PROD,
      domain: COOKIE_DOMAIN,
    });

    const safeUser = {
      id: user.id,
      email: user.email,
      name: user.name || null,
      role: user.role || "USER",
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
    console.error("[/api/auth/login] error:", err?.message || err, err?.stack || "");
    return new Response(JSON.stringify({ ok: false, message: "Error interno del servidor" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}

// src/app/api/auth/confirm-code/route.js
import prisma from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(req) {
  try {
    let body = {};
    try {
      body = await req.json();
    } catch (e) {
      body = {};
    }

    const url = new URL(req.url);
    const qEmail = url.searchParams.get("email");
    const qCode = url.searchParams.get("code");

    const rawEmail = (body.email || qEmail || "")?.toString();
    const rawCode = (body.code || qCode || "")?.toString();

    if (!rawEmail) {
      return new Response(JSON.stringify({ ok: false, message: "No se recibió email" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (!rawCode) {
      return new Response(JSON.stringify({ ok: false, message: "No se recibió código" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const email = String(rawEmail).toLowerCase().trim();
    const code = String(rawCode).trim();

    const rl = checkRateLimit(`confirm-code:${email}`, 5, 15 * 60 * 1000);
    if (!rl.ok) {
      return new Response(JSON.stringify({ ok: false, message: "Demasiados intentos. Espera unos minutos." }), {
        status: 429,
        headers: { "Content-Type": "application/json" },
      });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return new Response(JSON.stringify({ ok: false, message: "No se encontró el email" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!user.verificationCode) {
      return new Response(JSON.stringify({ ok: false, message: "No hay código asociado a este email" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check TTL expiration
    if (user.verificationSentAt) {
      const sent = new Date(user.verificationSentAt).getTime();
      const now = Date.now();
      const TTL_MS = (process.env.VERIFICATION_TTL_SECONDS ? Number(process.env.VERIFICATION_TTL_SECONDS) : 15 * 60) * 1000;
      if (now - sent > TTL_MS) {
        return new Response(JSON.stringify({ ok: false, message: "Código expirado. Solicita uno nuevo." }), { status: 410, headers: { "Content-Type": "application/json" } });
      }
    }

    if (String(user.verificationCode).trim() !== code) {
      return new Response(JSON.stringify({ ok: false, message: "Código inválido" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationCode: null,
        verificationSentAt: null,
      },
    });

    return new Response(JSON.stringify({ ok: true, message: "Cuenta verificada correctamente" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[/api/auth/confirm-code] error:", err);
    return new Response(JSON.stringify({ ok: false, message: "Error interno del servidor" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

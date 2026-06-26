// src/app/api/auth/confirm-code/route.js
import prisma from "@/lib/prisma";

export async function POST(req) {
  try {
    // Aceptar body JSON o query params para mayor compatibilidad
    let body = {};
    try {
      body = await req.json();
    } catch (e) {
      // body no JSON o vacío; seguiremos con query params
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

    // Buscar usuario por email (normalizado)
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      console.warn("[/api/auth/confirm-code] user not found for email:", email);
      return new Response(JSON.stringify({ ok: false, message: "No se encontró el email" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Si no hay código guardado
    if (!user.verificationCode) {
      console.warn("[/api/auth/confirm-code] no verificationCode stored for user:", user.id);
      return new Response(JSON.stringify({ ok: false, message: "No hay código asociado a este email" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Opcional: comprobar expiración si guardas verificationSentAt
    // if (user.verificationSentAt) {
    //   const sent = new Date(user.verificationSentAt).getTime();
    //   const now = Date.now();
    //   const TTL_MS = (process.env.VERIFICATION_TTL_SECONDS ? Number(process.env.VERIFICATION_TTL_SECONDS) : 15 * 60) * 1000;
    //   if (now - sent > TTL_MS) {
    //     return new Response(JSON.stringify({ ok: false, message: "Código expirado" }), { status: 410, headers: { "Content-Type": "application/json" } });
    //   }
    // }

    // Comparación segura del código (trim y comparar)
    if (String(user.verificationCode).trim() !== code) {
      console.warn("[/api/auth/confirm-code] invalid code for user:", user.id);
      return new Response(JSON.stringify({ ok: false, message: "Código inválido" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Marcar como verificado y limpiar campos relacionados
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

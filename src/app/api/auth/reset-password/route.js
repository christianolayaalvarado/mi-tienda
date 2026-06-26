// src/app/api/auth/reset-password/route.js
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { sendPasswordResetSuccessEmail } from "@/lib/email";

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { token, password } = body || {};

    if (!token || !password) {
      return new Response(JSON.stringify({ ok: false, message: "Token y contraseña requeridos" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    if (password.length < 6) {
      return new Response(JSON.stringify({ ok: false, message: "La contraseña debe tener al menos 6 caracteres" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    // Buscar usuario con token válido
    const user = await prisma.user.findFirst({
      where: {
        verificationCode: `RESET:${tokenHash}`,
      },
    });

    if (!user) {
      return new Response(JSON.stringify({ ok: false, message: "Token inválido o expirado" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    // Verificar expiración
    const expires = new Date(user.verificationSentAt).getTime();
    if (Date.now() > expires) {
      return new Response(JSON.stringify({ ok: false, message: "Token expirado. Solicita uno nuevo." }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    // Hashear nueva contraseña
    const hashed = await bcrypt.hash(password, 10);

    // Actualizar contraseña y limpiar token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashed,
        verificationCode: null,
        verificationSentAt: null,
      },
    });

    // Enviar email de confirmación (no bloquear)
    sendPasswordResetSuccessEmail({ to: user.email }).catch(() => {});

    return new Response(JSON.stringify({ ok: true, message: "Contraseña actualizada correctamente" }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (err) {
    console.error("[reset-password] error:", err?.message || err);
    return new Response(JSON.stringify({ ok: false, message: "Error interno del servidor" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}

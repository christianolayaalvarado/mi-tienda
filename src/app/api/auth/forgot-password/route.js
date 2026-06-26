// src/app/api/auth/forgot-password/route.js
import prisma from "@/lib/prisma";
import crypto from "crypto";
import { sendPasswordResetEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawEmail = (body.email || "").toString();
    if (!rawEmail) {
      return new Response(JSON.stringify({ ok: false, message: "Email requerido" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    const email = rawEmail.toLowerCase().trim();

    // Rate limiting
    const rateKey = `forgot:${email}`;
    const { allowed } = checkRateLimit(rateKey);
    if (!allowed) {
      // Por seguridad, devolver éxito aunque esté rate-limited
      return new Response(JSON.stringify({ ok: true, message: "Si el correo existe, recibirás instrucciones." }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // Por seguridad, siempre devolver éxito aunque el email no exista
    if (!user) {
      return new Response(JSON.stringify({ ok: true, message: "Si el correo existe, recibirás instrucciones." }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    // Generar token de reset
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    // Guardar en usuario (usando campos existentes o uno nuevo)
    // Usamos verificationCode y verificationSentAt como campos temporales para el reset
    // O mejor: agregar campos resetToken y resetExpires al schema
    // Por ahora, usamos sellerCode y city como campos temporales (no se usan para esto)
    // Mejor: usar verificationCode con un prefijo especial
    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationCode: `RESET:${resetTokenHash}`,
        verificationSentAt: resetExpires,
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;

    try {
      await sendPasswordResetEmail({ to: email, resetUrl });
    } catch (emailErr) {
      // No fallar si el email no se puede enviar
    }

    return new Response(JSON.stringify({ ok: true, message: "Si el correo existe, recibirás instrucciones." }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (err) {
    console.error("[forgot-password] error:", err?.message || err);
    return new Response(JSON.stringify({ ok: true, message: "Si el correo existe, recibirás instrucciones." }), { status: 200, headers: { "Content-Type": "application/json" } });
  }
}

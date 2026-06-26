// src/app/api/auth/send-code/route.js
import prisma from "@/lib/prisma";
import { sendVerificationCodeEmail } from "@/lib/email";

const VERIFICATION_TTL_SECONDS = Number(process.env.VERIFICATION_TTL_SECONDS || 15 * 60);

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawEmail = (body.email || "").toString();
    if (!rawEmail) {
      return new Response(JSON.stringify({ ok: false, message: "Email requerido" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }
    const email = rawEmail.toLowerCase().trim();

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return new Response(JSON.stringify({ ok: false, message: "No se encontró el email" }), { status: 404, headers: { "Content-Type": "application/json" } });
    }

    const code = generateCode();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationCode: code,
        verificationSentAt: new Date(),
      },
    });

    await sendVerificationCodeEmail({ to: email, code });

    return new Response(JSON.stringify({ ok: true, message: "Código enviado correctamente" }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (err) {
    console.error("[/api/auth/send-code] error:", err?.message || err);
    return new Response(JSON.stringify({ ok: false, message: "Error enviando código. Verifica la configuración de correo." }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}

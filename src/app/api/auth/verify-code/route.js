// src/app/api/auth/verify-code/route.js
import prisma from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(req) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return Response.json({ message: "Email y código son requeridos" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const rl = checkRateLimit(`verify-code:${normalizedEmail}`);
    if (!rl.allowed) {
      return Response.json({ message: "Demasiados intentos. Espera unos minutos." }, { status: 429 });
    }

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (!user) {
      return Response.json({ message: "Código inválido o expirado" }, { status: 400 });
    }

    if (!user.verificationCode) {
      return Response.json({ message: "No hay código asociado a este email" }, { status: 400 });
    }

    // Check TTL expiration
    if (user.verificationSentAt) {
      const sent = new Date(user.verificationSentAt).getTime();
      const now = Date.now();
      const TTL_MS = (process.env.VERIFICATION_TTL_SECONDS ? Number(process.env.VERIFICATION_TTL_SECONDS) : 15 * 60) * 1000;
      if (now - sent > TTL_MS) {
        return Response.json({ message: "Código expirado. Solicita uno nuevo." }, { status: 410 });
      }
    }

    if (String(user.verificationCode).trim() !== String(code).trim()) {
      return Response.json({ message: "Código inválido" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationCode: null,
        verificationSentAt: null,
      },
    });

    return Response.json({ message: "Verificación exitosa" });
  } catch (err) {
    console.error("[/api/auth/verify-code] error:", err);
    return Response.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}

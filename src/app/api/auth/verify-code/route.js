// src/app/api/auth/verify-code/route.js
import prisma from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(req) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return Response.json({ message: "Email y código son requeridos" }, { status: 400 });
    }

    const rl = checkRateLimit(`verify-code:${email}`, 5, 15 * 60 * 1000);
    if (!rl.ok) {
      return Response.json({ message: "Demasiados intentos. Espera unos minutos." }, { status: 429 });
    }

    const record = await prisma.verificationCode.findFirst({
      where: { email: email.toLowerCase().trim() },
      orderBy: { createdAt: "desc" },
    });

    if (!record || record.code !== code || Date.now() > record.expires.getTime()) {
      return Response.json({ message: "Código inválido o expirado" }, { status: 400 });
    }

    await prisma.user.update({
      where: { email: email.toLowerCase().trim() },
      data: { emailVerified: true },
    });

    return Response.json({ message: "Verificación exitosa" });
  } catch (err) {
    console.error("[/api/auth/verify-code] error:", err);
    return Response.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}

// src/app/api/auth/verify-code/route.js
import prisma from "@/lib/prisma";

export async function POST(req) {
  const { email, code } = await req.json();

  // Buscar el código de verificación más reciente para el email dado
  const record = await prisma.verificationCode.findFirst({
    where: { email },
    orderBy: { createdAt: "desc" },
  });

  if (!record || record.code !== code || Date.now() > record.expires.getTime()) {
    return Response.json({ message: "Código inválido o expirado" }, { status: 400 });
  }

  // Actualizar usuario como verificado
  await prisma.user.update({
    where: { email },
    data: { emailVerified: true },
  });

  return Response.json({ message: "Verificación exitosa" });
}

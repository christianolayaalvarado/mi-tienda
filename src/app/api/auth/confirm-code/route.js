// src/app/api/auth/confirm-code/route.js
import prisma from "@/lib/prisma";

export async function POST(req) {
  try {
    const { email, code } = await req.json();

    // 1️⃣ Buscar usuario por email
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return new Response(
        JSON.stringify({ ok: false, message: "Usuario no encontrado" }),
        { status: 404 }
      );
    }

    // 2️⃣ Validar código
    if (user.verificationCode !== code) {
      return new Response(
        JSON.stringify({ ok: false, message: "Código inválido" }),
        { status: 400 }
      );
    }

    // 3️⃣ Marcar como verificado y limpiar código
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationCode: null,
      },
    });

    return new Response(
      JSON.stringify({ ok: true, message: "Cuenta verificada correctamente" }),
      { status: 200 }
    );
  } catch (err) {
    console.error("Error en confirm-code:", err);
    return new Response(
      JSON.stringify({ ok: false, message: "Error interno del servidor" }),
      { status: 500 }
    );
  }
}

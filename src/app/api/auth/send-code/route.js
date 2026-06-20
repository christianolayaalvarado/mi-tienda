// src/app/api/auth/send-code/route.js
import prisma from "@/lib/prisma";
import { sendVerificationCodeEmail } from "@/lib/email";

export async function POST(req) {
  try {
    const { email, provider = "gmail" } = await req.json();

    // 1️⃣ Buscar usuario
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return new Response(
        JSON.stringify({ ok: false, message: "Usuario no encontrado" }),
        { status: 404 }
      );
    }

    // 2️⃣ Generar nuevo código
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    await prisma.user.update({
      where: { id: user.id },
      data: { verificationCode: code },
    });

    // 3️⃣ Enviar correo
    try {
      await sendVerificationCodeEmail({ to: email, code, provider });
      return new Response(
        JSON.stringify({ ok: true, message: "Código reenviado correctamente" }),
        { status: 200 }
      );
    } catch (err) {
      console.error("Error enviando correo:", err);
      return new Response(
        JSON.stringify({ ok: false, message: "Error enviando correo" }),
        { status: 500 }
      );
    }
  } catch (err) {
    console.error("Error en send-code:", err);
    return new Response(
      JSON.stringify({ ok: false, message: "Error interno del servidor" }),
      { status: 500 }
    );
  }
}

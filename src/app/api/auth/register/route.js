// src/app/api/auth/register/route.js
import prisma from "@/lib/prisma";
import { sendVerificationCodeEmail } from "@/lib/email";

export async function POST(req) {
  try {
    const { name, email, password, storeName, provider = "gmail" } = await req.json();

    // 1️⃣ Validar si el email ya existe
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return new Response(
        JSON.stringify({ ok: false, message: "El email ya está registrado" }),
        { status: 400 }
      );
    }

    // 2️⃣ Crear usuario
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password, // ojo: aquí deberías hashear antes con bcrypt
        emailVerified: false,
        stores: storeName
          ? { create: { name: storeName, code: `SC${Date.now()}` } }
          : undefined,
      },
    });

    // 3️⃣ Generar código
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    await prisma.user.update({
      where: { id: user.id },
      data: { verificationCode: code },
    });

    // 4️⃣ Enviar correo
    try {
      await sendVerificationCodeEmail({ to: email, code, provider });
      return new Response(
        JSON.stringify({ ok: true, message: "Usuario creado y correo enviado" }),
        { status: 200 }
      );
    } catch (err) {
      console.error("Error enviando correo:", err);
      return new Response(
        JSON.stringify({ ok: true, message: "Usuario creado, pero error enviando correo" }),
        { status: 200 }
      );
    }
  } catch (err) {
    console.error("Error registrando usuario:", err);
    return new Response(
      JSON.stringify({ ok: false, message: "Error registrando usuario" }),
      { status: 500 }
    );
  }
}

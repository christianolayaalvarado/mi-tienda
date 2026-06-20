import bcrypt from "bcrypt";
import prisma from "@/lib/prisma";

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, password, name, storeName } = body || {};

    if (!email || !password || !storeName) {
      return new Response(JSON.stringify({ error: "Email, contraseña y nombre de tienda son requeridos" }), { status: 400 });
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    // Evitar duplicados
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return new Response(JSON.stringify({ error: "Usuario ya registrado" }), { status: 409 });
    }

    // Hashear contraseña
    const saltRounds = 10;
    const hashed = await bcrypt.hash(String(password), saltRounds);

    // Crear usuario y tienda en una transacción
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashed,
        name: name || null,
        role: "SELLER",
        stores: {
          create: {
            name: storeName,
            code: `STORE-${Date.now()}`, // código único para la tienda
          },
        },
      },
      include: {
        stores: true,
      },
    });

    // Generar código de verificación
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationCode: code,
        verificationSentAt: new Date(),
      },
    });

    // Enviar correo con el código (pendiente implementar)
    // await sendVerificationEmail(user.email, code);

    return new Response(
      JSON.stringify({
        ok: true,
        message: "Usuario creado. Código de verificación enviado si está configurado.",
        id: user.id,
        name: user.name,
        email: user.email,
        stores: user.stores,
      }),
      { status: 201 }
    );
  } catch (err) {
    console.error("Error en register route:", err);
    return new Response(JSON.stringify({ error: "Error interno al registrar usuario" }), { status: 500 });
  }
}

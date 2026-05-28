// app/api/auth/register/route.js
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid"; // Para generar códigos únicos
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    // 🔹 Leer datos del body
    const body = await req.json();
    const { email, password, name, storeName } = body;

    // 🔹 Validación básica
    if (!email || !password || !name || !storeName) {
      return NextResponse.json(
        { error: "Todos los campos son requeridos" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase();

    // 🔹 Revisar si el email ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "El email ya está registrado" },
        { status: 400 }
      );
    }

    // 🔹 Generar códigos únicos
    const sellerCode = uuidv4().slice(0, 8).toUpperCase();
    const storeCode = uuidv4().slice(0, 6).toUpperCase();

    // 🔹 Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // 🔹 Crear usuario y tienda
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        name,
        role: "SELLER",       // Campo role definido en el schema
        sellerCode,
        emailVerified: false,
        stores: {
          create: {
            name: storeName,
            code: storeCode,
          },
        },
      },
      include: { stores: true }, // Traer info de la tienda creada
    });

    // 🔹 NO enviar password al frontend
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(userWithoutPassword, { status: 201 });

  } catch (error) {
    console.error("Error registrando seller:", error);
    return NextResponse.json(
      { error: "Error registrando usuario" },
      { status: 500 }
    );
  }
}
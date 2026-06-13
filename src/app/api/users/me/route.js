// app/api/users/me/route.js
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

/**
 * PUT /api/users/me
 * Actualiza solo los campos recibidos: name, city, password.
 * No permite cambiar email ni otros campos sensibles desde aquí.
 */
export async function PUT(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response(JSON.stringify({ error: "No autorizado" }), { status: 401 });
    }

    const userId = session.user?.id;
    if (!userId) {
      return new Response(JSON.stringify({ error: "Usuario no identificado" }), { status: 401 });
    }

    let body;
    try {
      body = await req.json();
    } catch (err) {
      return new Response(JSON.stringify({ error: "Payload inválido" }), { status: 400 });
    }

    const updates = {};
    if (typeof body.name === "string" && body.name.trim() !== "") updates.name = body.name.trim();
    if (typeof body.city === "string") updates.city = body.city.trim();

    if (body.password && typeof body.password === "string") {
      if (body.password.length < 6) {
        return new Response(JSON.stringify({ error: "La contraseña debe tener al menos 6 caracteres" }), { status: 400 });
      }
      const hash = await bcrypt.hash(body.password, 10);
      // En tu schema Prisma el campo es `password`
      updates.password = hash;
    }

    if (Object.keys(updates).length === 0) {
      return new Response(JSON.stringify({ message: "No hay cambios" }), { status: 200 });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updates,
      select: { id: true, name: true, email: true, city: true },
    });

    return new Response(JSON.stringify(updated), { status: 200 });
  } catch (err) {
    console.error("Error en PUT /api/users/me:", err);
    return new Response(JSON.stringify({ error: "Error actualizando perfil" }), { status: 500 });
  }
}

// app/api/users/me/route.js
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

const JSON_HEADERS = { "Content-Type": "application/json" };

function jsonResponse(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: JSON_HEADERS });
}

export async function PUT(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return jsonResponse({ error: "No autorizado" }, 401);

    const userId = session.user?.id;
    if (!userId) return jsonResponse({ error: "Usuario no identificado" }, 401);

    let body;
    try {
      body = await req.json();
    } catch (err) {
      return jsonResponse({ error: "Payload inválido" }, 400);
    }

    const updates = {};
    if (typeof body.name === "string" && body.name.trim() !== "") updates.name = body.name.trim();
    if (typeof body.city === "string") updates.city = body.city.trim();

    if (body.password && typeof body.password === "string") {
      if (body.password.length < 6) return jsonResponse({ error: "La contraseña debe tener al menos 6 caracteres" }, 400);
      updates.password = await bcrypt.hash(body.password, 10);
    }

    if (Object.keys(updates).length === 0) return jsonResponse({ message: "No hay cambios" }, 200);

    console.log("PUT /api/users/me - userId:", userId, "updates:", updates);

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updates,
      select: { id: true, name: true, email: true, city: true },
    });

    return jsonResponse(updated, 200);
  } catch (err) {
    console.error("Error en PUT /api/users/me:", err);
    return jsonResponse({ error: "Error actualizando perfil" }, 500);
  }
}

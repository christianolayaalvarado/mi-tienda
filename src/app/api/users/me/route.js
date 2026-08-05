// app/api/users/me/route.js
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "@/lib/getJwtSecret";
import prisma from "@/lib/prisma";

const JSON_HEADERS = { "Content-Type": "application/json" };

function jsonResponse(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: JSON_HEADERS });
}

function getCookieValue(cookieHeader, name) {
  if (!cookieHeader) return undefined;
  const match = cookieHeader.split("; ").find(c => c.startsWith(name + "="));
  return match ? match.split("=").slice(1).join("=") : undefined;
}

async function verifyNextAuthJWT(tokenValue) {
  try {
    const { jwtVerify } = await import("jose");
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET);
    const { payload } = await jwtVerify(tokenValue, secret);
    return payload;
  } catch {
    return null;
  }
}

async function resolveUserId(req) {
  const cookieHeader = req.headers.get("cookie") || "";

  // 1. Custom token cookie first (credentials login — most recent explicit login)
  let tokenStr = getCookieValue(cookieHeader, "token");
  if (tokenStr) {
    try {
      const payload = jwt.verify(decodeURIComponent(tokenStr), getJwtSecret());
      if (payload?.id) return payload.id;
    } catch {}
  }

  // 2. NextAuth session (Google/Facebook login)
  const session = await getServerSession(authOptions);
  if (session?.user?.id) return session.user.id;

  // 3. Manual NextAuth JWT verification
  const nextAuthToken = getCookieValue(cookieHeader, "next-auth.session-token") || getCookieValue(cookieHeader, "__Secure-next-auth.session-token");
  if (nextAuthToken) {
    try { var decoded = decodeURIComponent(nextAuthToken); } catch { decoded = nextAuthToken; }
    const payload = await verifyNextAuthJWT(decoded);
    if (payload?.id) return payload.id;
    return null;
  }

  // 4. Bearer token
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    try {
      const payload = jwt.verify(auth.slice(7), getJwtSecret());
      if (payload?.id) return payload.id;
    } catch {}
  }

  return null;
}

export async function GET(req) {
  try {
    const userId = await resolveUserId(req);
    if (!userId) return jsonResponse({ error: "No autorizado" }, 401);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, city: true, address: true, phone: true, role: true },
    });

    if (!user) return jsonResponse({ error: "Usuario no encontrado" }, 404);
    return jsonResponse(user);
  } catch (err) {
    console.error("Error GET /api/users/me:", err);
    return jsonResponse({ error: "Error obteniendo perfil" }, 500);
  }
}

export async function PUT(req) {
  try {
    const userId = await resolveUserId(req);
    if (!userId) return jsonResponse({ error: "No autorizado" }, 401);

    let body;
    try {
      body = await req.json();
    } catch (err) {
      return jsonResponse({ error: "Payload inválido" }, 400);
    }

    const updates = {};
    if (typeof body.name === "string" && body.name.trim() !== "") updates.name = body.name.trim();
    if (typeof body.city === "string") updates.city = body.city.trim();
    if (typeof body.address === "string") updates.address = body.address.trim();
    if (typeof body.phone === "string") updates.phone = body.phone.trim();

    if (body.password && typeof body.password === "string") {
      if (body.password.length < 6) return jsonResponse({ error: "La contraseña debe tener al menos 6 caracteres" }, 400);
      updates.password = await bcrypt.hash(body.password, 10);
    }

    if (Object.keys(updates).length === 0) return jsonResponse({ message: "No hay cambios" }, 200);

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updates,
      select: { id: true, name: true, email: true, city: true, address: true, phone: true },
    });

    return jsonResponse(updated, 200);
  } catch (err) {
    console.error("Error PUT /api/users/me:", err);
    return jsonResponse({ error: "Error actualizando perfil" }, 500);
  }
}

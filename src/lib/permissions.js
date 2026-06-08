// lib/permissions.js
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

/**
 * Obtiene la sesión del servidor (si existe).
 */
export async function getSessionServer() {
  const session = await getServerSession(authOptions);
  return session || null;
}

/**
 * Respuestas JSON para 401/403 (helpers simples).
 */
export function unauthorizedJson() {
  return { status: 401, body: { error: "No autorizado" } };
}

export function forbiddenJson() {
  return { status: 403, body: { error: "No tienes permiso para esta acción" } };
}

/**
 * Verifica que la sesión exista y que el userId sea owner o que el rol sea admin.
 * Devuelve { ok: true, session } o { ok: false, status, body } para que el endpoint lo devuelva.
 */
export async function assertOwnerOrAdminServer(ownerId) {
  const session = await getSessionServer();
  if (!session) return { ok: false, ...unauthorizedJson() };

  const isAdmin = session.user?.role === "admin" || session.user?.role === "ADMIN";
  const isOwner = !!(session.user?.id && ownerId && String(session.user.id) === String(ownerId));

  if (!isAdmin && !isOwner) return { ok: false, ...forbiddenJson() };

  return { ok: true, session };
}

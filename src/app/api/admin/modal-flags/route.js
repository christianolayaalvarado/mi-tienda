import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerAuthUser } from "@/lib/serverAuth";

const DEFAULT_FLAGS = [
  { key: "welcome_registered", label: "Bienvenida - Usuarios registrados", audience: "registered" },
  { key: "welcome_unregistered", label: "Bienvenida - Usuarios nuevos", audience: "unregistered" },
  { key: "offers_modal", label: "Modal de ofertas", audience: "all" },
  { key: "seasonal_fiestas", label: "Fiestas Patrias", audience: "all" },
  { key: "seasonal_cancion", label: "Día de la Canción Criolla", audience: "all" },
  { key: "seasonal_navidad", label: "Navidad", audience: "all" },
  { key: "seasonal_san_valentin", label: "San Valentín", audience: "all" },
  { key: "seasonal_año_nuevo", label: "Año Nuevo", audience: "all" },
  { key: "promotion_banner", label: "Banner promocional", audience: "all" },
];

export async function GET() {
  try {
    const flags = await prisma.modalFlag.findMany({ orderBy: { createdAt: "asc" } });

    if (flags.length === 0) {
      const created = await prisma.modalFlag.createMany({ data: DEFAULT_FLAGS });
      const all = await prisma.modalFlag.findMany({ orderBy: { createdAt: "asc" } });
      return NextResponse.json({ flags: all });
    }

    return NextResponse.json({ flags });
  } catch (err) {
    console.error("GET modal-flags error:", err);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const user = await getServerAuthUser(req);
    if (!user || (user.role !== "admin" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, enabled, audience, activateAt, deactivateAt, metadata, label } = body;

    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const data = {};
    if (typeof enabled === "boolean") data.enabled = enabled;
    if (audience) data.audience = audience;
    if (activateAt !== undefined) data.activateAt = activateAt ? new Date(activateAt) : null;
    if (deactivateAt !== undefined) data.deactivateAt = deactivateAt ? new Date(deactivateAt) : null;
    if (metadata !== undefined) data.metadata = metadata;
    if (label) data.label = label;

    const flag = await prisma.modalFlag.update({ where: { id }, data });
    return NextResponse.json({ flag });
  } catch (err) {
    console.error("PUT modal-flags error:", err);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

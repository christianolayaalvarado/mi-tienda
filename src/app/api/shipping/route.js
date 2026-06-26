// src/app/api/shipping/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerAuthUser } from "@/lib/serverAuth";

// POST - Calcular costo de envío
export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { storeId, department, province } = body;

    if (!storeId) return NextResponse.json({ error: "storeId requerido" }, { status: 400 });
    if (!department) return NextResponse.json({ error: "department requerido" }, { status: 400 });

    // Buscar zona de envío de la tienda
    const zone = await prisma.shippingZone.findFirst({
      where: {
        storeId,
        department,
        isActive: true,
        OR: [
          { province: null },
          { province: province || null },
        ],
      },
      orderBy: [{ province: "asc" }, { name: "asc" }],
    });

    if (!zone) {
      return NextResponse.json({
        shippingCost: 0,
        estimatedDays: null,
        message: "No hay zona de envío configurada para esta ubicación. El vendedor aún no ofrece envíos a esta zona.",
      });
    }

    return NextResponse.json({
      shippingCost: zone.cost,
      estimatedDays: zone.estimatedDays,
      zoneName: zone.name,
    });
  } catch (err) {
    console.error("ERROR calculate shipping:", err);
    return NextResponse.json({ error: "Error calculando envío" }, { status: 500 });
  }
}

// GET - Listar zonas de envío de una tienda (público)
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get("storeId");

    if (!storeId) return NextResponse.json({ error: "storeId requerido" }, { status: 400 });

    const zones = await prisma.shippingZone.findMany({
      where: { storeId, isActive: true },
      orderBy: [{ department: "asc" }, { province: "asc" }],
    });

    return NextResponse.json({ zones });
  } catch (err) {
    console.error("ERROR GET shipping zones:", err);
    return NextResponse.json({ error: "Error obteniendo zonas" }, { status: 500 });
  }
}

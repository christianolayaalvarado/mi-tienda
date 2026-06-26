// src/app/api/shipping/zones/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerAuthUser } from "@/lib/serverAuth";

// GET - Listar zonas de envío del vendedor
export async function GET(req) {
  try {
    const authUser = await getServerAuthUser(req);
    if (!authUser?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { email: authUser.email },
      include: { stores: true },
    });

    if (!user?.stores?.length) {
      return NextResponse.json({ zones: [] });
    }

    const storeIds = user.stores.map((s) => s.id);

    const zones = await prisma.shippingZone.findMany({
      where: { storeId: { in: storeIds } },
      include: { store: { select: { id: true, name: true } } },
      orderBy: [{ department: "asc" }, { province: "asc" }],
    });

    return NextResponse.json({ zones });
  } catch (err) {
    console.error("ERROR GET seller shipping zones:", err);
    return NextResponse.json({ error: "Error obteniendo zonas" }, { status: 500 });
  }
}

// POST - Crear zona de envío
export async function POST(req) {
  try {
    const authUser = await getServerAuthUser(req);
    if (!authUser?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { storeId, name, department, province, cost, estimatedDays } = body;

    if (!storeId) return NextResponse.json({ error: "storeId requerido" }, { status: 400 });
    if (!name?.trim()) return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
    if (!department?.trim()) return NextResponse.json({ error: "Departamento requerido" }, { status: 400 });
    if (cost === undefined || cost === null || Number(cost) < 0) {
      return NextResponse.json({ error: "Costo inválido" }, { status: 400 });
    }

    // Verificar que la tienda pertenece al vendedor
    const user = await prisma.user.findUnique({
      where: { email: authUser.email },
      include: { stores: true },
    });

    const storeIds = (user?.stores || []).map((s) => s.id);
    if (!storeIds.includes(storeId)) {
      return NextResponse.json({ error: "No autorizado para esta tienda" }, { status: 403 });
    }

    // Verificar que no exista una zona igual
    const existing = await prisma.shippingZone.findFirst({
      where: {
        storeId,
        department: department.trim(),
        province: province?.trim() || null,
      },
    });

    if (existing) {
      return NextResponse.json({ error: "Ya existe una zona para esta ubicación" }, { status: 400 });
    }

    const zone = await prisma.shippingZone.create({
      data: {
        storeId,
        name: name.trim(),
        department: department.trim(),
        province: province?.trim() || null,
        cost: Number(cost),
        estimatedDays: Number(estimatedDays) || 3,
      },
    });

    return NextResponse.json({ zone }, { status: 201 });
  } catch (err) {
    console.error("ERROR POST shipping zone:", err);
    return NextResponse.json({ error: "Error creando zona" }, { status: 500 });
  }
}

// DELETE - Eliminar zona de envío
export async function DELETE(req) {
  try {
    const authUser = await getServerAuthUser(req);
    if (!authUser?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const zoneId = searchParams.get("id");

    if (!zoneId) return NextResponse.json({ error: "id requerido" }, { status: 400 });

    const zone = await prisma.shippingZone.findUnique({
      where: { id: zoneId },
      include: { store: { select: { userId: true } } },
    });

    if (!zone) return NextResponse.json({ error: "Zona no encontrada" }, { status: 404 });

    if (zone.store.userId !== authUser.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    await prisma.shippingZone.delete({ where: { id: zoneId } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("ERROR DELETE shipping zone:", err);
    return NextResponse.json({ error: "Error eliminando zona" }, { status: 500 });
  }
}

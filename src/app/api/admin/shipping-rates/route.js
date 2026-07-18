import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerAuthUser } from "@/lib/serverAuth";

function isAdmin(user) {
  return user?.role === "admin" || user?.role === "ADMIN";
}

// GET - List all shipping rates (admin only)
export async function GET(req) {
  try {
    const user = await getServerAuthUser(req);
    if (!user?.id || !isAdmin(user)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const rates = await prisma.shippingRate.findMany({
      orderBy: [{ department: "asc" }, { province: "asc" }],
    });

    return NextResponse.json({ rates });
  } catch (err) {
    console.error("GET /api/admin/shipping-rates error:", err);
    return NextResponse.json({ error: "Error obteniendo tarifas" }, { status: 500 });
  }
}

// POST - Create or update shipping rate
export async function POST(req) {
  try {
    const user = await getServerAuthUser(req);
    if (!user?.id || !isAdmin(user)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await req.json();
    const {
      originCity = "Trujillo",
      department,
      province,
      rateType = "fixed",
      baseCost = 0,
      costPerKg = 0,
      costPerPackage = 0,
      minCost = 0,
      estimatedDays = 3,
      isActive = true,
    } = body;

    if (!department || !province) {
      return NextResponse.json({ error: "Departamento y provincia son requeridos" }, { status: 400 });
    }

    if (!["fixed", "per_kg", "per_package"].includes(rateType)) {
      return NextResponse.json({ error: "rateType inválido. Usa: fixed, per_kg, per_package" }, { status: 400 });
    }

    const rate = await prisma.shippingRate.upsert({
      where: {
        originCity_department_province: {
          originCity,
          department,
          province,
        },
      },
      update: {
        rateType,
        baseCost: Number(baseCost),
        costPerKg: Number(costPerKg),
        costPerPackage: Number(costPerPackage),
        minCost: Number(minCost),
        estimatedDays: Number(estimatedDays),
        isActive: Boolean(isActive),
      },
      create: {
        originCity,
        department,
        province,
        rateType,
        baseCost: Number(baseCost),
        costPerKg: Number(costPerKg),
        costPerPackage: Number(costPerPackage),
        minCost: Number(minCost),
        estimatedDays: Number(estimatedDays),
        isActive: Boolean(isActive),
      },
    });

    return NextResponse.json({ rate });
  } catch (err) {
    console.error("POST /api/admin/shipping-rates error:", err);
    return NextResponse.json({ error: "Error guardando tarifa" }, { status: 500 });
  }
}

// DELETE - Remove a shipping rate
export async function DELETE(req) {
  try {
    const user = await getServerAuthUser(req);
    if (!user?.id || !isAdmin(user)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id requerido" }, { status: 400 });
    }

    await prisma.shippingRate.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/admin/shipping-rates error:", err);
    return NextResponse.json({ error: "Error eliminando tarifa" }, { status: 500 });
  }
}

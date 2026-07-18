import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const TRUJILLO_DEPT = "La Libertad";

// POST - Calculate shipping cost
export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { storeId, department, province, weight = 0, quantity = 1 } = body;

    if (!department) {
      return NextResponse.json({ error: "department requerido" }, { status: 400 });
    }

    // Same city = free shipping
    if (department === TRUJILLO_DEPT && (!province || province === "Trujillo")) {
      return NextResponse.json({
        shippingCost: 0,
        estimatedDays: 1,
        zoneName: "Trujillo",
        isLocal: true,
        message: "Envío gratis en Trujillo",
      });
    }

    // Try to find a shipping rate for this destination
    const rate = await prisma.shippingRate.findFirst({
      where: {
        department,
        isActive: true,
        OR: [
          { province: province || null },
          { province: null },
        ],
      },
      orderBy: [{ province: "desc" }, { createdAt: "desc" }],
    });

    if (!rate) {
      // No rate configured → buyer pays at destination
      return NextResponse.json({
        shippingCost: 0,
        estimatedDays: null,
        zoneName: null,
        isLocal: false,
        payAtDestination: true,
        message: "El costo será asumido por el comprador al retirar el producto en la agencia de envío.",
      });
    }

    // Calculate cost based on rate type
    let totalCost = 0;
    const kg = Number(weight) || 1;
    const qty = Number(quantity) || 1;

    switch (rate.rateType) {
      case "per_kg":
        totalCost = rate.baseCost + (kg * rate.costPerKg);
        if (rate.minCost > 0 && totalCost < rate.minCost) {
          totalCost = rate.minCost;
        }
        break;
      case "per_package":
        totalCost = rate.costPerPackage * qty;
        break;
      case "fixed":
      default:
        totalCost = rate.baseCost;
        break;
    }

    return NextResponse.json({
      shippingCost: Math.round(totalCost * 100) / 100,
      estimatedDays: rate.estimatedDays,
      zoneName: `${rate.department} - ${rate.province}`,
      rateType: rate.rateType,
      isLocal: false,
      payAtDestination: false,
    });
  } catch (err) {
    console.error("ERROR calculate shipping:", err);
    return NextResponse.json({ error: "Error calculando envío" }, { status: 500 });
  }
}

// GET - List shipping rates for a store (public, fallback to zones)
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get("storeId");

    if (!storeId) {
      // Return all active rates (public view)
      const rates = await prisma.shippingRate.findMany({
        where: { isActive: true },
        orderBy: [{ department: "asc" }, { province: "asc" }],
      });
      return NextResponse.json({ rates });
    }

    const zones = await prisma.shippingZone.findMany({
      where: { storeId, isActive: true },
      orderBy: [{ department: "asc" }, { province: "asc" }],
    });

    return NextResponse.json({ zones });
  } catch (err) {
    console.error("ERROR GET shipping:", err);
    return NextResponse.json({ error: "Error obteniendo envíos" }, { status: 500 });
  }
}

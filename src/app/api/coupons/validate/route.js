import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req) {
  try {
    const { code, subtotal } = await req.json();

    if (!code) {
      return NextResponse.json({ error: "Código de cupón requerido" }, { status: 400 });
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase().trim() },
    });

    if (!coupon) {
      return NextResponse.json({ error: "Cupón no encontrado" }, { status: 404 });
    }

    if (!coupon.active) {
      return NextResponse.json({ error: "Cupón desactivado" }, { status: 400 });
    }

    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return NextResponse.json({ error: "Cupón expirado" }, { status: 400 });
    }

    if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json({ error: "Cupón agotado" }, { status: 400 });
    }

    if (subtotal && subtotal < coupon.minPurchase) {
      return NextResponse.json({
        error: `Compra mínima: S/ ${coupon.minPurchase.toFixed(2)}`,
      }, { status: 400 });
    }

    let discount = 0;
    if (coupon.discountType === "percentage") {
      discount = (subtotal || 0) * (coupon.discountValue / 100);
    } else {
      discount = coupon.discountValue;
    }

    return NextResponse.json({
      ok: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discount: Math.min(discount, subtotal || Infinity),
      },
    });
  } catch (error) {
    console.error("Coupon validation error:", error);
    return NextResponse.json({ error: "Error validating coupon" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req) {
  try {
    const { code, subtotal } = await req.json();

    if (!code) {
      return NextResponse.json({ error: "Codigo de cupon requerido" }, { status: 400 });
    }

    const normalizedCode = code.toUpperCase().trim();

    // 1. Check if it's a spin wheel code (SPIN-XXXXX)
    if (normalizedCode.startsWith("SPIN-")) {
      const spinPrize = await prisma.spinWheelPrize.findFirst({
        where: { code: normalizedCode },
      });

      if (!spinPrize) {
        return NextResponse.json({ error: "Codigo de ruleta no encontrado" }, { status: 404 });
      }

      if (spinPrize.used) {
        return NextResponse.json({ error: "Este codigo ya fue utilizado" }, { status: 400 });
      }

      if (spinPrize.expiresAt && new Date(spinPrize.expiresAt) < new Date()) {
        return NextResponse.json({ error: "Codigo de ruleta expirado" }, { status: 400 });
      }

      if (spinPrize.prizeType === "no_prize") {
        return NextResponse.json({ error: "Este codigo no tiene descuento" }, { status: 400 });
      }

      let discount = 0;
      let discountType = "";
      let discountValue = spinPrize.prizeValue;

      if (spinPrize.prizeType === "percentage_discount") {
        discountType = "percentage";
        discount = (subtotal || 0) * (spinPrize.prizeValue / 100);
      } else if (spinPrize.prizeType === "fixed_discount") {
        discountType = "fixed";
        discount = spinPrize.prizeValue;
      } else if (spinPrize.prizeType === "free_shipping") {
        discountType = "shipping";
        discount = 0;
      }

      return NextResponse.json({
        ok: true,
        coupon: {
          id: spinPrize.id,
          code: spinPrize.code,
          discountType,
          discountValue,
          discount: Math.min(discount, subtotal || Infinity),
          isSpinCode: true,
        },
      });
    }

    // 2. Check regular coupons
    const coupon = await prisma.coupon.findUnique({
      where: { code: normalizedCode },
    });

    if (!coupon) {
      return NextResponse.json({ error: "Cupon no encontrado" }, { status: 404 });
    }

    if (!coupon.active) {
      return NextResponse.json({ error: "Cupon desactivado" }, { status: 400 });
    }

    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return NextResponse.json({ error: "Cupon expirado" }, { status: 400 });
    }

    if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json({ error: "Cupon agotado" }, { status: 400 });
    }

    if (subtotal && subtotal < coupon.minPurchase) {
      return NextResponse.json({
        error: `Compra minima: S/ ${coupon.minPurchase.toFixed(2)}`,
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

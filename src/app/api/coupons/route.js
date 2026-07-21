import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerAuthUser } from "@/lib/serverAuth";

export async function GET() {
  try {
    const user = await getServerAuthUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ coupons });
  } catch (error) {
    console.error("GET coupons error:", error);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = await getServerAuthUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code, discountType, discountValue, minPurchase, maxUses, expiresAt, active } = await req.json();

    if (!code || !discountValue) {
      return NextResponse.json({ error: "Código y valor requeridos" }, { status: 400 });
    }

    const existing = await prisma.coupon.findUnique({ where: { code: code.toUpperCase().trim() } });
    if (existing) {
      return NextResponse.json({ error: "Ya existe un cupón con ese código" }, { status: 400 });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase().trim(),
        discountType: discountType || "percentage",
        discountValue: Number(discountValue),
        minPurchase: Number(minPurchase) || 0,
        maxUses: Number(maxUses) || 0,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        active: active !== false,
      },
    });

    return NextResponse.json({ ok: true, coupon });
  } catch (error) {
    console.error("POST coupon error:", error);
    return NextResponse.json({ error: "Error creating coupon" }, { status: 500 });
  }
}

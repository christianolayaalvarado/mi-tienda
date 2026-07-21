import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerAuthUser } from "@/lib/serverAuth";

export async function PUT(req, { params }) {
  try {
    const user = await getServerAuthUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();

    const coupon = await prisma.coupon.update({
      where: { id },
      data: {
        ...(body.active !== undefined && { active: body.active }),
        ...(body.discountValue !== undefined && { discountValue: Number(body.discountValue) }),
        ...(body.maxUses !== undefined && { maxUses: Number(body.maxUses) }),
        ...(body.expiresAt !== undefined && { expiresAt: body.expiresAt ? new Date(body.expiresAt) : null }),
      },
    });

    return NextResponse.json({ ok: true, coupon });
  } catch (error) {
    console.error("PUT coupon error:", error);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const user = await getServerAuthUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    await prisma.coupon.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE coupon error:", error);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

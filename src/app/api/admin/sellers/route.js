import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerAuthUser } from "@/lib/serverAuth";

export async function GET(req) {
  try {
    const user = await getServerAuthUser(req);
    if (!user || (user.role !== "admin" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const sellers = await prisma.user.findMany({
      where: {
        stores: { some: {} },
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        city: true,
        isVerified: true,
        sellerCode: true,
        createdAt: true,
        stores: { select: { id: true, name: true, code: true } },
        products: { select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const result = sellers.map((s) => ({
      ...s,
      productCount: s.products.length,
      storeCount: s.stores.length,
    }));

    return NextResponse.json({ sellers: result });
  } catch (err) {
    console.error("GET admin sellers error:", err);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const user = await getServerAuthUser(req);
    if (!user || (user.role !== "admin" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { sellerId, isVerified } = await req.json();
    if (!sellerId || typeof isVerified !== "boolean") {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: sellerId },
      data: { isVerified },
      select: { id: true, name: true, isVerified: true },
    });

    return NextResponse.json({ seller: updated });
  } catch (err) {
    console.error("PUT admin sellers error:", err);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

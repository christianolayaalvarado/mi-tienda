import { NextResponse } from "next/server";
import { getAuthUserFromCookie } from "@/lib/authFromCookie";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const now = new Date();
    const sales = await prisma.flashSale.findMany({
      where: {
        status: "active",
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: { startDate: "desc" },
      take: 5,
    });

    let products = [];
    if (sales.length > 0) {
      const allIds = [...new Set(sales.flatMap(s => s.productIds))];
      if (allIds.length > 0) {
        products = await prisma.product.findMany({
          where: { id: { in: allIds }, deletedAt: null, flashSaleAllowed: true },
          include: { category: true, store: true },
        });
      }
    }

    return NextResponse.json({ sales, products });
  } catch {
    return NextResponse.json({ sales: [], products: [] });
  }
}

export async function POST(req) {
  const user = await getAuthUserFromCookie();
  if (!user?.email) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { email: user.email }, select: { id: true, role: true } });
  if (!dbUser || dbUser.role !== "admin") return NextResponse.json({ error: "Solo admin" }, { status: 403 });

  const body = await req.json();
  const { title, description, discountPct, startDate, endDate, productIds, categoryId, minPrice, maxPrice } = body;

  if (!title || !discountPct || !startDate || !endDate) {
    return NextResponse.json({ error: "Datos requeridos" }, { status: 400 });
  }

  const sale = await prisma.flashSale.create({
    data: {
      title,
      description: description || null,
      discountPct: Math.min(90, Math.max(10, discountPct)),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      productIds: productIds || [],
      categoryId: categoryId || null,
      minPrice: minPrice || null,
      maxPrice: maxPrice || null,
      status: new Date(startDate) <= new Date() ? "active" : "scheduled",
      createdBy: dbUser.id,
    },
  });

  return NextResponse.json({ success: true, sale });
}

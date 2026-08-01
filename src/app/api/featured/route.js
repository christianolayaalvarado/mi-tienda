import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const featured = await prisma.featuredProduct.findMany({
      where: { status: "active", endDate: { gte: new Date() } },
      include: { product: { include: { category: true, store: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return NextResponse.json({ featured: featured.map(f => f.product).filter(Boolean) });
  } catch {
    return NextResponse.json({ featured: [] });
  }
}

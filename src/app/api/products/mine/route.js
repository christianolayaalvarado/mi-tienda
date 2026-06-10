// app/api/products/mine/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const url = new URL(req.url);
    const search = (url.searchParams.get("search") || "").trim();
    const categoryId = url.searchParams.get("categoryId") || "";
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const limit = Math.max(1, parseInt(url.searchParams.get("limit") || "12", 10));

    const take = limit;
    const skip = (page - 1) * take;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const where = {
      userId: user.id,
      ...(search ? { title: { contains: search, mode: "insensitive" } } : {}),
      ...(categoryId ? { categoryId } : {}),
    };

    const total = await prisma.product.count({ where });

    const products = await prisma.product.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        price: true,
        stock: true,
        images: true,
        userId: true,           // <-- asegurar que llegue el userId
        storeId: true,          // <-- asegurar que llegue el storeId
        createdAt: true,
        category: { select: { id: true, name: true } },
        store: { select: { id: true, name: true, code: true } },
      },
    });

    return NextResponse.json({
      products,
      totalPages: Math.max(1, Math.ceil(total / take)),
      currentPage: page,
    });
  } catch (error) {
    console.error("GET /api/products/mine error:", error);
    return NextResponse.json(
      { error: "Error al obtener productos", detail: error?.message ?? null },
      { status: 500 }
    );
  }
}

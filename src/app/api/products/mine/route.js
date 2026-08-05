// app/api/products/mine/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUserFromCookie } from "@/lib/authFromCookie";

export async function GET(req) {
  try {
    const authUser = await getAuthUserFromCookie();
    if (!authUser?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const url = new URL(req.url);
    const search = (url.searchParams.get("search") || "").trim();
    const categoryId = url.searchParams.get("categoryId") || "";
    const stockFilter = url.searchParams.get("stock") || "";
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const limit = Math.max(1, parseInt(url.searchParams.get("limit") || "12", 10));

    const take = limit;
    const skip = (page - 1) * take;

    const user = await prisma.user.findUnique({
      where: { email: authUser.email },
    });
    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const where = {
      userId: user.id,
      ...(search ? { title: { contains: search, mode: "insensitive" } } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(stockFilter === "out" ? { stock: 0 } : {}),
      ...(stockFilter === "available" ? { stock: { gt: 0 } } : {}),
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

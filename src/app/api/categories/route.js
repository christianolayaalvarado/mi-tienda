// app/api/categories/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: "asc" }, // ✅ opcional: orden alfabético
    });

    // Eliminar duplicados por id (por si hubo pruebas anteriores)
    const uniqueCategories = Array.from(
      new Map(categories.map((cat) => [cat.id, cat])).values()
    );

    return NextResponse.json(uniqueCategories, { status: 200 });
  } catch (error) {
    console.error("GET /api/categories error:", error);
    return NextResponse.json(
      { error: "Error al obtener categorías", detail: error?.message || null },
      { status: 500 }
    );
  }
}

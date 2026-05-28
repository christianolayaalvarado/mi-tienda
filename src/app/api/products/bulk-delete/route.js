import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function DELETE(req) {
  try {
    // 🔐 Validar sesión
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // 📦 Leer body
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Body inválido" }, { status: 400 });
    }

    const { ids } = body;

    // 🔍 Validar IDs
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "IDs inválidos" }, { status: 400 });
    }

    // 🔥 Eliminar productos del usuario autenticado
    const result = await prisma.product.deleteMany({
      where: {
        id: { in: ids },
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Productos eliminados correctamente",
      count: result.count,
    });

  } catch (error) {
    console.error("🔥 ERROR BULK DELETE PRODUCTS:", error);
    return NextResponse.json(
      { error: "Error eliminando productos", detail: error.message },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerAuthUser } from "@/lib/serverAuth";

export async function DELETE(req) {
  try {
    const session = await getServerAuthUser(req);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Body inválido" }, { status: 400 });
    }

    const { ids } = body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "IDs inválidos" }, { status: 400 });
    }

    const userId = session.id;
    const isAdmin = session.role === "admin" || session.role === "ADMIN";

    const where = isAdmin
      ? { id: { in: ids } }
      : {
          id: { in: ids },
          OR: [
            { userId: userId },
            { store: { userId: userId } },
          ],
        };

    const result = await prisma.product.deleteMany({ where });

    return NextResponse.json({
      success: true,
      message: "Productos eliminados correctamente",
      count: result.count,
    });

  } catch (error) {
    console.error("BULK DELETE PRODUCTS error:", error);
    return NextResponse.json(
      { error: "Error eliminando productos", detail: error.message },
      { status: 500 }
    );
  }
}

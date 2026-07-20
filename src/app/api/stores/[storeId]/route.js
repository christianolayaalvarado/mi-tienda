import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req, { params }) {
  try {
    const { storeId } = await params;
    if (!storeId) {
      return NextResponse.json({ error: "storeId requerido" }, { status: 400 });
    }

    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { id: true, name: true, userId: true },
    });

    if (!store) {
      return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });
    }

    return NextResponse.json({ store });
  } catch (error) {
    console.error("Error fetching store:", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}

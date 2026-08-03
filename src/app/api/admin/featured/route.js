import { NextResponse } from "next/server";
import { getAuthUserFromCookie } from "@/lib/authFromCookie";
import prisma from "@/lib/prisma";

export async function GET() {
  const user = await getAuthUserFromCookie();
  if (!user?.email) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { email: user.email }, select: { id: true, role: true } });
  if (!dbUser || (dbUser.role !== "admin" && user.email !== "admin@demo.com")) {
    return NextResponse.json({ error: "Solo admin" }, { status: 403 });
  }

  try {
    const featured = await prisma.featuredProduct.findMany({
      include: {
        product: { select: { id: true, title: true, price: true, images: true } },
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ featured });
  } catch {
    return NextResponse.json({ featured: [] });
  }
}

export async function PUT(req) {
  const user = await getAuthUserFromCookie();
  if (!user?.email) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { email: user.email }, select: { id: true, role: true } });
  if (!dbUser || (dbUser.role !== "admin" && user.email !== "admin@demo.com")) {
    return NextResponse.json({ error: "Solo admin" }, { status: 403 });
  }

  const { id, action } = await req.json();
  if (!id || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  try {
    if (action === "approve") {
      const featured = await prisma.featuredProduct.findUnique({ where: { id } });
      if (!featured) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

      await prisma.featuredProduct.update({
        where: { id },
        data: { status: "active" },
      });
      return NextResponse.json({ ok: true, message: "Destacado aprobado" });
    } else {
      await prisma.featuredProduct.delete({ where: { id } });
      return NextResponse.json({ ok: true, message: "Destacado rechazado y eliminado" });
    }
  } catch (e) {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

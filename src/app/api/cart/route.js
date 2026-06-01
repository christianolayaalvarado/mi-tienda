// app/api/cart/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Usar findFirst porque userId no es necessarily unique en el modelo
    const cart = await prisma.cart.findFirst({
      where: { userId: session.user.id },
      include: { items: true },
    });

    // Si no existe, devolver carrito vacío (frontend lo interpreta)
    if (!cart) {
      return NextResponse.json({ cart: null });
    }

    return NextResponse.json({ cart });
  } catch (err) {
    console.error("🔥 ERROR GET CART:", err?.message || err, err?.stack);
    return NextResponse.json({ error: "Error obteniendo carrito" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Payload inválido" }, { status: 400 });

    const { items } = body;
    if (!Array.isArray(items)) return NextResponse.json({ error: "Items inválidos" }, { status: 400 });

    // Buscar carrito existente o crear uno nuevo
    let cart = await prisma.cart.findFirst({ where: { userId: session.user.id }, include: { items: true } });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: session.user.id, items: { create: items.map(i => ({ productId: i.productId, quantity: i.quantity })) } },
        include: { items: true },
      });
    } else {
      // Ejemplo simple: reemplazar items (ajusta según tu lógica)
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
      const createdItems = await prisma.cartItem.createMany({
        data: items.map(i => ({ cartId: cart.id, productId: i.productId, quantity: i.quantity })),
      });
      cart = await prisma.cart.findUnique({ where: { id: cart.id }, include: { items: true } });
    }

    return NextResponse.json({ cart });
  } catch (err) {
    console.error("🔥 ERROR POST CART:", err?.message || err, err?.stack);
    return NextResponse.json({ error: "Error actualizando carrito" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const cart = await prisma.cart.findFirst({ where: { userId: session.user.id } });
    if (!cart) return NextResponse.json({ success: true });

    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    await prisma.cart.delete({ where: { id: cart.id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("🔥 ERROR DELETE CART:", err?.message || err, err?.stack);
    return NextResponse.json({ error: "Error eliminando carrito" }, { status: 500 });
  }
}

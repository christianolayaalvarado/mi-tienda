// app/api/cart/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

async function resolveUserIdFromSession(session) {
  if (!session) return null;
  if (session.user?.id) return session.user.id;
  if (session.user?.email) {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    return user?.id ?? null;
  }
  return null;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = await resolveUserIdFromSession(session);
    if (!userId) {
      return NextResponse.json({ cart: { items: [] } });
    }

    const cart = await prisma.cart.findFirst({
      where: { userId },
      include: { items: true },
    });

    if (!cart) return NextResponse.json({ cart: { items: [] } });

    return NextResponse.json({ cart });
  } catch (err) {
    console.error("🔥 ERROR GET CART:", err?.message || err);
    return NextResponse.json({ error: "Error obteniendo carrito" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const userId =
      session.user?.id ??
      (session.user?.email ? (await prisma.user.findUnique({ where: { email: session.user.email } }))?.id : null);

    if (!userId) return NextResponse.json({ error: "Usuario no identificado" }, { status: 400 });

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Payload inválido" }, { status: 400 });

    const { items } = body;
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Items inválidos" }, { status: 400 });
    }

    const invalid = items.find((it) => !it || !it.productId || typeof it.quantity !== "number");
    if (invalid) {
      return NextResponse.json({ error: "Algún item tiene campos faltantes (productId, quantity)" }, { status: 400 });
    }

    let cart = await prisma.cart.findFirst({ where: { userId }, include: { items: true } });

    const enriched = [];
    for (const it of items) {
      const product = await prisma.product.findUnique({ where: { id: it.productId } });
      if (!product) {
        return NextResponse.json({ error: `Producto no encontrado: ${it.productId}` }, { status: 400 });
      }

      enriched.push({
        productId: it.productId,
        quantity: Number(it.quantity) || 1,
        title: product.title || product.name || "Sin título",
        price: typeof it.price !== "undefined" ? Number(it.price) : Number(product.price || 0),
        storeId: product.storeId || it.storeId || null,
        image: (product.images && product.images[0]) || product.image || "/images/placeholder.png",
      });
    }

    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          userId,
          items: {
            create: enriched.map((e) => ({
              productId: e.productId,
              quantity: e.quantity,
              title: e.title,
              price: e.price,
              storeId: e.storeId,
              image: e.image,
            })),
          },
        },
        include: { items: true },
      });
    } else {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

      try {
        await prisma.cartItem.createMany({
          data: enriched.map((e) => ({
            cartId: cart.id,
            productId: e.productId,
            quantity: e.quantity,
            title: e.title,
            price: e.price,
            storeId: e.storeId,
            image: e.image,
          })),
        });
      } catch (e) {
        for (const e of enriched) {
          await prisma.cartItem.create({
            data: {
              cartId: cart.id,
              productId: e.productId,
              quantity: e.quantity,
              title: e.title,
              price: e.price,
              storeId: e.storeId,
              image: e.image,
            },
          });
        }
      }

      cart = await prisma.cart.findUnique({ where: { id: cart.id }, include: { items: true } });
    }

    return NextResponse.json({ cart });
  } catch (err) {
    console.error("🔥 ERROR POST CART:", err?.message || err);
    return NextResponse.json({ error: "Error actualizando carrito" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const userId =
      session.user?.id ??
      (session.user?.email ? (await prisma.user.findUnique({ where: { email: session.user.email } }))?.id : null);

    if (!userId) return NextResponse.json({ success: true });

    const cart = await prisma.cart.findFirst({ where: { userId } });
    if (!cart) return NextResponse.json({ success: true });

    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    await prisma.cart.delete({ where: { id: cart.id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("🔥 ERROR DELETE CART:", err?.message || err);
    return NextResponse.json({ error: "Error eliminando carrito" }, { status: 500 });
  }
}

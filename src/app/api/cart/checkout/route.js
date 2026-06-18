// src/app/api/cart/checkout/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import prisma from "@/lib/prisma";

/**
 * POST /api/cart/checkout
 * Create an order and clear the cart in a transaction
 */
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "auth_required" }, { status: 401 });
    }
    const userId = String(session.user.id);

    const cart = await prisma.cart.findFirst({
      where: { userId },
      include: { items: { include: { product: true } } },
    });

    if (!cart || !cart.items || cart.items.length === 0) {
      return NextResponse.json({ error: "cart_empty" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const total = cart.items.reduce(
        (s, it) => s + (Number(it.price ?? it.product?.price ?? 0) * Number(it.quantity || 0)),
        0
      );

      const order = await tx.order.create({
        data: {
          userId,
          total,
          status: "pending",
        },
      });

      const orderItemsData = cart.items.map((it) => ({
        orderId: order.id,
        productId: it.productId,
        quantity: it.quantity,
        price: it.price ?? it.product?.price ?? 0,
        title: it.title ?? it.product?.title ?? null,
      }));

      if (orderItemsData.length > 0) {
        await tx.orderItem.createMany({ data: orderItemsData });
      }

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return { orderId: order.id };
    });

    return NextResponse.json({ success: true, orderId: result.orderId });
  } catch (err) {
    console.error("[API CART CHECKOUT] error:", err);
    return NextResponse.json(
      { error: "internal_error", message: String(err) },
      { status: 500 }
    );
  }
}

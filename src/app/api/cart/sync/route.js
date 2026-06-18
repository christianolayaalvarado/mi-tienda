// src/app/api/cart/sync/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import prisma from "@/lib/prisma";

/**
 * POST /api/cart/sync
 * Replace server cart with provided items (used to sync local -> server)
 */
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "auth_required" }, { status: 401 });
    }
    const userId = String(session.user.id);
    const body = await req.json().catch(() => ({}));
    const items = Array.isArray(body.items) ? body.items : [];

    const normalized = items
      .map((it) => ({
        productId: it.productId ?? it.id ?? null,
        quantity: Number(it.quantity || 0),
        storeId: it.storeId ?? null,
        price:
          typeof it.price !== "undefined" && it.price !== null
            ? Number(it.price)
            : undefined,
        title: it.title ?? undefined,
        image: it.image ?? undefined,
      }))
      .filter(
        (it) =>
          it.productId != null &&
          it.productId !== "" &&
          Number.isFinite(it.quantity) &&
          it.quantity > 0
      );

    let cart = await prisma.cart.findFirst({ where: { userId } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId } });
    }

    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

    const productIds = [...new Set(normalized.map((i) => i.productId))];
    const products =
      productIds.length > 0
        ? await prisma.product.findMany({ where: { id: { in: productIds } } })
        : [];
    const prodMap = Object.fromEntries(products.map((p) => [String(p.id), p]));

    const createData = normalized.map((it) => {
      const prod = prodMap[String(it.productId)];
      const priceToSave =
        typeof it.price !== "undefined" ? it.price : prod?.price ?? 0;
      return {
        cartId: cart.id,
        productId: it.productId,
        quantity: it.quantity,
        storeId: it.storeId ?? null,
        price: priceToSave,
        title: prod?.title ?? it.title ?? "",
        image: prod?.image ?? it.image ?? "",
      };
    });

    console.log("[API CART SYNC] createData:", JSON.stringify(createData, null, 2));

    if (createData.length > 0) {
      // skipDuplicates removed for Mongo
      await prisma.cartItem.createMany({ data: createData });
      // Alternative: create one-by-one to handle duplicates gracefully
      // for (const row of createData) {
      //   await prisma.cartItem.create({ data: row }).catch(e => console.warn("create item error", e));
      // }
    }

    const updated = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: { items: { include: { product: true } } },
    });

    const enrichedItems = (updated.items || []).map((it) => ({
      id: it.id,
      productId: it.productId,
      storeId: it.storeId,
      name: it.title ?? it.product?.title ?? "",
      price:
        typeof it.price !== "undefined" && it.price !== null
          ? Number(it.price)
          : it.product?.price
            ? Number(it.product.price)
            : 0,
      quantity: Number(it.quantity || 0),
      image: it.image ?? it.product?.image ?? "",
      product: it.product ?? null,
      createdAt: it.createdAt,
    }));

    return NextResponse.json({ cart: { ...updated, items: enrichedItems } });
  } catch (err) {
    console.error("[API CART SYNC] error:", err);
    return NextResponse.json(
      { error: "internal_error", message: String(err) },
      { status: 500 }
    );
  }
}

// src/app/api/cart/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import prisma from "@/lib/prisma";

/**
 * GET /api/cart
 */
export async function GET(req) {
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

    if (!cart) {
      return NextResponse.json({ cart: { items: [] } });
    }

    const enrichedItems = (cart.items || []).map((it) => ({
      id: it.id,
      productId: it.productId,
      storeId: it.storeId,
      title: it.title ?? it.product?.title ?? "",
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

    const enrichedCart = { ...cart, items: enrichedItems };

    console.log(
      "[API CART GET] enrichedCart:",
      JSON.stringify({ userId, itemsCount: enrichedItems.length }, null, 2)
    );

    return NextResponse.json({ cart: enrichedCart });
  } catch (err) {
    console.error("[API CART GET] error:", err);
    return NextResponse.json(
      { error: "internal_error", message: String(err) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cart
 * Replace/create items for the user's cart
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

    // Remove previous items (replace behavior)
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

    // Fetch products to enrich fallback values
    const productIds = [...new Set(normalized.map((i) => i.productId))];
    const products =
      productIds.length > 0
        ? await prisma.product.findMany({ where: { id: { in: productIds } } })
        : [];
    const prodMap = Object.fromEntries(products.map((p) => [String(p.id), p]));

    const createManyData = normalized.map((it) => {
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

    // Debug: log createManyData shape (remove after debugging)
    console.log("[API CART POST] createManyData:", JSON.stringify(createManyData, null, 2));

    if (createManyData.length > 0) {
      // NOTE: skipDuplicates removed because Mongo connector doesn't support it
      await prisma.cartItem.createMany({ data: createManyData });
      // If you need to avoid duplicates on Mongo, consider creating items one-by-one:
      // for (const row of createManyData) {
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
      title: it.title ?? it.product?.title ?? "",
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
    console.error("[API CART POST] error:", err);
    return NextResponse.json(
      { error: "internal_error", message: String(err) },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cart
 */
export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "auth_required" }, { status: 401 });
    }
    const userId = String(session.user.id);

    const cart = await prisma.cart.findFirst({ where: { userId } });
    if (!cart) {
      return NextResponse.json({ success: true, cart: null });
    }

    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

    return NextResponse.json({ success: true, cart: { items: [] } });
  } catch (err) {
    console.error("[API CART DELETE] error:", err);
    return NextResponse.json(
      { error: "internal_error", message: String(err) },
      { status: 500 }
    );
  }
}

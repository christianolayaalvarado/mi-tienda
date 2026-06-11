// app/api/cart/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

/**
 * Helper: extraer userId desde session de forma consistente.
 */
async function resolveUserIdFromSession(session) {
  if (!session) return null;
  if (session.user?.id) return session.user.id;
  if (session.user?.email) {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    return user?.id ?? null;
  }
  return null;
}

/**
 * Helper: logging para 401 (útil en Vercel)
 */
function logUnauthorized(req, note = "") {
  try {
    const forwarded = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const ua = req.headers.get("user-agent") || "unknown";
    const referer = req.headers.get("referer") || "unknown";
    console.warn(`[API CART] 401 unauth - ${note} - ip:${forwarded} ua:${ua} referer:${referer} ts:${new Date().toISOString()}`);
  } catch (e) {
    console.warn("[API CART] 401 unauth (logging failed)", e);
  }
}

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      logUnauthorized(req, "GET no session");
      return NextResponse.json({ error: "auth_required" }, { status: 401 });
    }

    const userId = await resolveUserIdFromSession(session);
    if (!userId) {
      // Usuario no identificado: devolver carrito vacío (no 401 para UX)
      return NextResponse.json({ cart: { items: [] } }, { status: 200 });
    }

    const cart = await prisma.cart.findFirst({
      where: { userId },
      include: { items: true },
    });

    if (!cart) return NextResponse.json({ cart: { items: [] } }, { status: 200 });

    return NextResponse.json({ cart }, { status: 200 });
  } catch (err) {
    console.error("🔥 ERROR GET CART:", err?.message || err);
    return NextResponse.json({ error: "server_error", details: "Error obteniendo carrito" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      logUnauthorized(req, "POST no session");
      return NextResponse.json({ error: "auth_required" }, { status: 401 });
    }

    const userId = await resolveUserIdFromSession(session);
    if (!userId) {
      return NextResponse.json({ error: "bad_request", details: "Usuario no identificado" }, { status: 400 });
    }

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "bad_request", details: "Payload inválido" }, { status: 400 });

    const { items } = body;
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "bad_request", details: "Items inválidos" }, { status: 400 });
    }

    // Validar cada item mínimamente
    const invalid = items.find((it) => !it || !it.productId || typeof it.quantity !== "number");
    if (invalid) {
      return NextResponse.json({ error: "bad_request", details: "Algún item tiene campos faltantes (productId, quantity)" }, { status: 400 });
    }

    // Enriquecer items con datos del producto (defensivo)
    const enriched = [];
    for (const it of items) {
      const product = await prisma.product.findUnique({ where: { id: it.productId } });
      if (!product) {
        return NextResponse.json({ error: "bad_request", details: `Producto no encontrado: ${it.productId}` }, { status: 400 });
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

    // Buscar o crear carrito
    let cart = await prisma.cart.findFirst({ where: { userId }, include: { items: true } });

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
      // Reemplazar items (simplificar lógica: deleteMany + createMany con fallback)
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
        // Fallback a create individual si createMany falla
        for (const item of enriched) {
          await prisma.cartItem.create({
            data: {
              cartId: cart.id,
              productId: item.productId,
              quantity: item.quantity,
              title: item.title,
              price: item.price,
              storeId: item.storeId,
              image: item.image,
            },
          });
        }
      }

      cart = await prisma.cart.findUnique({ where: { id: cart.id }, include: { items: true } });
    }

    return NextResponse.json({ cart }, { status: 200 });
  } catch (err) {
    console.error("🔥 ERROR POST CART:", err?.message || err);
    return NextResponse.json({ error: "server_error", details: "Error actualizando carrito" }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      logUnauthorized(req, "DELETE no session");
      return NextResponse.json({ error: "auth_required" }, { status: 401 });
    }

    const userId = await resolveUserIdFromSession(session);
    if (!userId) return NextResponse.json({ success: true }, { status: 200 });

    const cart = await prisma.cart.findFirst({ where: { userId } });
    if (!cart) return NextResponse.json({ success: true }, { status: 200 });

    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    await prisma.cart.delete({ where: { id: cart.id } });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("🔥 ERROR DELETE CART:", err?.message || err);
    return NextResponse.json({ error: "server_error", details: "Error eliminando carrito" }, { status: 500 });
  }
}

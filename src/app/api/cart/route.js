import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

// ---------------- GET ----------------
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return Response.json({ items: [] });

    let cart = await prisma.cart.findFirst({
      where: { userId: session.user.id },
      include: { items: true },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: session.user.id },
        include: { items: true },
      });
    }

    // ✅ incluir el campo id de cada CartItem
    const items = cart.items.map((item) => ({
      id: item.id,              // 🔑 ahora disponible en frontend
      productId: item.productId,
      quantity: item.quantity,
      title: item.title,
      price: item.price,
      image: item.image,
    }));

    return Response.json({ items });
  } catch (error) {
    console.error("GET CART ERROR:", error);
    return Response.json({ error: "Error obteniendo carrito" }, { status: 500 });
  }
}

// ---------------- POST (SINCRONIZAR CARRITO COMPLETO) ----------------
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return Response.json({ error: "No autorizado" }, { status: 401 });

    const { items } = await req.json();

    if (!Array.isArray(items)) {
      return Response.json({ error: "Formato inválido" }, { status: 400 });
    }

    let cart = await prisma.cart.findFirst({
      where: { userId: session.user.id },
      include: { items: true },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: session.user.id },
        include: { items: true },
      });
    }

    // 🔴 IMPORTANTE: eliminar items actuales
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    // 🔴 recrear carrito con lo que viene del frontend
    for (const item of items) {
      if (!item.productId || !item.title) continue;

      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: item.productId,
          title: item.title,
          price: Number(item.price) || 0,
          image: item.image || "/images/placeholder.png",
          quantity: Number(item.quantity) || 1,
        },
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("POST CART ERROR:", error);
    return Response.json({ error: "Error sincronizando carrito" }, { status: 500 });
  }
}

// ---------------- PATCH (ACTUALIZAR CANTIDAD) ----------------
export async function PATCH(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return Response.json({ error: "No autorizado" }, { status: 401 });

    const { productId, quantity } = await req.json();

    if (!productId) {
      return Response.json({ error: "productId requerido" }, { status: 400 });
    }

    const cart = await prisma.cart.findFirst({
      where: { userId: session.user.id },
    });

    if (!cart) {
      return Response.json({ error: "Carrito no encontrado" }, { status: 404 });
    }

    if (quantity <= 0) {
      // eliminar item si cantidad es 0
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id, productId },
      });
    } else {
      await prisma.cartItem.updateMany({
        where: { cartId: cart.id, productId },
        data: { quantity },
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("PATCH CART ERROR:", error);
    return Response.json({ error: "Error actualizando carrito" }, { status: 500 });
  }
}

// ---------------- DELETE (ELIMINAR ITEM) ----------------
export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return Response.json({ error: "No autorizado" }, { status: 401 });

    const { productId } = await req.json();

    const cart = await prisma.cart.findFirst({
      where: { userId: session.user.id },
    });

    if (!cart) {
      return Response.json({ error: "Carrito no encontrado" }, { status: 404 });
    }

    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id, productId },
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("DELETE CART ERROR:", error);
    return Response.json({ error: "Error eliminando producto" }, { status: 500 });
  }
}

// ---------------- PUT (CHECKOUT) ----------------
export async function PUT() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return Response.json({ error: "No autorizado" }, { status: 401 });

    const cart = await prisma.cart.findFirst({
      where: { userId: session.user.id },
      include: { items: true },
    });

    if (!cart) {
      return Response.json({ error: "Carrito no encontrado" }, { status: 404 });
    }

    // ✅ AQUÍ SÍ se descuenta el stock (solo en checkout)
    for (const item of cart.items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product || product.stock < item.quantity) {
        return Response.json(
          { error: `Stock insuficiente para ${item.title}` },
          { status: 400 }
        );
      }

      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: { decrement: item.quantity },
        },
      });
    }

    // limpiar carrito después de comprar
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("CHECKOUT ERROR:", error);
    return Response.json({ error: "Error en checkout" }, { status: 500 });
  }
}
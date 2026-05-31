import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

// 🔹 Helper para validar ObjectId de Mongo
const isValidObjectId = (id) => /^[a-f\d]{24}$/i.test(id);

// ==============================
// 🔹 OBTENER CARRITO
// ==============================
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
      include: { items: true },
    });

    // Normalizar respuesta: siempre devolver { items: [] } cuando no hay carrito
    if (!cart) {
      return NextResponse.json({ items: [] });
    }

    return NextResponse.json(cart);
  } catch (err) {
    console.error("🔥 ERROR GET CART:", err);
    return NextResponse.json({ error: "Error obteniendo carrito" }, { status: 500 });
  }
}

// ==============================
// 🔹 AGREGAR PRODUCTO AL CARRITO
// ==============================
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { productId, title, price, image, quantity = 1, storeId } = body;

    if (!isValidObjectId(productId) || !isValidObjectId(storeId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    // Buscar carrito del usuario
    let cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
      include: { items: true },
    });

    // Si no existe carrito, crearlo con el primer item
    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          userId: session.user.id,
          items: {
            create: {
              productId,
              storeId,
              title,
              price: Number(price) || 0,
              image: image || "/images/placeholder.png",
              quantity: Number(quantity) || 1,
            },
          },
        },
        include: { items: true },
      });

      return NextResponse.json(cart);
    }

    // Si el carrito existe, verificar si ya hay un item con ese productId
    const existingItem = cart.items.find((it) => String(it.productId) === String(productId));

    if (existingItem) {
      // Actualizar cantidad (sumar)
      const newQty = Number(existingItem.quantity || 0) + Number(quantity || 1);
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQty },
      });
    } else {
      // Crear nuevo item en el carrito existente
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          storeId,
          title,
          price: Number(price) || 0,
          image: image || "/images/placeholder.png",
          quantity: Number(quantity) || 1,
        },
      });
    }

    // Devolver carrito actualizado
    const updatedCart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
      include: { items: true },
    });

    return NextResponse.json(updatedCart);
  } catch (err) {
    console.error("🔥 ERROR POST CART:", err);
    return NextResponse.json({ error: "Error agregando producto al carrito" }, { status: 500 });
  }
}

// ==============================
// 🔹 ACTUALIZAR CANTIDAD
// ==============================
export async function PATCH(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { productId, quantity } = body;

    if (!isValidObjectId(productId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
      include: { items: true },
    });

    // Si no hay carrito, devolver success (sin error) para que el cliente no rompa
    if (!cart) {
      return NextResponse.json({ success: true });
    }

    const item = cart.items.find((it) => String(it.productId) === String(productId));
    if (!item) {
      // Nada que actualizar
      return NextResponse.json({ success: true });
    }

    const updated = await prisma.cartItem.update({
      where: { id: item.id },
      data: { quantity: Number(quantity) || 1 },
    });

    return NextResponse.json({ success: true, updated });
  } catch (err) {
    console.error("🔥 ERROR PATCH CART:", err);
    return NextResponse.json({ error: "Error actualizando cantidad" }, { status: 500 });
  }
}

// ==============================
// 🔹 ELIMINAR PRODUCTO DEL CARRITO
// ==============================
export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { productId } = body;

    if (!isValidObjectId(productId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
      include: { items: true },
    });

    // Si no hay carrito, devolver success para evitar 404/500 en cliente
    if (!cart) {
      return NextResponse.json({ success: true });
    }

    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id, productId },
    });

    // Devolver carrito actualizado (opcional)
    const updatedCart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
      include: { items: true },
    });

    return NextResponse.json({ success: true, cart: updatedCart });
  } catch (err) {
    console.error("🔥 ERROR DELETE CART:", err);
    return NextResponse.json({ error: "Error eliminando producto" }, { status: 500 });
  }
}

// ==============================
// 🔹 LIMPIAR CARRITO
// ==============================
export async function PUT() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
    });

    // Si no hay carrito, devolver success (no es un error)
    if (!cart) {
      return NextResponse.json({ success: true });
    }

    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("🔥 ERROR CLEAR CART:", err);
    return NextResponse.json({ error: "Error limpiando carrito" }, { status: 500 });
  }
}

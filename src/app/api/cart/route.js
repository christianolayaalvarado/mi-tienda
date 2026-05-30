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

    if (!cart) {
      return NextResponse.json({ items: [] });
    }

    return NextResponse.json(cart);
  } catch (err) {
    console.error("🔥 ERROR GET CART:", err.message, err.stack);
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
    const { productId, title, price, image, quantity, storeId } = body;

    if (!isValidObjectId(productId) || !isValidObjectId(storeId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const cart = await prisma.cart.upsert({
      where: { userId: session.user.id },
      update: {
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
      create: {
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
  } catch (err) {
    console.error("🔥 ERROR POST CART:", err.message, err.stack);
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
    });

    if (!cart) {
      return NextResponse.json({ error: "Carrito no encontrado" }, { status: 404 });
    }

    const updated = await prisma.cartItem.updateMany({
      where: { cartId: cart.id, productId },
      data: { quantity: Number(quantity) || 1 },
    });

    return NextResponse.json({ success: true, updated });
  } catch (err) {
    console.error("🔥 ERROR PATCH CART:", err.message, err.stack);
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
    });

    if (!cart) {
      return NextResponse.json({ error: "Carrito no encontrado" }, { status: 404 });
    }

    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id, productId },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("🔥 ERROR DELETE CART:", err.message, err.stack);
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

    if (!cart) {
      return NextResponse.json({ error: "Carrito no encontrado" }, { status: 404 });
    }

    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("🔥 ERROR CLEAR CART:", err.message, err.stack);
    return NextResponse.json({ error: "Error limpiando carrito" }, { status: 500 });
  }
}

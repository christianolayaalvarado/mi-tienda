import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

// ==============================
// 🔹 GET - ÓRDENES DEL USUARIO
// ==============================
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get("page")) || 1;
    const limit = 10;

    const skip = (page - 1) * limit;

    // 🔥 SOLO FILTRO NECESARIO (simplificado)
    const where = {
      userId: session.user.id,
    };

    // 🔥 CONSULTA OPTIMIZADA (NO TRAER TODO)
    const orders = await prisma.order.findMany({
      where,
      select: {
        id: true,
        total: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    const totalOrders = await prisma.order.count({ where });

    return NextResponse.json({
      orders,
      totalPages: Math.ceil(totalOrders / limit),
      currentPage: page,
    });

  } catch (error) {
    console.error("Error GET /api/orders:", error);

    return NextResponse.json(
      { error: "Error interno" },
      { status: 500 }
    );
  }
}

// ==============================
// 🔥 POST - CHECKOUT MULTI-TIENDA
// ==============================
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { items } = body;

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "Carrito vacío" },
        { status: 400 }
      );
    }

    // 🔥 Usuario
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // 🔹 Agrupar por tienda
    const groupedByStore = items.reduce((acc, item) => {
      const storeId = item.storeId;

      if (!storeId) return acc;

      if (!acc[storeId]) acc[storeId] = [];

      acc[storeId].push(item);
      return acc;
    }, {});

    // 🔹 Total
    const total = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // 🔹 Crear orden principal
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        total,
      },
    });

    // 🔥 Sub-órdenes
    for (const storeId in groupedByStore) {
      const storeItems = groupedByStore[storeId];

      const orderItem = await prisma.orderItem.create({
        data: {
          orderId: order.id,
          storeId,
        },
      });

      for (const item of storeItems) {
        await prisma.orderItemProduct.create({
          data: {
            orderItemId: orderItem.id,
            productId: item.productId,
            quantity: Number(item.quantity),
            price: Number(item.price),
          },
        });

        // 🔻 actualizar stock
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: Number(item.quantity),
            },
          },
        });
      }
    }

    // 🧹 limpiar carrito
    await prisma.cartItem.deleteMany({
      where: {
        cart: {
          userId: user.id,
        },
      },
    });

    return NextResponse.json(
      {
        message: "Compra realizada con éxito",
        orderId: order.id,
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Error POST /api/orders:", error);

    return NextResponse.json(
      { error: "Error procesando la orden" },
      { status: 500 }
    );
  }
}
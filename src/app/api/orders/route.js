import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

// 🔹 validar ObjectId
const isValidObjectId = (id) => /^[a-f\d]{24}$/i.test(id);

// ==============================
// 🔹 CREAR ORDEN
// ==============================
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { items, customer, paymentMethod } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Carrito vacío" }, { status: 400 });
    }

    // 🔹 Validar IDs de cada item
    for (const item of items) {
      if (!isValidObjectId(item.productId) || !isValidObjectId(item.storeId)) {
        return NextResponse.json({ error: "ID inválido en item" }, { status: 400 });
      }
    }

    // 🔹 Calcular total
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // 🔹 Crear orden principal
    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        total,
        paymentStatus: "unpaid",
        status: "pending",
        paymentMethod: paymentMethod || "manual",
        customerName: customer?.name || session.user.name || "",
        customerEmail: customer?.email || session.user.email || "",
        customerPhone: customer?.phone || "",
        customerAddress: customer?.address || "",
        orderItems: {
          create: items.map((item) => ({
            storeId: item.storeId,
            paymentStatus: "unpaid",
            items: {
              create: {
                productId: item.productId,
                quantity: item.quantity,
                price: item.price,
              },
            },
          })),
        },
      },
    });

    return NextResponse.json({ success: true, orderId: order.id });
  } catch (err) {
    console.error("🔥 ERROR CREATE ORDER:", err.message, err.stack);
    return NextResponse.json({ error: "Error creando orden" }, { status: 500 });
  }
}

// ==============================
// 🔹 LISTAR ÓRDENES DEL USUARIO
// ==============================
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      where: { userId: session.user.id },
      include: {
        orderItems: {
          include: {
            store: true,
            items: { include: { product: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(orders);
  } catch (err) {
    console.error("🔥 ERROR GET ORDERS:", err.message, err.stack);
    return NextResponse.json({ error: "Error obteniendo órdenes" }, { status: 500 });
  }
}

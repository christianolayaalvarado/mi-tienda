import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { sendPaymentConfirmedEmail } from "@/lib/email";

// 🔹 validar ObjectId (Mongo)
const isValidObjectId = (id) => {
  return /^[a-f\d]{24}$/i.test(id);
};

export async function POST(req, context) {
  try {
    // ✅ FIX REAL Next 15 (sin destructuring directo)
    const contextData = await context;
    const orderId = contextData?.params?.id;

    // 🔥 Validación ID
    if (!orderId || !isValidObjectId(orderId)) {
      return NextResponse.json(
        { error: "ID inválido" },
        { status: 400 }
      );
    }

    // 🔐 sesión
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // 🔍 buscar orden
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: {
            store: true, // ⚠️ importante: aquí está userId del vendedor
          },
        },
        user: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Orden no encontrada" },
        { status: 404 }
      );
    }

    // 🔥 SEGURIDAD
    const isOwner = order.userId === session.user.id;

    const isSeller = order.orderItems.some(
      (item) => item.store?.userId === session.user.id
    );

    if (!isOwner && !isSeller) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 403 }
      );
    }

    // 🔥 evitar reprocesar pagos
    if (order.paymentStatus === "paid") {
      return NextResponse.json({
        success: true,
        message: "La orden ya estaba pagada",
      });
    }

    // 🔥 ACTUALIZAR ORDEN PRINCIPAL
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: "paid",
        status: "completed",
        paidAt: new Date(),
      },
    });

    // 🔥 ACTUALIZAR SUB-ÓRDENES
    await prisma.orderItem.updateMany({
      where: { orderId },
      data: {
        paymentStatus: "paid",
      },
    });

    // 🔥 obtener orden completa con owner correcto
    const fullOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        orderItems: {
          include: {
            store: {
              include: {
                user: true, // ✅ CORRECCIÓN IMPORTANTE (no "owner")
              },
            },
          },
        },
      },
    });

    // 📩 email cliente
    if (fullOrder?.user?.email) {
      await sendPaymentConfirmedEmail({
        to: fullOrder.user.email,
        orderId,
      });
    }

    // 🏪 emails vendedores (sin duplicados)
    const notifiedEmails = new Set();

    for (const item of fullOrder.orderItems) {
      const sellerEmail = item.store?.user?.email;

      if (sellerEmail && !notifiedEmails.has(sellerEmail)) {
        notifiedEmails.add(sellerEmail);

        await sendPaymentConfirmedEmail({
          to: sellerEmail,
          orderId,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Pago confirmado correctamente",
    });

  } catch (error) {
    console.error("🔥 ERROR CONFIRM PAYMENT:", error);

    return NextResponse.json(
      { error: "Error confirmando pago" },
      { status: 500 }
    );
  }
}
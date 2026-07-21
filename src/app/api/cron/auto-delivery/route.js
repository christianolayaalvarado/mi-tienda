import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/cron/auto-delivery — can be called by Vercel Cron or externally
export async function GET(req) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Find shipped orders older than 7 days that are paid
    const shippedOrders = await prisma.order.findMany({
      where: {
        status: "shipped",
        paymentStatus: "paid",
        updatedAt: { lte: sevenDaysAgo },
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        orderItems: true,
      },
    });

    if (shippedOrders.length === 0) {
      return NextResponse.json({ message: "No orders to auto-confirm", count: 0 });
    }

    const results = [];

    for (const order of shippedOrders) {
      try {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: "delivered",
            deliveredAt: new Date(),
          },
        });

        // Record in history
        await prisma.orderHistory.create({
          data: {
            orderId: order.id,
            action: "auto_delivered",
            byUserId: "system",
            note: "Entrega automática confirmada después de 7 días de envío",
          },
        }).catch(() => {});

        // Send review request email
        if (order.user?.email) {
          try {
            const { sendReviewRequestEmail } = await import("@/lib/email");
            await sendReviewRequestEmail({
              to: order.user.email,
              buyerName: order.user.name,
              orderId: order.id,
              orderNumber: order.orderNumber,
            });
          } catch (e) {
            console.warn(`Error sending review email for order ${order.id}:`, e?.message);
          }
        }

        results.push({ orderId: order.id, status: "delivered" });
      } catch (err) {
        console.error(`Error auto-delivering order ${order.id}:`, err?.message);
        results.push({ orderId: order.id, status: "error", error: err?.message });
      }
    }

    return NextResponse.json({
      message: `Auto-delivered ${results.filter((r) => r.status === "delivered").length} orders`,
      count: results.length,
      results,
    });
  } catch (err) {
    console.error("Auto-delivery cron error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

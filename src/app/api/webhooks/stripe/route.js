import { NextResponse } from "next/server";
import Stripe from "stripe";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-11-15",
});

export async function POST(req) {
  const body = await req.text(); // ⚠️ IMPORTANTE: raw body
  const signature = req.headers.get("stripe-signature");

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("❌ Error verificando webhook:", err.message);
    return NextResponse.json({ error: "Webhook inválido" }, { status: 400 });
  }

  try {
    // ✅ Pago completado
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      const orderItemId = session.metadata?.orderItemId;

      if (orderItemId) {
        // 🔹 Marcar sub-orden como pagada
        await prisma.orderItem.update({
          where: { id: parseInt(orderItemId) },
          data: { paymentStatus: "paid" },
        });

        console.log(`✅ OrderItem ${orderItemId} pagado`);
      }
    }

    // ❌ Pago fallido
    if (event.type === "payment_intent.payment_failed") {
      const paymentIntent = event.data.object;

      const orderItemId = paymentIntent.metadata?.orderItemId;

      if (orderItemId) {
        await prisma.orderItem.update({
          where: { id: parseInt(orderItemId) },
          data: { paymentStatus: "unpaid" },
        });

        console.log(`⚠️ OrderItem ${orderItemId} fallo de pago`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("❌ Error procesando webhook:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
} 
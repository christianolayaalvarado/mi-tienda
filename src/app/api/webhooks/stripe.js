// /api/webhooks/stripe.js
import { buffer } from "micro";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

export const config = {
  api: {
    bodyParser: false, // Necesario para Stripe webhooks
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-11-15",
});

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end("Method Not Allowed");

  const buf = await buffer(req);
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(buf.toString(), sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Manejar los eventos que nos interesan
  switch (event.type) {
    case "payment_link.completed":
      const paymentLink = event.data.object;
      const orderItemId = paymentLink.metadata.orderItemId;

      // Actualizar el estado de pago de la sub-orden a 'paid'
      try {
        await prisma.orderItem.update({
          where: { id: orderItemId },
          data: { paymentStatus: "paid" },
        });
        console.log(`OrderItem ${orderItemId} marcado como pagado.`);
      } catch (err) {
        console.error("Error actualizando OrderItem:", err);
      }
      break;

    case "payment_intent.payment_failed":
      const failedPaymentIntent = event.data.object;
      const failedOrderItemId = failedPaymentIntent.metadata?.orderItemId;
      if (failedOrderItemId) {
        try {
          await prisma.orderItem.update({
            where: { id: failedOrderItemId },
            data: { paymentStatus: "unpaid" },
          });
          console.log(`OrderItem ${failedOrderItemId} marcado como unpaid.`);
        } catch (err) {
          console.error("Error actualizando OrderItem tras fallo de pago:", err);
        }
      }
      break;

    default:
      console.log(`Evento de Stripe no manejado: ${event.type}`);
  }

  res.json({ received: true });
}
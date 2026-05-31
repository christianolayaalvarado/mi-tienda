/**
 * Script de reparación heurístico
 * - Reasigna OrderItem.orderId a la Order más probable si detecta mismatch.
 * - Requiere MONGODB_URI en env vars y acceso a la colección Order y OrderItem.
 *
 * USO:
 *   node scripts/repair-orderitems.js
 *
 * ADVERTENCIA:
 *   Haz backup de la base de datos antes de ejecutar. Este script aplica heurística
 *   basada en ventana de tiempo y storeId; revisa los cambios manualmente.
 */

import { MongoClient, ObjectId } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("Define MONGODB_URI en las env vars antes de ejecutar.");
  process.exit(1);
}

async function run() {
  const client = new MongoClient(MONGODB_URI, { useUnifiedTopology: true });
  await client.connect();
  const db = client.db(); // ajusta si usas otro nombre
  const ordersCol = db.collection("Order");
  const orderItemsCol = db.collection("OrderItem");

  // ventana en ms (ej. 2 minutos)
  const WINDOW_MS = 2 * 60 * 1000;

  const ordersCursor = ordersCol.find({});
  while (await ordersCursor.hasNext()) {
    const order = await ordersCursor.next();
    if (!order || !order.createdAt) continue;

    const start = new Date(order.createdAt.getTime() - WINDOW_MS);
    const end = new Date(order.createdAt.getTime() + WINDOW_MS);

    // buscar orderItems del mismo store en la ventana
    const candidates = await orderItemsCol.find({
      storeId: order.storeId,
      createdAt: { $gte: start, $lte: end },
    }).toArray();

    for (const oi of candidates) {
      // si el orderItem no apunta a esta orden, reasignar
      if (!oi.orderId || String(oi.orderId) !== String(order._id)) {
        console.log(`Reassigning orderItem ${oi._id} -> order ${order._id}`);
        await orderItemsCol.updateOne({ _id: oi._id }, { $set: { orderId: order._id } });
      }
    }
  }

  await client.close();
  console.log("Repair script finished.");
}

run().catch((err) => {
  console.error("Repair script error:", err);
  process.exit(1);
});

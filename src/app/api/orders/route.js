// app/api/orders/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

const groupByStore = (items) => {
  const map = new Map();
  for (const it of items) {
    const storeId = String(it.storeId || "");
    if (!map.has(storeId)) map.set(storeId, []);
    map.get(storeId).push(it);
  }
  return Array.from(map.entries()).map(([storeId, items]) => ({ storeId, items }));
};

const formatDatePart = (n) => String(n).padStart(2, "0");

// ==============================
// GET /api/orders
// ==============================
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const orders = await prisma.order.findMany({
      where: { userId: session.user.id },
      include: {
        orderItems: {
          include: {
            store: true,
            items: { include: { product: true } },
          },
        },
        paymentMethod: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ orders });
  } catch (err) {
    console.error("GET /api/orders error:", err);
    return NextResponse.json({ error: "Error obteniendo órdenes" }, { status: 500 });
  }
}

// ==============================
// POST /api/orders
// ==============================
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await req.json();
    const { items, customer = {}, total: clientTotal = 0, paymentMethodId } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "No hay items en la orden" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { stores: true },
    });
    if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 400 });

    const userId = user.id;

    // --- Recuperar precios y stock oficiales desde DB ---
    const productIds = Array.from(new Set(items.map((it) => String(it.productId))));
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, price: true, stock: true },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    // Normalizar items y calcular precios en centavos
    const itemsNormalized = items.map((it) => {
      const pid = String(it.productId);
      const product = productMap.get(pid);
      const unitPrice = product ? Number(product.price) : Number(it.price || 0);
      const quantity = Number(it.quantity) || 1;
      return {
        productId: pid,
        quantity,
        unitPrice,
        priceInCents: Math.round((Number(unitPrice) || 0) * 100),
        // conservar storeId si viene del cliente (si no, se puede inferir luego)
        storeId: it.storeId ?? null,
      };
    });

    // Verificar existencia de productos
    const missing = itemsNormalized.filter((it) => !productMap.has(it.productId));
    if (missing.length > 0) {
      return NextResponse.json({ error: "Algunos productos no existen" }, { status: 400 });
    }

    // Verificar stock suficiente
    const outOfStock = itemsNormalized.filter((it) => {
      const product = productMap.get(it.productId);
      return product.stock < it.quantity;
    });
    if (outOfStock.length > 0) {
      return NextResponse.json(
        { error: "Stock insuficiente para algunos productos", details: outOfStock.map((o) => o.productId) },
        { status: 409 }
      );
    }

    // Calcular serverTotal en centavos y comparar con clientTotal
    const serverTotalCents = itemsNormalized.reduce((s, it) => s + it.priceInCents * it.quantity, 0);
    const clientTotalCents = Math.round((Number(clientTotal) || 0) * 100);

    const TOLERANCE_CENTS = 1; // tolerancia mínima

    if (Math.abs(serverTotalCents - clientTotalCents) > TOLERANCE_CENTS) {
      console.warn("Total mismatch", { serverTotalCents, clientTotalCents });
      return NextResponse.json(
        { error: "Total mismatch", serverTotal: serverTotalCents / 100, clientTotal: clientTotalCents / 100 },
        { status: 400 }
      );
    }

    // Agrupar por tienda usando la estructura de itemsNormalized (mantener storeId si existe)
    const groups = groupByStore(
      itemsNormalized.map((it) => ({
        ...it,
        price: it.unitPrice,
      }))
    );

    // Crear orden dentro de transacción y decrementar stock
    const createdOrder = await prisma.$transaction(async (tx) => {
      const now = new Date();
      const y = now.getFullYear();
      const m = formatDatePart(now.getMonth() + 1);
      const d = formatDatePart(now.getDate());
      const prefix = `ORD-${y}${m}${d}`;

      const startOfDay = new Date(Date.UTC(y, now.getMonth(), now.getDate(), 0, 0, 0));
      const endOfDay = new Date(Date.UTC(y, now.getMonth(), now.getDate(), 23, 59, 59, 999));

      const countToday = await tx.order.count({
        where: { createdAt: { gte: startOfDay, lt: endOfDay } },
      });

      const seq = String(countToday + 1).padStart(4, "0");
      const orderNumber = `${prefix}-${seq}`;

      // Elegir método de pago
      let chosenPaymentMethod = null;
      if (paymentMethodId) {
        chosenPaymentMethod = await tx.paymentMethod.findUnique({ where: { id: paymentMethodId } });
      } else {
        chosenPaymentMethod = await tx.paymentMethod.findFirst({
          where: { userId: userId, isPrimary: true },
        });
      }

      // Crear la orden con total calculado (en unidades monetarias)
      const order = await tx.order.create({
        data: {
          userId,
          orderNumber,
          total: serverTotalCents / 100,
          status: "pending",
          paymentStatus: "unpaid",
          paymentMethodId: chosenPaymentMethod ? chosenPaymentMethod.id : null,
          customerName: customer.name || session.user.name || "",
          customerEmail: customer.email || session.user.email || "",
          customerPhone: customer.phone || "",
          customerAddress: customer.address || "",
          orderItems: {
            create: groups.map((g) => ({
              storeId: g.storeId,
              paymentStatus: "unpaid",
              items: {
                create: g.items.map((it) => ({
                  productId: it.productId,
                  quantity: Number(it.quantity) || 1,
                  price: Number(it.unitPrice) || 0,
                })),
              },
            })),
          },
        },
        include: {
          orderItems: { include: { items: true } },
          paymentMethod: true,
        },
      });

      // Decrementar stock
      for (const it of itemsNormalized) {
        await tx.product.update({
          where: { id: it.productId },
          data: { stock: { decrement: it.quantity } },
        });
      }

      return order;
    });

    return NextResponse.json(createdOrder, {
      status: 201,
      headers: { Location: `/api/orders/${createdOrder.id}` },
    });
  } catch (err) {
    console.error("POST /api/orders error:", err);
    return NextResponse.json({ error: "Error creando orden" }, { status: 500 });
  }
}

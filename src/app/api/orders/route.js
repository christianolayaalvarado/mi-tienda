// src/app/api/orders/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerAuthUser } from "@/lib/serverAuth";
import { sendOrderCreatedEmail, sendOrderNotificationToSeller } from "@/lib/email";
import { validateCsrf } from "@/lib/csrf";

const isValidObjectId = (value) => /^[a-f\d]{24}$/i.test(String(value || ""));

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
    const authUser = await getServerAuthUser(req);
    if (!authUser?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const orders = await prisma.order.findMany({
      where: { userId: authUser.id },
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
    const csrfErr = validateCsrf(req);
    if (csrfErr) return csrfErr;

    const authUser = await getServerAuthUser(req);
    if (!authUser?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await req.json();
    const { items, customer = {}, total: clientTotal = 0, paymentMethodId, clientOrderId, shipping = {} } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "No hay items en la orden" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: authUser.email },
      include: { stores: true },
    });
    if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 400 });

    const userId = user.id;

    // Idempotencia simple: si envían clientOrderId, devolver orden existente
    if (clientOrderId) {
      const existing = await prisma.order.findFirst({ where: { clientOrderId: clientOrderId } });
      if (existing) {
        return NextResponse.json({ order: existing }, { status: 200 });
      }
    }

    // --- Recuperar precios y stock oficiales desde DB ---
    const productIds = Array.from(new Set(items.map((it) => String(it.productId))));
    const invalidProductIds = productIds.filter((id) => !isValidObjectId(id));
    if (invalidProductIds.length > 0) {
      return NextResponse.json({ error: "Productos inválidos en el carrito", details: invalidProductIds }, { status: 400 });
    }

    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, price: true, stock: true, storeId: true, title: true },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    // Normalizar items y calcular precios en centavos
    const itemsNormalized = items.map((it) => {
      const pid = String(it.productId);
      const product = productMap.get(pid);
      const unitPrice = product ? Number(product.price) : Number(it.price || 0);
      const quantity = Number(it.quantity) || 1;
      const resolvedStoreId = product?.storeId ?? String(it.storeId || "");
      return {
        productId: pid,
        productName: product?.title || it.productName || "",
        quantity,
        unitPrice,
        priceInCents: Math.round((Number(unitPrice) || 0) * 100),
        storeId: resolvedStoreId,
      };
    });

    // Verificar existencia de productos
    const missing = itemsNormalized.filter((it) => !productMap.has(it.productId));
    if (missing.length > 0) {
      return NextResponse.json({ error: "Algunos productos no existen" }, { status: 400 });
    }

    const missingStoreIds = itemsNormalized.filter((it) => !it.storeId);
    if (missingStoreIds.length > 0) {
      return NextResponse.json({ error: "No se pudo determinar la tienda de algunos productos" }, { status: 400 });
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

      // startOfDay / endOfDay en zona UTC para consistencia
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
      const orderData = {
        userId,
        orderNumber,
        total: serverTotalCents / 100,
        status: "pending",
        paymentStatus: "unpaid",
        paymentMethodId: chosenPaymentMethod ? chosenPaymentMethod.id : null,
        customerName: customer.name || authUser.name || "",
        customerEmail: customer.email || authUser.email || "",
        customerPhone: customer.phone || "",
        customerAddress: customer.address || "",
        clientOrderId: clientOrderId || null,
        shippingCost: Number(shipping.cost) || 0,
        shippingAddress: shipping.address || null,
        shippingCity: shipping.city || null,
        shippingDepartment: shipping.department || null,
        shippingPostalCode: shipping.postalCode || null,
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
      };

      const order = await tx.order.create({
        data: orderData,
        include: {
          orderItems: {
            include: {
              items: { include: { product: true } },
              store: true,
            },
          },
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

    // Enviar correos (no bloquear la respuesta si fallan)
    try {
      // Enviar correo al comprador
      const buyerEmail = createdOrder.customerEmail || authUser.email;
      const buyerOrder = {
        id: createdOrder.id,
        orderNumber: createdOrder.orderNumber,
        total: createdOrder.total,
        currency: createdOrder.currency || "USD",
        items: createdOrder.orderItems.flatMap((oi) =>
          (oi.items || []).map((it) => ({
            productName: it.product?.name || "Producto",
            quantity: it.quantity,
            price: it.price,
          }))
        ),
        userName: createdOrder.customerName || authUser.name,
        userEmail: buyerEmail,
      };

      // Notificar comprador
      const buyerPromise = sendOrderCreatedEmail({ to: buyerEmail, order: buyerOrder }).catch((e) =>
        console.error("Error enviando email al comprador:", e)
      );

      // Preparar notificaciones a sellers por tienda
      const storeIds = Array.from(new Set(createdOrder.orderItems.map((oi) => String(oi.storeId))));
      const stores = await prisma.store.findMany({
        where: { id: { in: storeIds } },
        include: { owner: { select: { email: true, name: true, phone: true } } },
      });
      const storeMap = new Map(stores.map((s) => [String(s.id), s]));

      const sellerPromises = createdOrder.orderItems.map((oi) => {
        const store = storeMap.get(String(oi.storeId));
        const sellerEmail = store?.email || store?.owner?.email;
        const sellerPhone = store?.owner?.phone;
        const sellerOrder = {
          id: createdOrder.id,
          orderNumber: createdOrder.orderNumber,
          total: createdOrder.total,
          currency: createdOrder.currency || "USD",
          items: (oi.items || []).map((it) => ({
            productName: it.product?.name || "Producto",
            quantity: it.quantity,
            price: it.price,
          })),
          sellerName: store?.name || store?.owner?.name || "Vendedor",
          sellerEmail,
        };

        const promises = [];

        // Email notification
        if (sellerEmail) {
          promises.push(
            sendOrderNotificationToSeller({ to: sellerEmail, order: sellerOrder }).catch((e) =>
              console.error(`Error notificando seller por email (${sellerEmail}):`, e)
            )
          );
        }

        // WhatsApp notification (if seller has phone)
        if (sellerPhone) {
          const itemsList = sellerOrder.items
            .map((it) => `• ${it.productName} x${it.quantity} = S/ ${(it.price * it.quantity).toFixed(2)}`)
            .join("%0A");
          const waMessage = `🔔 *Nueva orden ${sellerOrder.orderNumber}*%0A%0A` +
            `Cliente: ${createdOrder.customerName || "N/A"}%0A` +
            `Total: S/ ${sellerOrder.total.toFixed(2)}%0A%0A` +
            `Productos:%0A${itemsList}%0A%0A` +
            `Ver detalles: ${process.env.NEXT_PUBLIC_APP_URL || "https://mi-tienda-app-theta.vercel.app"}/dashboard/seller/orders/${createdOrder.id}`;
          let cleanPhone = sellerPhone.replace(/[^0-9]/g, "");
          // Add Peru country code if missing
          if (cleanPhone.length === 9) cleanPhone = "51" + cleanPhone;
          const waUrl = `https://wa.me/${cleanPhone}?text=${waMessage}`;
          promises.push(
            fetch(waUrl, { method: "HEAD", redirect: "follow" }).catch(() => {})
          );
        }

        return Promise.allSettled(promises);
      });

      // Ejecutar envíos en paralelo y no bloquear la respuesta
      await Promise.allSettled([buyerPromise, ...sellerPromises]);
    } catch (emailErr) {
      console.error("Error en proceso de notificaciones de orden:", emailErr);
    }

    return NextResponse.json({ order: createdOrder }, {
      status: 201,
      headers: { Location: `/dashboard/orders/${createdOrder.id}` },
    });
  } catch (err) {
    console.error("POST /api/orders error:", err);
    return NextResponse.json({ error: "Error creando orden" }, { status: 500 });
  }
}

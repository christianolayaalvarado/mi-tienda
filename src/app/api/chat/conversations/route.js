// src/app/api/chat/conversations/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerAuthUser } from "@/lib/serverAuth";

// GET - Listar conversaciones del usuario
export async function GET(req) {
  try {
    const authUser = await getServerAuthUser(req);
    if (!authUser?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const userId = authUser.id;

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ buyerId: userId }, { sellerId: userId }],
      },
      include: {
        buyer: { select: { id: true, name: true, email: true } },
        seller: { select: { id: true, name: true, email: true } },
        product: { select: { id: true, title: true, images: true } },
      },
      orderBy: { lastMessageAt: "desc" },
    });

    // Contar mensajes no leídos por conversación
    const convIds = conversations.map((c) => c.id);
    const unreadCounts = await prisma.message.groupBy({
      by: ["conversationId"],
      where: {
        conversationId: { in: convIds },
        senderId: { not: userId },
        read: false,
      },
      _count: { id: true },
    });

    const unreadMap = {};
    unreadCounts.forEach((uc) => {
      unreadMap[uc.conversationId] = uc._count.id;
    });

    const result = conversations.map((c) => ({
      ...c,
      unreadCount: unreadMap[c.id] || 0,
      otherUser: c.buyerId === userId ? c.seller : c.buyer,
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error("ERROR GET conversations:", err);
    return NextResponse.json({ error: "Error obteniendo conversaciones" }, { status: 500 });
  }
}

// POST - Crear o obtener conversación existente
export async function POST(req) {
  try {
    const authUser = await getServerAuthUser(req);
    if (!authUser?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { sellerId, productId, orderId } = body;

    if (!sellerId) return NextResponse.json({ error: "sellerId requerido" }, { status: 400 });

    const buyerId = authUser.id;

    if (buyerId === sellerId) {
      return NextResponse.json({ error: "No puedes chatear contigo mismo" }, { status: 400 });
    }

    // Verificar si ya existe una conversación entre estos usuarios para este producto
    const existing = await prisma.conversation.findFirst({
      where: {
        buyerId,
        sellerId,
        productId: productId || null,
      },
    });

    if (existing) {
      return NextResponse.json({ conversation: existing });
    }

    const conversation = await prisma.conversation.create({
      data: {
        buyerId,
        sellerId,
        productId: productId || null,
        orderId: orderId || null,
      },
    });

    return NextResponse.json({ conversation }, { status: 201 });
  } catch (err) {
    console.error("ERROR POST conversation:", err);
    return NextResponse.json({ error: "Error creando conversación" }, { status: 500 });
  }
}

// src/app/api/chat/conversations/[id]/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerAuthUser } from "@/lib/serverAuth";

const isValidObjectId = (id) => typeof id === "string" && /^[a-f\d]{24}$/i.test(id);

// GET - Obtener conversación con mensajes
export async function GET(req, context) {
  try {
    const params = await context.params;
    const conversationId = params?.id;
    if (!conversationId || !isValidObjectId(conversationId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const authUser = await getServerAuthUser(req);
    if (!authUser?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        buyer: { select: { id: true, name: true, email: true } },
        seller: { select: { id: true, name: true, email: true } },
        product: { select: { id: true, title: true, images: true, price: true } },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversación no encontrada" }, { status: 404 });
    }

    // Verificar que el usuario sea parte de la conversación
    const userId = authUser.id;
    if (conversation.buyerId !== userId && conversation.sellerId !== userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Obtener mensajes
    const messages = await prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    // Marcar mensajes como leídos (los que no son del usuario actual)
    await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        read: false,
      },
      data: { read: true },
    });

    return NextResponse.json({ conversation, messages });
  } catch (err) {
    console.error("ERROR GET conversation:", err);
    return NextResponse.json({ error: "Error obteniendo conversación" }, { status: 500 });
  }
}

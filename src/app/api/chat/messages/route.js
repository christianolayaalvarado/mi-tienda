// src/app/api/chat/messages/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerAuthUser } from "@/lib/serverAuth";
import { validateCsrf } from "@/lib/csrf";

// POST - Enviar mensaje
export async function POST(req) {
  try {
    const csrfErr = validateCsrf(req);
    if (csrfErr) return csrfErr;

    const authUser = await getServerAuthUser(req);
    if (!authUser?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { conversationId, text } = body;

    if (!conversationId) return NextResponse.json({ error: "conversationId requerido" }, { status: 400 });
    if (!text || !text.trim()) return NextResponse.json({ error: "Texto del mensaje requerido" }, { status: 400 });

    const userId = authUser.id;

    // Verificar que la conversación existe y el usuario es parte
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversación no encontrada" }, { status: 404 });
    }

    if (conversation.buyerId !== userId && conversation.sellerId !== userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Crear mensaje y actualizar conversación
    const [message] = await prisma.$transaction([
      prisma.message.create({
        data: {
          conversationId,
          senderId: userId,
          text: text.trim(),
        },
        include: {
          sender: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.conversation.update({
        where: { id: conversationId },
        data: {
          lastMessage: text.trim(),
          lastMessageAt: new Date(),
        },
      }),
    ]);

    return NextResponse.json({ message }, { status: 201 });
  } catch (err) {
    console.error("ERROR POST message:", err);
    return NextResponse.json({ error: "Error enviando mensaje" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerAuthUser } from "@/lib/serverAuth";

// POST /api/spin-wheel/mark-used — mark a spin prize code as used
export async function POST(req) {
  try {
    const user = await getServerAuthUser(req);
    if (!user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { prizeId } = await req.json();

    if (!prizeId) {
      return NextResponse.json({ error: "prizeId requerido" }, { status: 400 });
    }

    // Only mark if it belongs to this user and is not already used
    const prize = await prisma.spinWheelPrize.findFirst({
      where: { id: prizeId, userId: user.id, used: false },
    });

    if (!prize) {
      return NextResponse.json({ error: "Premio no encontrado o ya usado" }, { status: 404 });
    }

    await prisma.spinWheelPrize.update({
      where: { id: prizeId },
      data: { used: true },
    });

    return NextResponse.json({ ok: true, message: "Codigo marcado como usado" });
  } catch (err) {
    console.error("POST spin-wheel/mark-used error:", err);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

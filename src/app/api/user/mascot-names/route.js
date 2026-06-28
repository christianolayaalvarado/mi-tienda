import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerAuthUser } from "@/lib/serverAuth";

export async function GET(req) {
  try {
    const user = await getServerAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { mascotNames: true },
    });

    return NextResponse.json({ names: dbUser?.mascotNames || {} });
  } catch (error) {
    console.error("Error fetching mascot names:", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const user = await getServerAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { mascotId, name } = await req.json();

    if (!mascotId || typeof name !== "string") {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    const trimmed = name.trim().slice(0, 30);

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { mascotNames: true },
    });

    const currentNames = dbUser?.mascotNames && typeof dbUser.mascotNames === "object"
      ? dbUser.mascotNames
      : {};

    const updatedNames = { ...currentNames, [mascotId]: trimmed };

    await prisma.user.update({
      where: { id: user.id },
      data: { mascotNames: updatedNames },
    });

    return NextResponse.json({ names: updatedNames });
  } catch (error) {
    console.error("Error updating mascot names:", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}

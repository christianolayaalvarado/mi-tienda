import { NextResponse } from "next/server";
import { getAuthUserFromCookie } from "@/lib/authFromCookie";
import prisma from "@/lib/prisma";
import { MASCOTS, getUnlockedMascots } from "@/lib/mascotCatalog";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getAuthUserFromCookie();
  if (!user?.email) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email },
    select: { selectedMascot: true },
  });

  if (!dbUser) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  return NextResponse.json({ mascot: dbUser.selectedMascot || "box" });
}

export async function PUT(request) {
  const user = await getAuthUserFromCookie();
  if (!user?.email) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const body = await request.json();
  const { mascotId } = body;

  if (!mascotId || !MASCOTS[mascotId]) {
    return NextResponse.json({ error: "Mascota inválida" }, { status: 400 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email },
    select: { id: true, selectedMascot: true, role: true },
  });

  if (!dbUser) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  const achievements = await prisma.achievement.findMany({
    where: { userId: dbUser.id },
  });

  const unlocked = getUnlockedMascots(achievements, dbUser.role);

  if (!unlocked.includes(mascotId)) {
    return NextResponse.json({ error: "Mascota bloqueada" }, { status: 403 });
  }

  await prisma.user.update({
    where: { id: dbUser.id },
    data: { selectedMascot: mascotId },
  });

  return NextResponse.json({ success: true, mascot: mascotId });
}

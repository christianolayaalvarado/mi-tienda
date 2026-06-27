import { NextResponse } from "next/server";
import { getAuthUserFromCookie } from "@/lib/authFromCookie";
import prisma from "@/lib/prisma";
import { ACHIEVEMENT_DEFINITIONS, getUnlockedMascots } from "@/lib/mascotCatalog";

export async function GET() {
  const user = await getAuthUserFromCookie();
  if (!user?.email) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email },
    select: { id: true, selectedMascot: true },
  });

  if (!dbUser) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  const achievements = await prisma.achievement.findMany({
    where: { userId: dbUser.id },
    orderBy: { unlockedAt: "desc" },
  });

  const unlockedMascots = getUnlockedMascots(achievements);

  const achievementsWithDetails = achievements.map((a) => ({
    ...a,
    definition: ACHIEVEMENT_DEFINITIONS[a.type] || null,
  }));

  return NextResponse.json({
    achievements: achievementsWithDetails,
    unlockedMascots,
    selectedMascot: dbUser.selectedMascot || "box",
  });
}

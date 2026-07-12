import { NextResponse } from "next/server";
import { getAuthUserFromCookie } from "@/lib/authFromCookie";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getAuthUserFromCookie();
    if (!user?.email) {
      return NextResponse.json({ theme: "default" });
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: { id: true },
    });

    if (!dbUser) return NextResponse.json({ theme: "default" });

    const prefs = await prisma.userPreferences.findUnique({
      where: { userId: dbUser.id },
    });

    return NextResponse.json({ theme: prefs?.theme || "default" });
  } catch (error) {
    console.error("Error fetching preferences:", error);
    return NextResponse.json({ theme: "default" });
  }
}

export async function PUT(req) {
  try {
    const user = await getAuthUserFromCookie();
    if (!user?.email) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: { id: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const { theme } = await req.json();
    const validThemes = ["default", "pastel", "grayscale", "vibrant", "dark"];
    if (!validThemes.includes(theme)) {
      return NextResponse.json({ error: "Tema inválido" }, { status: 400 });
    }

    const prefs = await prisma.userPreferences.upsert({
      where: { userId: dbUser.id },
      update: { theme },
      create: { userId: dbUser.id, theme },
    });

    return NextResponse.json({ theme: prefs.theme });
  } catch (error) {
    console.error("Error updating preferences:", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}

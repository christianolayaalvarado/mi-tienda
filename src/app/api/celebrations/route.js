import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUserFromCookie } from "@/lib/authFromCookie";

export async function GET() {
  try {
    const state = await prisma.celebrationState.findUnique({ where: { key: "activeCelebration" } });
    return NextResponse.json({ activeId: state?.value || null });
  } catch (e) {
    return NextResponse.json({ activeId: null });
  }
}

export async function PUT(req) {
  try {
    const user = await getAuthUserFromCookie(req);
    if (!user || (user.role !== "admin" && user.email !== "admin@demo.com")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const { activeId } = await req.json();
    await prisma.celebrationState.upsert({
      where: { key: "activeCelebration" },
      update: { value: activeId || null },
      create: { key: "activeCelebration", value: activeId || null },
    });
    return NextResponse.json({ ok: true, activeId: activeId || null });
  } catch (e) {
    return NextResponse.json({ error: "Error al guardar" }, { status: 500 });
  }
}

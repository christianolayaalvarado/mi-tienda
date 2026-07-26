import { NextResponse } from "next/server";
import { getAuthUserFromCookie } from "@/lib/authFromCookie";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const images = await prisma.dashboardCardImage.findMany();
    return NextResponse.json(images);
  } catch (error) {
    console.error("Error fetching card images:", error);
    return NextResponse.json([]);
  }
}

export async function PUT(req) {
  try {
    const authUser = await getAuthUserFromCookie();
    if (!authUser?.email) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: authUser.email },
      select: { role: true },
    });

    if (user?.role !== "admin" && user?.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await req.json();
    const { cardId, itemHref, imageUrl, offsetX, offsetY, scale, headerUrl, headerOffsetX, headerOffsetY, headerScale } = body;

    if (!cardId) {
      return NextResponse.json({ error: "cardId requerido" }, { status: 400 });
    }

    const data = {};
    if (imageUrl !== undefined) data.imageUrl = imageUrl;
    if (offsetX !== undefined) data.offsetX = offsetX;
    if (offsetY !== undefined) data.offsetY = offsetY;
    if (scale !== undefined) data.scale = scale;
    if (headerUrl !== undefined) data.headerUrl = headerUrl;
    if (headerOffsetX !== undefined) data.headerOffsetX = headerOffsetX;
    if (headerOffsetY !== undefined) data.headerOffsetY = headerOffsetY;
    if (headerScale !== undefined) data.headerScale = headerScale;

    const where = itemHref ? { cardId_itemHref: { cardId, itemHref } } : { cardId, itemHref: null };

    let existing = null;
    try {
      existing = await prisma.dashboardCardImage.findFirst({ where });
    } catch (_) {
      existing = null;
    }

    let result;
    if (existing) {
      result = await prisma.dashboardCardImage.update({
        where: { id: existing.id },
        data,
      });
    } else {
      result = await prisma.dashboardCardImage.create({
        data: {
          cardId,
          itemHref: itemHref || null,
          imageUrl: imageUrl || "",
          offsetX: offsetX || 0,
          offsetY: offsetY || 0,
          scale: scale || 1,
          headerUrl: headerUrl || null,
          headerOffsetX: headerOffsetX || 0,
          headerOffsetY: headerOffsetY || 0,
          headerScale: headerScale || 1,
        },
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error updating card image:", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const authUser = await getAuthUserFromCookie();
    if (!authUser?.email) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: authUser.email },
      select: { role: true },
    });

    if (user?.role !== "admin" && user?.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const cardId = searchParams.get("cardId");
    const itemHref = searchParams.get("itemHref");

    if (!cardId) {
      return NextResponse.json({ error: "cardId requerido" }, { status: 400 });
    }

    if (itemHref) {
      const existing = await prisma.dashboardCardImage.findFirst({ where: { cardId, itemHref } });
      if (existing) await prisma.dashboardCardImage.delete({ where: { id: existing.id } });
    } else {
      const existing = await prisma.dashboardCardImage.findFirst({ where: { cardId, itemHref: null } });
      if (existing) await prisma.dashboardCardImage.delete({ where: { id: existing.id } });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting card image:", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}

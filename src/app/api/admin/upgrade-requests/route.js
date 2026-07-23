import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerAuthUser } from "@/lib/serverAuth";

// GET /api/admin/upgrade-requests — list pending upgrade requests
export async function GET(req) {
  try {
    const user = await getServerAuthUser(req);
    if (!user?.id || (user.role !== "admin" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const requests = await prisma.supportReport.findMany({
      where: { category: "upgrade_request", status: "pending" },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ ok: true, requests });
  } catch (err) {
    console.error("GET admin/upgrade-requests error:", err);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

// POST /api/admin/upgrade-requests — approve or reject upgrade request
export async function POST(req) {
  try {
    const user = await getServerAuthUser(req);
    if (!user?.id || (user.role !== "admin" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { userId, action } = await req.json();

    if (!userId || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Parametros invalidos" }, { status: 400 });
    }

    // Find the pending request
    const request = await prisma.supportReport.findFirst({
      where: { category: "upgrade_request", status: "pending" },
    });

    if (!request) {
      return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 });
    }

    if (action === "approve") {
      // Upgrade user to full + create store
      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: userId },
          data: { plan: "full", role: "SELLER" },
        });

        const stores = await tx.store.findMany({
          where: { userId },
          select: { id: true },
        });

        if (stores.length === 0) {
          const u = await tx.user.findUnique({ where: { id: userId }, select: { name: true, email: true } });
          const storeCode = "STORE-" + Date.now() + "-" + Math.floor(Math.random() * 9000 + 1000);
          await tx.store.create({
            data: {
              name: (u.name || u.email.split("@")[0]) + "'s Store",
              code: storeCode,
              userId,
            },
          });
        }
      });
    }

    // Update request status
    await prisma.supportReport.update({
      where: { id: request.id },
      data: { status: action === "approve" ? "resolved" : "closed" },
    });

    return NextResponse.json({
      ok: true,
      message: action === "approve" ? "Plan Full activado" : "Solicitud rechazada",
    });
  } catch (err) {
    console.error("POST admin/upgrade-requests error:", err);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

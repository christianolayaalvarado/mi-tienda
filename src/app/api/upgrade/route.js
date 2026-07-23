import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerAuthUser } from "@/lib/serverAuth";

export async function POST(req) {
  try {
    const user = await getServerAuthUser(req);
    if (!user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { plan, billing } = await req.json();

    if (plan !== "full") {
      return NextResponse.json({ error: "Plan invalido" }, { status: 400 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { plan: true },
    });

    if (currentUser?.plan === "full") {
      return NextResponse.json({ error: "Ya tienes el plan Full" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id: user.id },
        data: { plan: "full", role: "SELLER" },
      });

      const stores = await tx.store.findMany({
        where: { userId: user.id },
        select: { id: true },
      });

      if (stores.length === 0) {
        const storeCode = "STORE-" + Date.now() + "-" + Math.floor(Math.random() * 9000 + 1000);
        await tx.store.create({
          data: {
            name: (u.name || u.email.split("@")[0]) + "'s Store",
            code: storeCode,
            userId: user.id,
          },
        });
      }
    });

    return NextResponse.json({
      ok: true,
      message: "Plan Full activado correctamente",
      plan: "full",
    });
  } catch (err) {
    console.error("POST user/upgrade error:", err);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

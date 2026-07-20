import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerAuthUser } from "@/lib/serverAuth";

export async function GET(req) {
  try {
    const authUser = await getServerAuthUser(req);
    if (!authUser?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { email: authUser.email },
      include: { stores: { select: { id: true } } },
    });

    if (!user?.stores?.length) {
      return NextResponse.json({ pendingCount: 0 });
    }

    const storeIds = user.stores.map((s) => s.id);

    const pendingCount = await prisma.orderItem.count({
      where: {
        storeId: { in: storeIds },
        paymentStatus: "unpaid",
        order: { status: "pending" },
      },
    });

    return NextResponse.json({ pendingCount });
  } catch (err) {
    console.error("Error pending count:", err);
    return NextResponse.json({ pendingCount: 0 });
  }
}

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerAuthUser } from "@/lib/serverAuth";

export async function POST(req) {
  try {
    const user = await getServerAuthUser(req);
    if (!user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { phone, transactionId, amount } = await req.json();

    if (!phone) {
      return NextResponse.json({ error: "Numero de telefono requerido" }, { status: 400 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { plan: true },
    });

    if (currentUser?.plan === "full") {
      return NextResponse.json({ error: "Ya tienes el plan Full" }, { status: 400 });
    }

    await prisma.supportReport.create({
      data: {
        userId: user.id,
        email: user.email,
        category: "upgrade_request",
        description: JSON.stringify({
          userId: user.id,
          email: user.email,
          name: user.name,
          phone,
          transactionId: transactionId || "N/A",
          amount: amount || "89.99",
          requestedAt: new Date().toISOString(),
        }),
        status: "pending",
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Solicitud enviada. El administrador revisara tu pago y activara tu plan Full.",
    });
  } catch (err) {
    console.error("POST upgrade-request error:", err);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

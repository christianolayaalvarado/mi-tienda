import { NextResponse } from "next/server";
import { getAuthUserFromCookie } from "@/lib/authFromCookie";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/* GET: obtener código y stats del usuario */
export async function GET() {
  try {
    const user = await getAuthUserFromCookie();
    if (!user?.email) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: { id: true, name: true, email: true, coinBalance: true },
    });
    if (!dbUser) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

    let referral = await prisma.referral.findFirst({
      where: { referrerId: dbUser.id },
    });

    if (!referral) {
      let code = generateCode();
      let attempts = 0;
      while (attempts < 10) {
        const exists = await prisma.referral.findUnique({ where: { code } });
        if (!exists) break;
        code = generateCode();
        attempts++;
      }
      referral = await prisma.referral.create({
        data: { code, referrerId: dbUser.id },
      });
    }

    const referralCount = await prisma.referral.count({
      where: { referrerId: dbUser.id, referredId: { not: null } },
    });

    const referredUsers = await prisma.referral.findMany({
      where: { referrerId: dbUser.id, referredId: { not: null } },
      include: { referred: { select: { name: true, email: true, createdAt: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json({
      code: referral.code,
      referralCount,
      coinBalance: dbUser.coinBalance,
      referredUsers: referredUsers.map((r) => ({
        name: r.referred?.name || "Sin nombre",
        email: r.referred?.email || "",
        date: r.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching referral:", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}

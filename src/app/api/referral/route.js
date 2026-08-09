import { NextResponse } from "next/server";
import { getAuthUserFromCookie } from "@/lib/authFromCookie";
import prisma from "@/lib/prisma";

const REWARD_AMOUNT = 10;

export async function GET(req) {
  const user = await getAuthUserFromCookie(req);
  if (!user?.email) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { email: user.email }, select: { id: true, sellerCode: true } });
  if (!dbUser) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const referralCount = await prisma.user.count({ where: { referredBy: dbUser.sellerCode } });
  const rewards = referralCount * REWARD_AMOUNT;

  return NextResponse.json({
    sellerCode: dbUser.sellerCode,
    referralCount,
    rewards,
    rewardPerReferral: REWARD_AMOUNT,
    referralLink: `https://mi-tienda-app-theta.vercel.app/register?ref=${dbUser.sellerCode}`,
  });
}

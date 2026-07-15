import prisma from "@/lib/prisma";

export async function addCoins(userId, amount, reason) {
  if (!userId || !amount || amount <= 0) return null;

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { coinBalance: { increment: amount } },
    select: { coinBalance: true },
  });

  console.log(`[Coins] +${amount} to ${userId} (${reason}). New balance: ${updated.coinBalance}`);
  return updated.coinBalance;
}

export async function getCoinBalance(userId) {
  if (!userId) return 0;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { coinBalance: true },
  });
  return user?.coinBalance || 0;
}

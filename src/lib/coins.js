import prisma from "@/lib/prisma";

export async function addCoins(userId, amount, reason) {
  if (!userId || !amount || amount <= 0) return null;

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { coinBalance: { increment: amount } },
    select: { coinBalance: true },
  });

  // Log transaction for audit trail
  try {
    await prisma.coinTransaction.create({
      data: {
        userId,
        amount,
        reason: reason || "unknown",
        balance: updated.coinBalance,
      },
    });
  } catch (e) {
    console.error("[Coins] Failed to log transaction:", e?.message || e);
  }

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

export async function getCoinHistory(userId, limit = 20) {
  if (!userId) return [];
  const transactions = await prisma.coinTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return transactions;
}

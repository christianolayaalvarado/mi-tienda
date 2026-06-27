import prisma from "./prisma";
import { ACHIEVEMENT_DEFINITIONS } from "./mascotCatalog";

export async function awardAchievement(userId, type) {
  if (!ACHIEVEMENT_DEFINITIONS[type]) return null;

  const existing = await prisma.achievement.findUnique({
    where: { userId_type: { userId, type } },
  });

  if (existing) return null;

  const achievement = await prisma.achievement.create({
    data: { userId, type },
  });

  return { ...achievement, definition: ACHIEVEMENT_DEFINITIONS[type] };
}

export async function checkAndAwardAchievements(userId) {
  const newAchievements = [];

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      orders: { select: { id: true, paymentStatus: true } },
      reviews: { select: { id: true } },
      stores: {
        select: {
          orderItems: { select: { id: true, order: { select: { paymentStatus: true } } } },
        },
      },
    },
  });

  if (!user) return [];

  const paidOrders = user.orders.filter((o) => o.paymentStatus === "paid").length;
  const reviewCount = user.reviews.length;
  const totalSold = user.stores.reduce(
    (acc, store) =>
      acc + store.orderItems.filter((oi) => oi.order?.paymentStatus === "paid").length,
    0
  );

  if (paidOrders >= 1) {
    const a = await awardAchievement(userId, "first_purchase");
    if (a) newAchievements.push(a);
  }

  if (totalSold >= 10) {
    const a = await awardAchievement(userId, "10_products_sold");
    if (a) newAchievements.push(a);
  }

  if (reviewCount >= 5) {
    const a = await awardAchievement(userId, "5_reviews");
    if (a) newAchievements.push(a);
  }

  if (totalSold >= 50) {
    const a = await awardAchievement(userId, "top_seller");
    if (a) newAchievements.push(a);
  }

  if (totalSold >= 100) {
    const a = await awardAchievement(userId, "mega_seller");
    if (a) newAchievements.push(a);
  }

  return newAchievements;
}

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
      orders: {
        select: {
          id: true,
          paymentStatus: true,
          total: true,
        },
      },
      reviews: { select: { id: true } },
      stores: {
        select: {
          products: { select: { id: true } },
          orderItems: {
            select: {
              id: true,
              quantity: true,
              price: true,
              order: { select: { paymentStatus: true, total: true } },
            },
          },
        },
      },
    },
  });

  if (!user) return [];

  const paidOrders = user.orders.filter((o) => o.paymentStatus === "paid");
  const paidOrderCount = paidOrders.length;
  const reviewCount = user.reviews.length;

  const totalSpent = paidOrders.reduce(
    (acc, order) => acc + (order.total || 0),
    0
  );

  const totalSold = user.stores.reduce(
    (acc, store) =>
      acc +
      store.orderItems.filter((oi) => oi.order?.paymentStatus === "paid")
        .length,
    0
  );

  const totalProducts = user.stores.reduce(
    (acc, store) => acc + store.products.length,
    0
  );

  const hasSale = totalSold >= 1;

  // --- COMPRAS ---

  if (paidOrderCount >= 1) {
    const a = await awardAchievement(userId, "first_purchase");
    if (a) newAchievements.push(a);
  }

  if (paidOrderCount >= 3) {
    const a = await awardAchievement(userId, "3_purchases");
    if (a) newAchievements.push(a);
  }

  // --- VENTAS ---

  if (hasSale) {
    const a = await awardAchievement(userId, "first_sale");
    if (a) newAchievements.push(a);
  }

  if (totalSold >= 10) {
    const a = await awardAchievement(userId, "10_products_sold");
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

  // --- PRODUCTOS ---

  if (totalProducts >= 5) {
    const a = await awardAchievement(userId, "5_products");
    if (a) newAchievements.push(a);
  }

  // --- RESEÑAS ---

  if (reviewCount >= 5) {
    const a = await awardAchievement(userId, "5_reviews");
    if (a) newAchievements.push(a);
  }

  // --- GASTO ---

  if (totalSpent >= 200) {
    const a = await awardAchievement(userId, "spend_200");
    if (a) newAchievements.push(a);
  }

  if (totalSpent >= 500) {
    const a = await awardAchievement(userId, "spend_500");
    if (a) newAchievements.push(a);
  }

  return newAchievements;
}

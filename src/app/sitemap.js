import prisma from "@/lib/prisma";

const SITE_URL = "https://mi-tienda-app-theta.vercel.app";

export default async function sitemap() {
  const staticPages = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${SITE_URL}/ofertas`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${SITE_URL}/login`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/register`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.2 },
  ];

  let productPages = [];
  let storePages = [];

  try {
    const products = await prisma.product.findMany({
      where: { deletedAt: null },
      select: { id: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 5000,
    });

    productPages = products.map((p) => ({
      url: `${SITE_URL}/product/${p.id}`,
      lastModified: p.updatedAt || new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    }));
  } catch {}

  try {
    const stores = await prisma.store.findMany({
      select: { code: true, updatedAt: true },
      take: 1000,
    });

    storePages = stores.map((s) => ({
      url: `${SITE_URL}/store/${s.code}`,
      lastModified: s.updatedAt || new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    }));
  } catch {}

  return [...staticPages, ...productPages, ...storePages];
}

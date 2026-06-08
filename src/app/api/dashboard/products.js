// pages/api/dashboard/products.js  (Next.js API route /app/api/dashboard/products/route.js)
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import prisma from "@/lib/prisma";

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) return new Response(JSON.stringify({ error: "No autorizado" }), { status: 401 });

  // Si es admin, puede ver todos (opcional)
  if (session.user.role === "admin") {
    const all = await prisma.product.findMany({ orderBy: { createdAt: "desc" } });
    return new Response(JSON.stringify({ products: all }), { status: 200 });
  }

  // Seller normal: solo productos creados por su userId o por sus tiendas
  const products = await prisma.product.findMany({
    where: { createdById: session.user.id }, // o { storeId: { in: storeIds } } si usas stores
    orderBy: { createdAt: "desc" },
  });

  return new Response(JSON.stringify({ products }), { status: 200 });
}

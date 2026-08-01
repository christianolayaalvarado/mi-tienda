import { NextResponse } from "next/server";
import { getAuthUserFromCookie } from "@/lib/authFromCookie";
import prisma from "@/lib/prisma";

const PLANS = {
  basic: { days: 7, price: 5, label: "7 días — S/ 5" },
  boost: { days: 14, price: 10, label: "14 días — S/ 10" },
  premium: { days: 30, price: 20, label: "30 días — S/ 20" },
};

export async function POST(req) {
  const user = await getAuthUserFromCookie();
  if (!user?.email) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { email: user.email }, select: { id: true } });
  if (!dbUser) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  const { productId, plan, paymentMethod, paymentRef } = await req.json();
  if (!productId || !PLANS[plan]) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const product = await prisma.product.findUnique({ where: { id: productId }, select: { userId: true } });
  if (!product || product.userId !== dbUser.id) {
    return NextResponse.json({ error: "Producto no encontrado o no es tuyo" }, { status: 403 });
  }

  const planConfig = PLANS[plan];
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + planConfig.days);

  const featured = await prisma.featuredProduct.create({
    data: {
      productId,
      userId: dbUser.id,
      plan,
      endDate,
      paymentMethod: paymentMethod || null,
      paymentRef: paymentRef || null,
    },
  });

  return NextResponse.json({ success: true, featured, plan: planConfig });
}

import { NextResponse } from "next/server";
import { getAuthUserFromCookie } from "@/lib/authFromCookie";
import prisma from "@/lib/prisma";

export async function PATCH(req, context) {
  const params = await context.params;
  const productId = params?.id;
  if (!productId) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const user = await getAuthUserFromCookie(req);
  if (!user?.email) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { email: user.email }, select: { id: true } });
  if (!dbUser) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const product = await prisma.product.findUnique({ where: { id: productId }, select: { userId: true } });
  if (!product || product.userId !== dbUser.id) {
    return NextResponse.json({ error: "No es tu producto" }, { status: 403 });
  }

  const { flashSaleAllowed } = await req.json();
  if (typeof flashSaleAllowed !== "boolean") {
    return NextResponse.json({ error: "Valor inválido" }, { status: 400 });
  }

  await prisma.product.update({
    where: { id: productId },
    data: { flashSaleAllowed },
  });

  return NextResponse.json({ ok: true, flashSaleAllowed });
}

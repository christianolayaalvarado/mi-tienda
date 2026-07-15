import prisma from "@/lib/prisma";
import { getServerAuthUser } from "@/lib/serverAuth";

export async function GET(req) {
  const user = await getServerAuthUser(req);
  if (!user?.id) {
    return new Response(JSON.stringify({ error: "No autenticado" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const favorites = await prisma.favorite.findMany({
    where: { userId: user.id },
    include: {
      product: {
        include: { category: true, store: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({
    favorites: favorites.map((f) => f.product),
    ids: favorites.map((f) => f.productId),
  });
}

export async function POST(req) {
  const user = await getServerAuthUser(req);
  if (!user?.id) {
    return new Response(JSON.stringify({ error: "No autenticado" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { productId } = await req.json();
  if (!productId) {
    return new Response(JSON.stringify({ error: "productId requerido" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const existing = await prisma.favorite.findUnique({
    where: { userId_productId: { userId: user.id, productId } },
  });

  if (existing) {
    return Response.json({ ok: true, favorited: true });
  }

  await prisma.favorite.create({
    data: { userId: user.id, productId },
  });

  return Response.json({ ok: true, favorited: true });
}

export async function DELETE(req) {
  const user = await getServerAuthUser(req);
  if (!user?.id) {
    return new Response(JSON.stringify({ error: "No autenticado" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");
  if (!productId) {
    return new Response(JSON.stringify({ error: "productId requerido" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  await prisma.favorite.deleteMany({
    where: { userId: user.id, productId },
  });

  return Response.json({ ok: true, favorited: false });
}

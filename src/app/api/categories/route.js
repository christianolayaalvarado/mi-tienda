// src/app/api/categories/route.js
import prisma from "@/lib/prisma";

export async function GET() {
  const categories = await prisma.category.findMany({
    select: {
      id: true,
      name: true,
    },
  });

  // Eliminar duplicados por id (por si hubo pruebas anteriores)
  const uniqueCategories = Array.from(
    new Map(categories.map(cat => [cat.id, cat])).values()
  );

  return new Response(JSON.stringify(uniqueCategories), { status: 200 });
}
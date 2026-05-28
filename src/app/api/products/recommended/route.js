import prisma from "@/lib/prisma";

/**
 * GET /api/products/recommended
 * Query params opcionales:
 * - page: número de página (default 1)
 * - limit: productos por página (default 8)
 * - categoryId: filtrar por categoría
 * - storeId: filtrar por tienda
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "8", 10);
    const categoryId = searchParams.get("categoryId");
    const storeId = searchParams.get("storeId");

    // --- Construir filtro dinámico ---
    const where = {};
    if (categoryId) where.categoryId = categoryId;
    if (storeId) where.storeId = storeId;

    // --- Obtener productos ---
    const allProducts = await prisma.product.findMany({
      where,
      select: {
        id: true,
        title: true,
        price: true,
        images: true, // array de imágenes en tu modelo Prisma
      },
    });

    if (!allProducts || allProducts.length === 0) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // --- Randomizar ---
    const shuffled = allProducts.sort(() => Math.random() - 0.5);

    // --- Paginación ---
    const startIndex = (page - 1) * limit;
    const paginatedProducts = shuffled.slice(startIndex, startIndex + limit);

    // --- Formatear imagen para el componente ---
    const formattedProducts = paginatedProducts.map((p) => ({
      ...p,
      image: Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : null,
    }));

    return new Response(JSON.stringify(formattedProducts), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error en API recommended:", err);
    return new Response(
      JSON.stringify({ error: "No se pudieron cargar los productos" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
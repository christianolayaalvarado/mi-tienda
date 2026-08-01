import prisma from "@/lib/prisma";
import ProductCard from "@/components/ProductCard";
import { notFound } from "next/navigation";

const SITE_URL = "https://mi-tienda-app-theta.vercel.app";

export async function generateMetadata({ params }) {
  const { code } = await params;
  if (!code) return { title: "Tienda no encontrada" };
  try {
    const store = await prisma.store.findUnique({
      where: { code },
      select: { name: true },
    });
    if (!store) return { title: "Tienda no encontrada" };
    return {
      title: `${store.name} — Tienda en Mi Tienda`,
      description: `Productos de ${store.name}. Encuentra los mejores productos en esta tienda dentro de Mi Tienda.`,
      alternates: { canonical: `${SITE_URL}/store/${code}` },
      openGraph: { title: `${store.name} | Mi Tienda`, description: `Productos de ${store.name}` },
    };
  } catch { return { title: "Tienda" }; }
}

export default async function StorePage({ params }) {

  // 🔥 FIX NEXT 14+
  const { code } = await params;

  if (!code) return notFound();

  // 🔍 Buscar tienda por código
  const store = await prisma.store.findUnique({
    where: { code },
  });

  if (!store) return notFound();

  // 🔥 Obtener productos de esa tienda
  const products = await prisma.product.findMany({
    where: {
      storeId: store.id,
    },
    include: {
      category: true,
      store: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">

      {/* 🔥 HEADER TIENDA */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          {store.name}
        </h1>

        <p className="text-gray-500 text-sm mt-1">
          {products.length} producto{products.length !== 1 && "s"}
        </p>
      </div>

      {/* 🔥 PRODUCTOS */}
      {products.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {products.map((product, idx) => (
            <ProductCard
              key={product.id}
              product={product}
              priority={idx < 5}
            />
          ))}
        </div>
      ) : (
        <p className="text-gray-500">
          Esta tienda aún no tiene productos.
        </p>
      )}

    </div>
  );
}
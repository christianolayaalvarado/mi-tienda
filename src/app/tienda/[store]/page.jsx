import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function StorePage({ params }) {
  // 🔥 FIX: await params
  const { store } = await params;

  // 🔹 Convertir slug a nombre real
  const storeName = store.replace(/-/g, " ");

  // 🔹 Buscar productos de esa tienda
  const products = await prisma.product.findMany({
    where: {
      store: {
        equals: storeName,
        mode: "insensitive",
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">
        Tienda: {storeName}
      </h1>

      {products.length === 0 ? (
        <p>No hay productos en esta tienda.</p>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {products.map((product) => (
            <div key={product.id} className="border p-4 rounded">
              <img
                src={product.images[0]}
                alt={product.title}
                className="w-full h-40 object-cover rounded"
              />

              <h2 className="font-bold mt-2">{product.title}</h2>
              <p>S/. {product.price}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
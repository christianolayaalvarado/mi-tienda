import prisma from "@/lib/prisma"
import Link from "next/link"
import ProductGallery from "@/components/ProductGallery"
import ProductInfo from "@/components/ProductInfo"
import ReviewsSection from "@/components/ReviewsSection"
import Image from "next/image"
import Breadcrumbs from "@/components/Breadcrumbs"
import ProductViewTracker from "@/components/ProductViewTracker"
import { optimizeCloudinary } from "@/lib/cloudinaryOptimize"

const SITE_URL = "https://mi-tienda-app-theta.vercel.app";

export async function generateMetadata({ params }) {
  const { id } = await params;
  if (!/^[a-fA-F0-9]{24}$/.test(id)) return { title: "Producto no encontrado" };

  try {
    const product = await prisma.product.findUnique({
      where: { id },
      select: { title: true, description: true, price: true, images: true, category: { select: { name: true } } },
    });
    if (!product) return { title: "Producto no encontrado" };

    const desc = product.description
      ? product.description.substring(0, 160).replace(/<[^>]*>/g, "")
      : `${product.title} — S/ ${product.price}`;
    const img = product.images?.[0] || `${SITE_URL}/images/og/mi-og.jpg`;

    return {
      title: product.title,
      description: desc,
      openGraph: {
        title: `${product.title} | Mi Tienda`,
        description: desc,
        url: `${SITE_URL}/product/${id}`,
        images: [{ url: img, width: 800, height: 600, alt: product.title }],
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: product.title,
        description: desc,
        images: [img],
      },
      alternates: { canonical: `${SITE_URL}/product/${id}` },
    };
  } catch {
    return { title: "Producto" };
  }
}

export default async function ProductDetail({ params }) {
  const { id } = await params;
  const isValidObjectId = /^[a-fA-F0-9]{24}$/.test(id);

  if (!isValidObjectId) {
    return (
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-12 text-center">
        <p className="text-gray-500 text-lg mb-4">ID de producto inválido</p>
        <Link href="/" className="inline-flex items-center gap-1 text-green-600 hover:underline font-medium">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver al inicio
        </Link>
      </div>
    );
  }

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      user: true,
      store: true,
    },
  });

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-12 text-center">
        <p className="text-gray-500 text-lg mb-4">Producto no encontrado</p>
        <Link href="/" className="inline-flex items-center gap-1 text-green-600 hover:underline font-medium">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver al inicio
        </Link>
      </div>
    );
  }

  const relatedProducts = await prisma.product.findMany({
    where: {
      categoryId: product.categoryId,
      NOT: { id: product.id },
    },
    take: 4,
  });

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description?.replace(/<[^>]*>/g, "").substring(0, 500) || product.title,
    image: product.images?.slice(0, 5),
    sku: product.id,
    brand: { "@type": "Brand", name: "Mi Tienda" },
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/product/${product.id}`,
      priceCurrency: "PEN",
      price: product.price,
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: product.store?.name || "Mi Tienda" },
    },
    category: product.category?.name,
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />

      <ProductViewTracker product={product} />

      <Breadcrumbs extraItems={[{ label: product.title }]} />

      <div className="grid md:grid-cols-2 gap-10 mt-4">
        <ProductGallery images={product.images} title={product.title} />
        <ProductInfo product={product} />
      </div>

      <ReviewsSection productId={product.id} />

      {relatedProducts.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-semibold mb-4">Productos relacionados</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {relatedProducts.map((item) => (
              <Link key={item.id} href={`/product/${item.id}`}>
                <div className="border p-3 rounded hover:shadow transition">
                  {item.images?.[0] && (
                    <div className="relative w-full h-32 mb-2">
                      <Image
                        src={optimizeCloudinary(item.images[0])}
                        alt={item.title}
                        fill
                        className="object-cover rounded"
                      />
                    </div>
                  )}
                  <p className="text-sm font-medium line-clamp-2">{item.title}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

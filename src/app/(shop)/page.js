// app/(shop)/page.jsx
import HomeClient from "@/components/HomeClient";

export const metadata = {
  title: "Mi Tienda — Productos",
  description: "Encuentra los mejores productos en Mi Tienda",
  openGraph: {
    title: "Mi Tienda — Productos",
    description: "Encuentra los mejores productos en Mi Tienda",
    url: "https://mi-tienda-app-theta.vercel.app/?page=1",
    images: [
      {
        // URL absoluta a la imagen en public/images/og/mi-og.jpg
        url: "https://mi-tienda-app-git-master-christianolayaalvarados-projects.vercel.app/?page=1",
        width: 800,
        height: 630,
        alt: "Venta de productos en Mi Tienda",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function Home({ searchParams }) {
  return <HomeClient searchParams={searchParams} />;
}

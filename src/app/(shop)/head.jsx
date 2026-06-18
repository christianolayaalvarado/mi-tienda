// app/(shop)/head.jsx
export default function Head() {
  return (
    <>
      <title>Mi Tienda — Productos</title>
      <meta name="description" content="Encuentra los mejores productos en Mi Tienda" />

      <meta property="og:title" content="Mi Tienda — Productos" />
      <meta property="og:description" content="Encuentra los mejores productos en Mi Tienda" />
      <meta property="og:image" content="https://mi-tienda-app-theta.vercel.app/images/og/mi-og.jpg?v=1" />
      <meta property="og:image:width" content="800" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="Venta de productos en Mi Tienda" />
      <meta property="og:url" content="https://mi-tienda-app-theta.vercel.app/?page=1" />
      <meta name="twitter:card" content="summary_large_image" />
    </>
  );
}

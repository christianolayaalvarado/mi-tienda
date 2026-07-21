import Link from "next/link";

export const metadata = {
  title: "Sobre Nosotros - Mi Tienda",
  description: "Conoce más sobre Mi Tienda, tu plataforma de comercio electrónico en Perú.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
              </svg>
            </div>
            <span className="font-bold text-gray-900">Mi Tienda</span>
          </Link>
          <Link href="/" className="text-sm text-green-600 hover:underline">← Volver a la tienda</Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">Sobre Mi Tienda</h1>

        <div className="prose prose-gray max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Nuestra Misión</h2>
            <p className="text-gray-600 leading-relaxed">
              Mi Tienda es una plataforma de comercio electrónico diseñada para emprendedores y pequeños negocios en Perú.
              Nuestro objetivo es hacer que vender en línea sea simple, accesible y efectivo para todos.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">¿Qué nos hace diferentes?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <div className="text-3xl mb-3">🐾</div>
                <h3 className="font-bold text-gray-900 mb-2">Sistema de Mascotas</h3>
                <p className="text-sm text-gray-600">Companeros virtuales que te ayudan, ganan monedas y hacen la experiencia de compra más divertida.</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <div className="text-3xl mb-3">💬</div>
                <h3 className="font-bold text-gray-900 mb-2">Chat en Vivo</h3>
                <p className="text-sm text-gray-600">Comunicación directa con vendedores. Resuelve dudas antes de comprar.</p>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                <div className="text-3xl mb-3">⭐</div>
                <h3 className="font-bold text-gray-900 mb-2">Reseñas y Confianza</h3>
                <p className="text-sm text-gray-600">Sistema de reseñas verificadas para que compres con confianza.</p>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
                <div className="text-3xl mb-3">🚚</div>
                <h3 className="font-bold text-gray-900 mb-2">Envíos a Todo Perú</h3>
                <p className="text-sm text-gray-600">Integración con múltiples couriers nacionales para envíos rápidos y seguros.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Para Vendedores</h2>
            <p className="text-gray-600 leading-relaxed">
              Crea tu tienda gratis, sube tus productos, gestiona inventario con inteligencia artificial,
              recibe pagos de forma segura y envía a cualquier parte del país. Todo desde un solo panel de control.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Para Compradores</h2>
            <p className="text-gray-600 leading-relaxed">
              Explora miles de productos de vendedores verificados. Compara precios, lee reseñas reales,
              chatea directamente con el vendedor y recibe tu compra en la puerta de tu casa.
            </p>
          </section>

          <section className="bg-gray-50 rounded-xl p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">¿Listo para empezar?</h2>
            <p className="text-gray-600 mb-6">Únete a nuestra comunidad de vendedores y compradores.</p>
            <div className="flex justify-center gap-4">
              <Link href="/register" className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition">
                Crear Cuenta
              </Link>
              <Link href="/" className="bg-white text-gray-900 border border-gray-300 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition">
                Explorar Productos
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

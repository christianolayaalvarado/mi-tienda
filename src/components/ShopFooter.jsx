import Link from "next/link";

export default function ShopFooter() {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                </svg>
              </div>
              <span className="font-bold text-gray-900">Mi Tienda</span>
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed">
              Tu plataforma de comercio electrónico. Compra y vende con confianza.
            </p>
          </div>

          {/* Comprar */}
          <div>
            <h4 className="font-semibold text-gray-900 text-sm mb-3">Comprar</h4>
            <ul className="space-y-2">
              <li><Link href="/" className="text-sm text-gray-500 hover:text-green-600 transition">Productos</Link></li>
              <li><Link href="/cart" className="text-sm text-gray-500 hover:text-green-600 transition">Carrito</Link></li>
              <li><Link href="/checkout" className="text-sm text-gray-500 hover:text-green-600 transition">Checkout</Link></li>
            </ul>
          </div>

          {/* Mi Cuenta */}
          <div>
            <h4 className="font-semibold text-gray-900 text-sm mb-3">Mi Cuenta</h4>
            <ul className="space-y-2">
              <li><Link href="/dashboard" className="text-sm text-gray-500 hover:text-green-600 transition">Dashboard</Link></li>
              <li><Link href="/dashboard/orders" className="text-sm text-gray-500 hover:text-green-600 transition">Mis Órdenes</Link></li>
              <li><Link href="/dashboard/profile/edit" className="text-sm text-gray-500 hover:text-green-600 transition">Mi Perfil</Link></li>
              <li><Link href="/dashboard/mascotas" className="text-sm text-gray-500 hover:text-green-600 transition">Mis Mascotas</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-gray-900 text-sm mb-3">Legal</h4>
            <ul className="space-y-2">
              <li><span className="text-sm text-gray-500 hover:text-green-600 transition cursor-pointer">Términos de Servicio</span></li>
              <li><span className="text-sm text-gray-500 hover:text-green-600 transition cursor-pointer">Política de Privacidad</span></li>
              <li><span className="text-sm text-gray-500 hover:text-green-600 transition cursor-pointer">Blog</span></li>
              <li><span className="text-sm text-gray-500 hover:text-green-600 transition cursor-pointer">Contacto</span></li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} Mi Tienda. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-4">
            <a href="mailto:soporte@mitienda.com" className="text-xs text-gray-400 hover:text-green-600 transition">
              soporte@mitienda.com
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

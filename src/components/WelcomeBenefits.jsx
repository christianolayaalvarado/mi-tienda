"use client";

export default function WelcomeBenefits({ isOpen, onClose, onUpgrade, userName }) {

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-5 text-center">
          <div className="text-4xl mb-2">🎉</div>
          <h2 className="text-xl font-bold text-white">Bienvenido{userName ? `, ${userName}` : ""}</h2>
          <p className="text-green-100 text-sm mt-1">Tu cuenta esta lista. Esto es lo que incluye:</p>
        </div>

        <div className="p-6">
          {/* Free Plan */}
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full">FREE</span>
              <span className="text-sm font-medium text-gray-700">Tu plan actual — Comprador</span>
            </div>
            <ul className="space-y-2">
              {[
                "Comprar de cualquier tienda",
                "Historial de pedidos",
                "Resenas y calificaciones",
                "Chat con asistente IA",
                "1 giro diario en la ruleta",
                "Pago seguro con Culqi",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-green-500 mt-0.5">✅</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 my-5"></div>

          {/* Full Plan */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full">FULL</span>
              <span className="text-sm font-medium text-gray-700">Desbloquea y empieza a vender</span>
            </div>
            <ul className="space-y-2">
              {[
                "Crear tu propia tienda online",
                "Gestionar productos y stock",
                "Email marketing a clientes",
                "Analiticas de ventas detalladas",
                "Cupones y descuentos",
                "Mascota animada premium",
                "Multi-carrier de envios",
                "Multi-gateway de pagos",
                "Dark Mode y PWA",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-blue-500 mt-0.5">🔒</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex flex-col sm:flex-row gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 border border-gray-300 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50 transition"
          >
            Empezar a comprar
          </button>
          <button
            onClick={onUpgrade}
            className="flex-1 py-2.5 px-4 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700 transition"
          >
            Quiero vender →
          </button>
        </div>
      </div>
    </div>
  );
}

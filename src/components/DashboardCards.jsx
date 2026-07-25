"use client";

import { useState, useMemo } from "react";
import SlidePanel from "@/components/SlidePanel";

const CATEGORIES = [
  {
    id: "nav",
    label: "Navegación",
    icon: "📌",
    description: "Acceso rápido a las páginas principales",
    gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    itemGradient: "linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)",
    items: [
      { href: "/dashboard", label: "Inicio", icon: "🏠", description: "Panel principal con resumen de métricas y actividad reciente" },
      { href: "/dashboard/favorites", label: "Favoritos", icon: "❤️", description: "Productos que has marcado como favoritos para comprar después" },
    ],
  },
  {
    id: "tienda",
    label: "Tienda",
    icon: "🛍️",
    description: "Gestiona tus productos, órdenes y reseñas",
    gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    itemGradient: "linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)",
    items: [
      { href: "/dashboard/products", label: "Productos", icon: "📦", description: "Administra tu catálogo: crear, editar, precios, stock e imágenes" },
      { href: "/dashboard/orders", label: "Mis Órdenes", icon: "🧾", description: "Visualiza y gestiona las órdenes de compra de tus clientes" },
      { href: "/dashboard/seller/reviews", label: "Reseñas", icon: "⭐", description: "Lee y responde las reseñas que tus clientes dejan en tus productos" },
    ],
  },
  {
    id: "ventas",
    label: "Ventas",
    icon: "💰",
    description: "Analiza tus ventas, visitantes y rendimiento",
    gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    itemGradient: "linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)",
    items: [
      { href: "/dashboard/seller/orders", label: "Ventas", icon: "💰", description: "Historial completo de ventas con estados, pagos y seguimiento" },
      { href: "/dashboard/seller/sold-products", label: "Productos vendidos", icon: "📊", description: "Ranking de productos más vendidos y análisis de demanda" },
      { href: "/dashboard/seller/analytics", label: "Visitantes", icon: "🗺️", description: "Mapa interactivo con ubicación geográfica de tus visitantes" },
    ],
  },
  {
    id: "marketing",
    label: "Marketing",
    icon: "📧",
    description: "Campañas de email y contacto con clientes",
    gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
    itemGradient: "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)",
    items: [
      { href: "/dashboard/seller/marketing", label: "Email Marketing", icon: "📧", description: "Crea y envía campañas de email con plantillas, filtros y programación" },
    ],
  },
  {
    id: "engagement",
    label: "Engagement",
    icon: "🎮",
    description: "Gamificación, ruleta y referidos para atraer clientes",
    gradient: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
    itemGradient: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
    items: [
      { href: "/spin-wheel", label: "Ruleta", icon: "🎰", description: "Ruleta de premios: descuentos, envío gratis y más para atraer compradores" },
      { href: "/dashboard/referrals", label: "Invitar amigos", icon: "🎁", description: "Programa de referidos: comparte tu código y gana recompensas" },
      { href: "/dashboard/mascotas", label: "Mascotas", icon: "🎭", description: "Tu mascota virtual que gana monedas y desbloquea accesorios" },
    ],
  },
  {
    id: "cuenta",
    label: "Mi Cuenta",
    icon: "👤",
    description: "Configura tu perfil, pagos y preferencias",
    gradient: "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
    itemGradient: "linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)",
    items: [
      { href: "/dashboard/profile/edit", label: "Editar Perfil", icon: "👤", description: "Actualiza tu nombre, foto, dirección y datos personales" },
      { href: "/dashboard/payment-methods", label: "Formas de pago", icon: "💳", description: "Configura Yape, Plin, transferencia bancaria y otros métodos de cobro" },
    ],
  },
  {
    id: "admin",
    label: "Admin",
    icon: "🔧",
    description: "Panel de administración (solo administradores)",
    gradient: "linear-gradient(135deg, #434343 0%, #000000 100%)",
    itemGradient: "linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)",
    adminOnly: true,
    items: [
      { href: "/dashboard/admin/orders", label: "Órdenes", icon: "🔧", description: "Gestiona todas las órdenes de la plataforma, aprueba y rechaza pagos" },
      { href: "/dashboard/admin/sellers", label: "Vendedores", icon: "👥", description: "Administra vendedores registrados, sus tiendas y estados de cuenta" },
      { href: "/dashboard/admin/plans", label: "Planes", icon: "💳", description: "Revisa solicitudes de upgrade, aprueba o rechaza planes de vendedores" },
      { href: "/dashboard/admin/reports", label: "Reportes", icon: "📋", description: "Reportes de bugs, sugerencias y quejas de usuarios con seguimiento" },
      { href: "/dashboard/admin/analytics", label: "Conversión", icon: "📊", description: "Métricas avanzadas de conversión, tráfico y rendimiento de la plataforma" },
      { href: "/dashboard/admin/shipping", label: "Tarifas envío", icon: "🚚", description: "Configura tarifas por zona, transportistas y costos de envío" },
      { href: "/dashboard/admin/coupons", label: "Cupones", icon: "🏷️", description: "Crea y gestiona cupones de descuento globales para la plataforma" },
      { href: "/dashboard/admin/marketing", label: "Email Marketing", icon: "📧", description: "Campañas de email a nivel de plataforma para todos los usuarios" },
    ],
  },
];

export default function DashboardCards({ userRole, isFull }) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);

  const visibleCategories = useMemo(() => {
    return CATEGORIES.filter((cat) => {
      if (cat.adminOnly && !(userRole === "admin" || userRole === "ADMIN")) return false;
      if (cat.id === "ventas" && !isFull) return false;
      if (cat.id === "marketing" && !isFull) return false;
      return true;
    });
  }, [userRole, isFull]);

  function handleOpen(cat) {
    setActiveCategory(cat);
    setPanelOpen(true);
  }

  function handleClose() {
    setPanelOpen(false);
    setTimeout(() => setActiveCategory(null), 300);
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {visibleCategories.map((cat) => (
          <button
            key={cat.id}
            onMouseEnter={() => setHoveredCard(cat.id)}
            onMouseLeave={() => setHoveredCard(null)}
            onClick={() => handleOpen(cat)}
            className="group relative overflow-hidden rounded-2xl text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-xl cursor-pointer border border-gray-100"
            style={{ background: cat.gradient }}
          >
            <div className="relative z-10 p-5 sm:p-6">
              <span className="text-4xl sm:text-5xl block mb-3 group-hover:scale-110 transition-transform duration-300">
                {cat.icon}
              </span>
              <h3 className="text-lg font-bold text-white mb-1">{cat.label}</h3>
              <p className="text-xs text-white/75 leading-relaxed">{cat.description}</p>

              <div className="mt-4 flex items-center gap-1 text-white/60 group-hover:text-white transition-colors">
                <span className="text-xs font-medium">
                  {cat.items.length} {cat.items.length === 1 ? "sección" : "secciones"}
                </span>
                <svg
                  className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>

            {/* Decorative circle */}
            <div
              className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-20 group-hover:scale-150 transition-transform duration-500"
              style={{ background: "rgba(255,255,255,0.3)" }}
            />
            <div
              className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full opacity-10 group-hover:scale-150 transition-transform duration-700"
              style={{ background: "rgba(255,255,255,0.3)" }}
            />
          </button>
        ))}
      </div>

      <SlidePanel open={panelOpen} onClose={handleClose} category={activeCategory} />
    </>
  );
}

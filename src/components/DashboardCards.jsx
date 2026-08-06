"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import SlidePanel from "@/components/SlidePanel";
import CardImageUploader from "@/components/CardImageUploader";

const CATEGORIES = [
  {
    id: "nav",
    label: "Navegación",
    icon: "📌",
    description: "Acceso rápido a las páginas principales",
    gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    photoGradient: "linear-gradient(160deg, #1e1b4b 0%, #4338ca 40%, #818cf8 100%)",
    monoBg: "#eef2ff",
    monoAccent: "#4338ca",
    monoText: "#3730a3",
    itemGradient: "linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)",
    items: [
      {
        href: "/dashboard",
        label: "Inicio",
        icon: "🏠",
        description: "Panel principal con resumen de métricas",
        longDescription: "Tu centro de control principal. Visualiza un resumen completo de métricas clave de tu tienda: productos, órdenes recientes, ingresos y actividad de visitantes. Todo lo que necesitas saber de un vistazo.",
        photoGradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        features: ["Resumen de métricas en tiempo real", "Accesos directos a funciones principales", "Vista general de tu tienda"],
      },
      {
        href: "/dashboard/favorites",
        label: "Favoritos",
        icon: "❤️",
        description: "Productos marcados como favoritos",
        longDescription: "Gestiona tu lista de productos favoritos. Aquí encuentras todos los artículos que has guardado para comprar después, comparar precios o simplemente tener a mano tus productos preferidos.",
        photoGradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
        features: ["Guarda productos para después", "Acceso rápido a compras futuras", "Organiza tu lista de deseos"],
      },
    ],
  },
  {
    id: "tienda",
    label: "Tienda",
    icon: "🛍️",
    description: "Gestiona tus productos, órdenes y reseñas",
    gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    photoGradient: "linear-gradient(160deg, #831843 0%, #be185d 40%, #f472b6 100%)",
    monoBg: "#fdf2f8",
    monoAccent: "#be185d",
    monoText: "#9d174d",
    itemGradient: "linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)",
    items: [
      {
        href: "/dashboard/products",
        label: "Productos",
        icon: "📦",
        description: "Administra tu catálogo completo",
        longDescription: "Administra el catálogo completo de tu tienda. Crea nuevos productos, edita descripciones, precios, imágenes y controla el stock. Organiza por categorías y mantén tu inventario siempre actualizado.",
        photoGradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
        features: ["Crear y editar productos", "Subir imágenes desde tu galería", "Control de precios e inventario", "Organizar por categorías", "Eliminar productos"],
      },
      {
        href: "/dashboard/orders",
        label: "Mis Órdenes",
        icon: "🧾",
        description: "Gestiona las órdenes de tus clientes",
        longDescription: "Visualiza y gestiona todas las órdenes de compra de tus clientes. Actualiza estados (pendiente, procesando, enviado, entregado), confirma pagos y gestiona devoluciones de forma sencilla.",
        photoGradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
        features: ["Ver órdenes por estado", "Confirmar pagos recibidos", "Actualizar estado de envío", "Gestionar cancelaciones", "Exportar historial"],
      },
      {
        href: "/dashboard/seller/reviews",
        label: "Reseñas",
        icon: "⭐",
        description: "Lee y responde reseñas de clientes",
        longDescription: "Mantén la reputación de tu tienda leyendo y respondiendo las reseñas que tus clientes dejan en tus productos. Construye confianza y mejora la experiencia de compra.",
        photoGradient: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
        features: ["Leer reseñas de clientes", "Responder a cada reseña", "Filtrar por estrellas", "Mejorar reputación de tienda"],
      },
    ],
  },
  {
    id: "ventas",
    label: "Ventas",
    icon: "💰",
    description: "Analiza tus ventas, visitantes y rendimiento",
    gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    photoGradient: "linear-gradient(160deg, #0c4a6e 0%, #0369a1 40%, #38bdf8 100%)",
    monoBg: "#f0f9ff",
    monoAccent: "#0369a1",
    monoText: "#075985",
    itemGradient: "linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)",
    items: [
      {
        href: "/dashboard/seller/orders",
        label: "Ventas",
        icon: "💰",
        description: "Historial completo de ventas",
        longDescription: "Accede al historial completo de todas tus ventas con estados detallados, montos, métodos de pago y seguimiento. Filtra por fecha, estado o cliente para encontrar lo que necesitas.",
        photoGradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
        features: ["Historial detallado de ventas", "Filtrar por fecha y estado", "Ver detalles de cada venta", "Exportar datos de ventas", "Seguimiento de pagos"],
      },
      {
        href: "/dashboard/seller/sold-products",
        label: "Productos vendidos",
        icon: "📊",
        description: "Ranking de productos más vendidos",
        longDescription: "Conoce cuáles son tus productos estrella. Analiza el ranking de ventas, tendencias de demanda y toma decisiones informadas sobre tu catálogo y estrategia de precios.",
        photoGradient: "linear-gradient(135deg, #34d399 0%, #10b981 100%)",
        features: ["Ranking de productos más vendidos", "Análisis de tendencias", "Datos de demanda por producto", "Toma decisiones informadas"],
      },
      {
        href: "/dashboard/seller/analytics",
        label: "Visitantes",
        icon: "🗺️",
        description: "Mapa interactivo de visitantes",
        longDescription: "Visualiza en un mapa interactivo la ubicación geográfica de los visitantes de tu tienda. Conoce de dónde vienen tus compradores potenciales y adapta tu estrategia de envío y marketing.",
        photoGradient: "linear-gradient(135deg, #818cf8 0%, #6366f1 100%)",
        features: ["Mapa interactivo con Leaflet", "Ubicación geográfica de visitantes", "Filtros por rango de fechas", "Estadísticas de tráfico por región"],
      },
    ],
  },
  {
    id: "marketing",
    label: "Marketing",
    icon: "📧",
    description: "Campañas de email y contacto con clientes",
    gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
    photoGradient: "linear-gradient(160deg, #064e3b 0%, #047857 40%, #34d399 100%)",
    monoBg: "#ecfdf5",
    monoAccent: "#047857",
    monoText: "#065f46",
    itemGradient: "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)",
    items: [
      {
        href: "/dashboard/seller/marketing",
        label: "Email Marketing",
        icon: "📧",
        description: "Campañas de email con plantillas",
        longDescription: "Crea y envía campañas de email marketing efectivas. Utiliza plantillas rápidas como 'Te extrañamos' o 'Ofertas de la semana', segmenta tus contactos por ciudad o actividad, y programa envíos automáticos.",
        photoGradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
        features: ["Plantillas rápidas predefinidas", "Filtros de contactos avanzados", "Programación de envíos", "Historial de campañas", "Vista previa antes de enviar", "Sistema de unsubscribe"],
      },
      {
        href: "/dashboard/admin/marketing",
        label: "Email Marketing Admin",
        icon: "📣",
        description: "Campañas a nivel de plataforma",
        longDescription: "Gestiona campañas de email marketing a nivel de plataforma para todos los usuarios. Envía promociones, actualizaciones y notificaciones importantes a toda la base de usuarios de Mi Tienda.",
        photoGradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
        features: ["Campañas masivas a usuarios", "Segmentación por rol", "Plantillas personalizadas", "Programación de envíos"],
        adminOnly: true,
      },
    ],
  },
  {
    id: "engagement",
    label: "Engagement",
    icon: "🎮",
    description: "Gamificación, ruleta y referidos",
    gradient: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
    photoGradient: "linear-gradient(160deg, #7c2d12 0%, #dc2626 40%, #fbbf24 100%)",
    monoBg: "#fffbeb",
    monoAccent: "#dc2626",
    monoText: "#991b1b",
    itemGradient: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
    items: [
      {
        href: "/spin-wheel",
        label: "Ruleta",
        icon: "🎰",
        description: "Ruleta de premios para clientes",
        longDescription: "Atrae compradores con una ruleta de premios interactiva. Ofrece descuentos porcentuales, descuentos fijos, envío gratis y más. Los clientes giran la ruleta y ganan cupones que pueden usar en su compra.",
        photoGradient: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
        features: ["Descuentos de 5% a 50%", "Envío gratis como premio", "Cupones con código único", "Cooldown de 24h entre giros", "Códigos integrados al checkout"],
      },
      {
        href: "/dashboard/referrals",
        label: "Invitar amigos",
        icon: "🎁",
        description: "Programa de referidos",
        longDescription: "Comparte tu código de referido con amigos y gana recompensas por cada nuevo usuario que se registre usando tu enlace. Una forma fácil de hacer crecer la comunidad.",
        photoGradient: "linear-gradient(135deg, #f472b6 0%, #ec4899 100%)",
        features: ["Código de referido único", "Recompensas por cada referido", "Historial de referidos", "Compartir por redes sociales"],
      },
      {
        href: "/dashboard/mascotas",
        label: "Mascotas",
        icon: "🎭",
        description: "Tu mascota virtual interactiva",
        longDescription: "Tu mascota virtual que gana monedas con cada compra, desbloquea accesorios exclusivos y sube de nivel. Una experiencia de gamificación que engancha a tus clientes a volver por más.",
        photoGradient: "linear-gradient(135deg, #c084fc 0%, #a855f7 100%)",
        features: ["Múltiples mascotas coleccionables", "Sistema de monedas y nivel", "Accesorios exclusivos", "Chat con IA integrada", "Mood y personalidad dinámica"],
      },
    ],
  },
  {
    id: "cuenta",
    label: "Mi Cuenta",
    icon: "👤",
    description: "Configura tu perfil, pagos y preferencias",
    gradient: "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
    photoGradient: "linear-gradient(160deg, #3b0764 0%, #7c3aed 40%, #c084fc 100%)",
    monoBg: "#faf5ff",
    monoAccent: "#7c3aed",
    monoText: "#6d28d9",
    itemGradient: "linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)",
    items: [
      {
        href: "/dashboard/profile/edit",
        label: "Editar Perfil",
        icon: "👤",
        description: "Actualiza tus datos personales",
        longDescription: "Mantén tu información personal actualizada. Cambia tu nombre, foto de perfil, dirección de envío, número de teléfono y otros datos importantes para tu cuenta.",
        photoGradient: "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
        features: ["Editar nombre y foto", "Actualizar dirección", "Cambiar contraseña", "Gestionar datos personales"],
      },
      {
        href: "/dashboard/payment-methods",
        label: "Formas de pago",
        icon: "💳",
        description: "Configura métodos de cobro",
        longDescription: "Configura los métodos de pago que aceptas en tu tienda: Yape, Plin, transferencia bancaria, depósito y más. Los clientes verán estas opciones al momento de comprar.",
        photoGradient: "linear-gradient(135deg, #818cf8 0%, #6366f1 100%)",
        features: ["Yape y Plin", "Transferencia bancaria", "Código QR personalizado", "Múltiples cuentas", "Instrucciones automáticas"],
      },
    ],
  },
  {
    id: "admin",
    label: "Admin",
    icon: "🔧",
    description: "Panel de administración (solo administradores)",
    gradient: "linear-gradient(135deg, #434343 0%, #1a1a2e 100%)",
    photoGradient: "linear-gradient(160deg, #0f172a 0%, #1e293b 40%, #475569 100%)",
    monoBg: "#f8fafc",
    monoAccent: "#1e293b",
    monoText: "#0f172a",
    itemGradient: "linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)",
    adminOnly: true,
    items: [
      {
        href: "/dashboard/admin/orders",
        label: "Órdenes",
        icon: "🔧",
        description: "Gestiona todas las órdenes de la plataforma",
        longDescription: "Administra todas las órdenes de la plataforma. Aprueba o rechaza pagos, gestiona estados de entrega y supervisa la actividad de compra y venta de todos los usuarios.",
        photoGradient: "linear-gradient(135deg, #434343 0%, #1a1a2e 100%)",
        features: ["Aprobar/rechazar pagos", "Gestionar estados de órdenes", "Supervisar actividad de compra", "Ver detalle por vendedor"],
      },
      {
        href: "/dashboard/admin/sellers",
        label: "Vendedores",
        icon: "👥",
        description: "Administra vendedores registrados",
        longDescription: "Gestiona todos los vendedores registrados en la plataforma. Revisa sus tiendas, estados de cuenta, niveles de verificación y toma acciones sobre cuentas problemáticas.",
        photoGradient: "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)",
        features: ["Listar todos los vendedores", "Ver tiendas asociadas", "Gestionar estados de cuenta", "Verificar vendedores"],
      },
      {
        href: "/dashboard/admin/plans",
        label: "Planes",
        icon: "💳",
        description: "Solicitudes de upgrade de vendedores",
        longDescription: "Revisa las solicitudes de mejora de plan de los vendedores. Cuando un vendedor paga para pasar de Free a Full, aprueba o rechaza su solicitud desde aquí.",
        photoGradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
        features: ["Ver solicitudes pendientes", "Aprobar/rechazar upgrades", "Historial de cambios de plan", "Gestionar pagos recibidos"],
      },
      {
        href: "/dashboard/admin/reports",
        label: "Reportes",
        icon: "📋",
        description: "Reportes de bugs y sugerencias",
        longDescription: "Gestiona los reportes enviados por los usuarios: bugs, sugerencias, quejas y consultas. Da seguimiento a cada reporte y resuelve los problemas de la plataforma.",
        photoGradient: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
        features: ["Ver reportes por categoría", "Filtrar por estado", "Agregar notas de administrador", "Dar seguimiento a cada caso"],
      },
      {
        href: "/dashboard/admin/analytics",
        label: "Conversión",
        icon: "📊",
        description: "Métricas avanzadas de conversión",
        longDescription: "Analiza el rendimiento completo de la plataforma con métricas avanzadas de conversión, tráfico, tasa de conversión de visitantes a compradores y tendencias de mercado.",
        photoGradient: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
        features: ["Tasa de conversión", "Análisis de tráfico", "Tendencias de mercado", "Métricas por región"],
      },
      {
        href: "/dashboard/admin/shipping",
        label: "Tarifas envío",
        icon: "🚚",
        description: "Configura costos de envío por zona",
        longDescription: "Configura las tarifas de envío por zona geográfica, transportistas y tipos de paquete. Define costos fijos, por peso o por distancia para cada región del país.",
        photoGradient: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)",
        features: ["Tarifas por zona geográfica", "Múltiples transportistas", "Costos por peso/distancia", "Zonas personalizadas"],
      },
      {
        href: "/dashboard/admin/coupons",
        label: "Cupones",
        icon: "🏷️",
        description: "Cupones de descuento globales",
        longDescription: "Crea y gestiona cupones de descuento que funcionan en toda la plataforma. Define porcentajes, montos fijos, validez y límites de uso por cupón.",
        photoGradient: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
        features: ["Cupones por porcentaje o monto fijo", "Fechas de validez", "Límite de uso por cupón", "Códigos personalizados"],
      },

    ],
  },
];

export default function DashboardCards({ userRole, isFull }) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [showImageUploader, setShowImageUploader] = useState(false);
  const [cardImages, setCardImages] = useState({});

  const isAdmin = userRole === "admin" || userRole === "ADMIN";

  const fetchCardImages = useCallback(() => {
    fetch("/api/admin/card-images", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const map = {};
          data.forEach((img) => {
            const key = img.itemHref ? `${img.cardId}::${img.itemHref}` : img.cardId;
            map[key] = img;
          });
          setCardImages(map);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchCardImages();
  }, [fetchCardImages]);

  const visibleCategories = useMemo(() => {
    return CATEGORIES.filter((cat) => {
      if (cat.adminOnly && !(userRole === "admin" || userRole === "ADMIN")) return false;
      if (cat.id === "ventas" && !isFull) return false;
      if (cat.id === "marketing" && !isFull) return false;
      return true;
    });
  }, [userRole, isFull]);

  function handleOpen(cat) {
    const filtered = {
      ...cat,
      items: cat.items.filter((item) => !item.adminOnly || (userRole === "admin" || userRole === "ADMIN")),
    };
    setActiveCategory(filtered);
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
            onClick={() => handleOpen(cat)}
            className="group relative overflow-hidden rounded-2xl text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-xl cursor-pointer border border-gray-100 bg-white"
          >
            {/* Photo area - desktop only */}
            <div
              className="hidden sm:block relative h-32 overflow-hidden"
              style={{ background: cat.photoGradient }}
            >
              {cardImages[cat.id]?.imageUrl ? (
                <img
                  src={cardImages[cat.id].imageUrl}
                  alt={cat.label}
                  className="absolute inset-0 w-full h-full object-contain"
                  style={{
                    transform: `translate(${cardImages[cat.id].offsetX || 0}%, ${cardImages[cat.id].offsetY || 0}%) scale(${cardImages[cat.id].scale || 1})`,
                  }}
                />
              ) : (
                <>
                  {/* Decorative shapes */}
                  <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-25" style={{ background: "rgba(255,255,255,0.3)" }} />
                  <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full opacity-15" style={{ background: "rgba(255,255,255,0.25)" }} />
                  <div className="absolute top-4 right-10 w-8 h-8 rounded-full opacity-30" style={{ background: "rgba(255,255,255,0.4)" }} />
                  <div className="absolute bottom-6 left-8 w-5 h-5 rounded-full opacity-20" style={{ background: "rgba(255,255,255,0.35)" }} />
                  {/* Grid pattern */}
                  <div className="absolute inset-0 opacity-[0.07]" style={{
                    backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
                    backgroundSize: "20px 20px"
                  }} />
                  {/* Icon */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-6xl drop-shadow-lg group-hover:scale-110 transition-transform duration-300">
                      {cat.icon}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Mobile: monochromatic header */}
            <div
              className="sm:hidden flex items-center gap-3 p-4"
              style={{ background: cat.monoBg }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                style={{ background: cat.monoAccent }}
              >
                <span className="filter brightness-0 invert">{cat.icon}</span>
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold" style={{ color: cat.monoText }}>{cat.label}</h3>
                <p className="text-xs mt-0.5" style={{ color: cat.monoAccent, opacity: 0.7 }}>{cat.description}</p>
              </div>
            </div>

            {/* Text area - desktop */}
            <div className="hidden sm:block p-4">
              <h3 className="text-base font-bold text-gray-900 mb-1">{cat.label}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{cat.description}</p>
              <div className="mt-3 flex items-center gap-1 text-gray-400 group-hover:text-green-600 transition-colors">
                <span className="text-xs font-medium">
                  {cat.items.length} {cat.items.length === 1 ? "sección" : "secciones"}
                </span>
                <svg className="w-3 h-3 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>

            {/* Mobile: sections count */}
            <div className="sm:hidden px-4 pb-3">
              <span className="text-xs font-medium" style={{ color: cat.monoAccent }}>
                {cat.items.length} {cat.items.length === 1 ? "sección" : "secciones"} →
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Admin: Personalizar imágenes */}
      {isAdmin && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => setShowImageUploader(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Personalizar imágenes
          </button>
        </div>
      )}

      <SlidePanel open={panelOpen} onClose={handleClose} category={activeCategory} cardImages={cardImages} />

      {showImageUploader && (
        <CardImageUploader onClose={() => { setShowImageUploader(false); fetchCardImages(); }} />
      )}
    </>
  );
}

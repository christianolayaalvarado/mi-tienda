export const MASCOTS = {
  box: {
    id: "box",
    name: "Cajita",
    description: "Una caja de cartón con cara simpática. Tu compañero fiel desde el inicio.",
    type: "default",
    unlockCondition: null,
    unlockLabel: "Disponible para todos",
    color: "#F59E0B",
    emoji: "📦",
  },
  coin: {
    id: "coin",
    name: "Monedita",
    description: "Una moneda sonriente que brilla con luz propia. Celebra tus compras.",
    type: "default",
    unlockCondition: null,
    unlockLabel: "Disponible para todos",
    color: "#EAB308",
    emoji: "🪙",
  },
  cart: {
    id: "cart",
    name: "Carrito",
    description: "Un carrito de compras con brazos y mucha energía. ¡Listo para cargar!",
    type: "default",
    unlockCondition: null,
    unlockLabel: "Disponible para todos",
    color: "#22C55E",
    emoji: "🛒",
  },
  coupon: {
    id: "coupon",
    name: "Cupón",
    description: "Un cupón con ojos y sombrero de copa. Siempre tiene un descuento.",
    type: "default",
    unlockCondition: null,
    unlockLabel: "Disponible para todos",
    color: "#A855F7",
    emoji: "🎟️",
  },
  bag: {
    id: "bag",
    name: "Bolsa",
    description: "Una bolsa de compras elegante. Para los que saben lo que quieren.",
    type: "default",
    unlockCondition: null,
    unlockLabel: "Disponible para todos",
    color: "#EC4899",
    emoji: "🛍️",
  },
};

export const MASCOT_LIST = Object.values(MASCOTS);
export const DEFAULT_MASCOT = "box";

export const ACHIEVEMENT_DEFINITIONS = {
  first_purchase: {
    type: "first_purchase",
    title: "Primera Compra",
    description: "Realizaste tu primera compra en la tienda",
    mascotReward: null,
    icon: "🎉",
  },
  "10_products_sold": {
    type: "10_products_sold",
    title: "Vendedor Activo",
    description: "Vendiste 10 productos",
    mascotReward: null,
    icon: "📦",
  },
  "5_reviews": {
    type: "5_reviews",
    title: "Crítico Constructivo",
    description: "Escribiste 5 reseñas",
    mascotReward: null,
    icon: "⭐",
  },
  spend_500: {
    type: "spend_500",
    title: "Gran Comprador",
    description: "Gastaste S/ 500 en total",
    mascotReward: null,
    icon: "💰",
  },
  top_seller: {
    type: "top_seller",
    title: "Top Seller",
    description: "Alcanzaste 50 ventas",
    mascotReward: null,
    icon: "🏆",
  },
  mega_seller: {
    type: "mega_seller",
    title: "Leyenda de Ventas",
    description: "Alcanzaste 100 ventas",
    mascotReward: null,
    icon: "👑",
  },
};

export function getMascotById(id) {
  return MASCOTS[id] || MASCOTS[DEFAULT_MASCOT];
}

export function getUnlockedMascots(achievements) {
  return MASCOT_LIST.map((m) => m.id);
}

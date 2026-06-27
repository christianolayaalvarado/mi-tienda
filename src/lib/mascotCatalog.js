export const MASCOTS = {
  box: {
    id: "box",
    name: "Cajita",
    description: "Una caja de cartón con cara simpática. Tu compañero fiel desde el inicio.",
    type: "default",
    unlockCondition: null,
    unlockLabel: "Disponible desde el inicio",
    color: "#F59E0B",
    emoji: "📦",
  },
  coin: {
    id: "coin",
    name: "Monedita",
    description: "Una moneda sonriente que brilla con luz propia. Celebra tus compras.",
    type: "premium",
    unlockCondition: "first_purchase",
    unlockLabel: "Realiza tu primera compra",
    color: "#EAB308",
    emoji: "🪙",
  },
  cart: {
    id: "cart",
    name: "Carrito",
    description: "Un carrito de compras con brazos y mucha energía. ¡Listo para cargar!",
    type: "premium",
    unlockCondition: "10_products_sold",
    unlockLabel: "Vende 10 productos",
    color: "#22C55E",
    emoji: "🛒",
  },
  coupon: {
    id: "coupon",
    name: "Cupón",
    description: "Un cupón con ojos y sombrero de copa. Siempre tiene un descuento.",
    type: "premium",
    unlockCondition: "5_reviews",
    unlockLabel: "Escribe 5 reseñas",
    color: "#A855F7",
    emoji: "🎟️",
  },
  bag: {
    id: "bag",
    description: "Una bolsa de compras elegante. Para los que saben lo que quieren.",
    name: "Bolsa",
    type: "premium",
    unlockCondition: "spend_500",
    unlockLabel: "Gasta S/ 500 en total",
    color: "#EC4899",
    emoji: "🛍️",
  },
  rocket: {
    id: "rocket",
    name: "Cohete",
    description: "Un cohete de envío rápido. ¡Entregas express con estilo!",
    type: "premium",
    unlockCondition: "top_seller",
    unlockLabel: "Alcanza 50 ventas",
    color: "#3B82F6",
    emoji: "🚀",
  },
  crown: {
    id: "crown",
    name: "Corona",
    description: "Una corona dorada para los reyes de la venta. ¡Máximo logro!",
    type: "premium",
    unlockCondition: "mega_seller",
    unlockLabel: "Alcanza 100 ventas",
    color: "#F59E0B",
    emoji: "👑",
  },
  ghost: {
    id: "ghost",
    name: "Fantasmita",
    description: "Un fantasma divertido que aparece de la nada. ¡Huevo de Pascua!",
    type: "easter_egg",
    unlockCondition: "easter_egg",
    unlockLabel: "???",
    color: "#6B7280",
    emoji: "👻",
  },
};

export const MASCOT_LIST = Object.values(MASCOTS);
export const DEFAULT_MASCOT = "box";

export const ACHIEVEMENT_DEFINITIONS = {
  first_purchase: {
    type: "first_purchase",
    title: "Primera Compra",
    description: "Realizaste tu primera compra en la tienda",
    mascotReward: "coin",
    icon: "🎉",
  },
  "10_products_sold": {
    type: "10_products_sold",
    title: "Vendedor Activo",
    description: "Vendiste 10 productos",
    mascotReward: "cart",
    icon: "📦",
  },
  "5_reviews": {
    type: "5_reviews",
    title: "Crítico Constructivo",
    description: "Escribiste 5 reseñas",
    mascotReward: "coupon",
    icon: "⭐",
  },
  spend_500: {
    type: "spend_500",
    title: "Gran Comprador",
    description: "Gastaste S/ 500 en total",
    mascotReward: "bag",
    icon: "💰",
  },
  top_seller: {
    type: "top_seller",
    title: "Top Seller",
    description: "Alcanzaste 50 ventas",
    mascotReward: "rocket",
    icon: "🏆",
  },
  mega_seller: {
    type: "mega_seller",
    title: "Leyenda de Ventas",
    description: "Alcanzaste 100 ventas",
    mascotReward: "crown",
    icon: "👑",
  },
  easter_egg: {
    type: "easter_egg",
    title: "¡Secreto Encontrado!",
    description: "Encontraste el huevo de pascua",
    mascotReward: "ghost",
    icon: "👻",
  },
};

export function getMascotById(id) {
  return MASCOTS[id] || MASCOTS[DEFAULT_MASCOT];
}

export function getUnlockedMascots(achievements) {
  const unlockedIds = [DEFAULT_MASCOT];
  achievements.forEach((a) => {
    const def = ACHIEVEMENT_DEFINITIONS[a.type];
    if (def?.mascotReward) {
      unlockedIds.push(def.mascotReward);
    }
  });
  return [...new Set(unlockedIds)];
}

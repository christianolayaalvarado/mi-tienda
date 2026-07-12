/**
 * Sistema de comisiones por tiers para vendedores
 * 
 * Tier 1 (0-3 meses):   0% comisión, envío gratis en top 20 productos
 * Tier 2 (4-6 meses):   5% comisión, envío gratis en productos >S/200
 * Tier 3 (7+ meses):    8% comisión, envío gratis en productos >S/500
 */

const COMMISSION_TIERS = {
  TIER_1: {
    name: "Nuevo",
    monthsRange: [0, 3],
    commissionRate: 0,
    freeShippingThreshold: 0, // todos los productos
    freeShippingCount: 20,    // top 20 productos
    benefits: [
      "0% de comisión por ventas",
      "Envío gratis en tus 20 mejores productos",
      "Destacado en la sección «Nuevos Vendedores»",
      "Soporte prioritario los primeros 30 días",
    ],
  },
  TIER_2: {
    name: "En crecimiento",
    monthsRange: [4, 6],
    commissionRate: 0.05,
    freeShippingThreshold: 200,
    freeShippingCount: 0,
    benefits: [
      "5% de comisión por ventas",
      "Envío gratis en productos mayores a S/200",
      "Estadísticas avanzadas de ventas",
      "Badge de vendedor verificado",
    ],
  },
  TIER_3: {
    name: "Establecido",
    monthsRange: [7, Infinity],
    commissionRate: 0.08,
    freeShippingThreshold: 500,
    freeShippingCount: 0,
    benefits: [
      "8% de comisión por ventas",
      "Envío gratis en productos mayores a S/500",
      "Acceso a herramientas de marketing",
      "Posibilidad de crear cupones de descuento",
      "Prioridad en búsquedas",
    ],
  },
};

/**
 * Obtiene el tier de un vendedor basado en su fecha de registro
 */
export function getSellerTier(createdAt) {
  const now = new Date();
  const created = new Date(createdAt);
  const monthsDiff =
    (now.getFullYear() - created.getFullYear()) * 12 +
    (now.getMonth() - created.getMonth());

  if (monthsDiff <= 3) return COMMISSION_TIERS.TIER_1;
  if (monthsDiff <= 6) return COMMISSION_TIERS.TIER_2;
  return COMMISSION_TIERS.TIER_3;
}

/**
 * Calcula la comisión para un monto dado
 */
export function calculateCommission(amount, createdAt) {
  const tier = getSellerTier(createdAt);
  return amount * tier.commissionRate;
}

/**
 * Verifica si un producto califica para envío gratis
 */
export function hasFreeShipping(productPrice, createdAt, productIndex) {
  const tier = getSellerTier(createdAt);

  if (tier.freeShippingThreshold === 0 && tier.freeShippingCount > 0) {
    return productIndex < tier.freeShippingCount;
  }

  return productPrice >= tier.freeShippingThreshold;
}

/**
 * Obtiene todos los tiers con info del vendedor
 */
export function getSellerTierInfo(createdAt) {
  const tier = getSellerTier(createdAt);
  const now = new Date();
  const created = new Date(createdAt);
  const monthsActive =
    (now.getFullYear() - created.getFullYear()) * 12 +
    (now.getMonth() - created.getMonth());

  const nextTier =
    tier === COMMISSION_TIERS.TIER_1
      ? COMMISSION_TIERS.TIER_2
      : tier === COMMISSION_TIERS.TIER_2
      ? COMMISSION_TIERS.TIER_3
      : null;

  const monthsToNext = nextTier
    ? Math.max(0, tier.monthsRange[1] + 1 - monthsActive)
    : 0;

  return {
    currentTier: tier,
    nextTier,
    monthsActive,
    monthsToNext,
    commissionRate: tier.commissionRate,
    commissionPct: `${(tier.commissionRate * 100).toFixed(0)}%`,
  };
}

export { COMMISSION_TIERS };

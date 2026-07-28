export const TUTORIAL_STORAGE_KEY = "mi_tienda_tutorial_completed";

export const buyerSteps = [
  {
    id: "welcome",
    title: "¡Bienvenido a Mi Tienda!",
    text: "Te guiaremos para que conozcas las principales funciones de la plataforma.",
    attachTo: { element: "[data-tutorial='logo']", on: "bottom" },
    buttons: [
      { text: "Saltar", action: "cancel", classes: "shepherd-button-secondary" },
      { text: "Empezar →", action: "next", classes: "shepherd-button-primary" },
    ],
  },
  {
    id: "search",
    title: "Busca productos",
    text: "Escribe lo que necesitas y encuentra los mejores productos de nuestros vendedores.",
    attachTo: { element: "[data-tutorial='search']", on: "bottom" },
    buttons: [
      { text: "← Atrás", action: "back", classes: "shepherd-button-secondary" },
      { text: "Siguiente →", action: "next", classes: "shepherd-button-primary" },
    ],
  },
  {
    id: "ofertas",
    title: "Ofertas especiales",
    text: "Revisa las ofertas del día con descuentos increíbles.",
    attachTo: { element: "[data-tutorial='ofertas']", on: "bottom" },
    buttons: [
      { text: "← Atrás", action: "back", classes: "shepherd-button-secondary" },
      { text: "Siguiente →", action: "next", classes: "shepherd-button-primary" },
    ],
  },
  {
    id: "cart",
    title: "Tu carrito de compras",
    text: "Agrega productos y revisa tu carrito antes de comprar.",
    attachTo: { element: "[data-tutorial='cart']", on: "bottom" },
    buttons: [
      { text: "← Atrás", action: "back", classes: "shepherd-button-secondary" },
      { text: "Siguiente →", action: "next", classes: "shepherd-button-primary" },
    ],
  },
  {
    id: "mascot",
    title: "Tu mascota virtual",
    text: "Interactúa con tu mascota, gana monedas y desbloquea accesorios. ¡Haz clic en ella!",
    attachTo: { element: "[data-tutorial='mascot']", on: "left" },
    buttons: [
      { text: "← Atrás", action: "back", classes: "shepherd-button-secondary" },
      { text: "¡Listo! 🎉", action: "complete", classes: "shepherd-button-primary" },
    ],
  },
];

export const sellerSteps = [
  {
    id: "dashboard",
    title: "Tu panel de vendedor",
    text: "Aquí tienes acceso rápido a todas las funciones de tu tienda.",
    attachTo: { element: "[data-tutorial='dashboard']", on: "bottom" },
    buttons: [
      { text: "Saltar", action: "cancel", classes: "shepherd-button-secondary" },
      { text: "Empezar →", action: "next", classes: "shepherd-button-primary" },
    ],
  },
  {
    id: "products",
    title: "Gestiona tus productos",
    text: "Agrega, edita y administra tu catálogo de productos.",
    attachTo: { element: "[data-tutorial='products']", on: "right" },
    buttons: [
      { text: "← Atrás", action: "back", classes: "shepherd-button-secondary" },
      { text: "Siguiente →", action: "next", classes: "shepherd-button-primary" },
    ],
  },
  {
    id: "orders",
    title: "Revisa tus pedidos",
    text: "Gestiona los pedidos de tus clientes y actualiza el estado de envío.",
    attachTo: { element: "[data-tutorial='orders']", on: "right" },
    buttons: [
      { text: "← Atrás", action: "back", classes: "shepherd-button-secondary" },
      { text: "¡Listo! 🎉", action: "complete", classes: "shepherd-button-primary" },
    ],
  },
];

export function isTutorialCompleted() {
  try {
    return localStorage.getItem(TUTORIAL_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function markTutorialCompleted() {
  try {
    localStorage.setItem(TUTORIAL_STORAGE_KEY, "true");
  } catch {}
}

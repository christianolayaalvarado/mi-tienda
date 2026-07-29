export const TUTORIAL_STORAGE_KEY = "mi_tienda_tutorial_completed";

export const buyerSteps = [
  {
    id: "welcome",
    title: "¡Bienvenido a Mi Tienda!",
    text: "Te guiaremos paso a paso para que aproveches al máximo la plataforma.",
    attachTo: { element: "[data-tutorial='logo']", on: "bottom" },
    buttons: [
      { text: "Saltar", action: "cancel", classes: "shepherd-button-secondary" },
      { text: "Empezar →", action: "next", classes: "shepherd-button-primary" },
    ],
  },
  {
    id: "search",
    title: "🔍 Busca productos",
    text: "Escribe lo que necesitas en la barra de búsqueda. Puedes buscar por nombre, categoría o palabra clave.",
    attachTo: { element: "[data-tutorial='search']", on: "bottom" },
    buttons: [
      { text: "← Atrás", action: "back", classes: "shepherd-button-secondary" },
      { text: "Siguiente →", action: "next", classes: "shepherd-button-primary" },
    ],
  },
  {
    id: "ofertas",
    title: "🔥 Ofertas del día",
    text: "Revisa la sección de ofertas para encontrar los mejores descuentos. ¡Nuevas ofertas cada día!",
    attachTo: { element: "[data-tutorial='ofertas']", on: "bottom" },
    buttons: [
      { text: "← Atrás", action: "back", classes: "shepherd-button-secondary" },
      { text: "Siguiente →", action: "next", classes: "shepherd-button-primary" },
    ],
  },
  {
    id: "cart",
    title: "🛒 Tu carrito",
    text: "Agrega productos haciendo clic en 'Ver detalle' y luego 'Agregar al carrito'. Revisa tu carrito antes de pagar.",
    attachTo: { element: "[data-tutorial='cart']", on: "bottom" },
    buttons: [
      { text: "← Atrás", action: "back", classes: "shepherd-button-secondary" },
      { text: "Siguiente →", action: "next", classes: "shepherd-button-primary" },
    ],
  },
  {
    id: "mascot",
    title: "🐾 Tu mascota virtual",
    text: "Haz clic en la mascota para interactuar. Gana monedas, compra accesorios y desbloquea premios.",
    attachTo: { element: "[data-tutorial='mascot']", on: "left" },
    buttons: [
      { text: "← Atrás", action: "back", classes: "shepherd-button-secondary" },
      { text: "¡Listo! 🎉", action: "complete", classes: "shepherd-button-primary" },
    ],
  },
];

export const sellerSteps = [
  {
    id: "welcome",
    title: "¡Bienvenido, vendedor!",
    text: "Tu panel de control tiene todo lo que necesitas para vender. Te mostramos las funciones principales.",
    attachTo: { element: "[data-tutorial='dashboard']", on: "bottom" },
    buttons: [
      { text: "Saltar", action: "cancel", classes: "shepherd-button-secondary" },
      { text: "Empezar →", action: "next", classes: "shepherd-button-primary" },
    ],
  },
  {
    id: "products",
    title: "📦 Tus productos",
    text: "Aquí agregas, editas y administras tu catálogo. Sube fotos atractivas y escribe buenas descripciones.",
    attachTo: { element: "[data-tutorial='products']", on: "right" },
    buttons: [
      { text: "← Atrás", action: "back", classes: "shepherd-button-secondary" },
      { text: "Siguiente →", action: "next", classes: "shepherd-button-primary" },
    ],
  },
  {
    id: "orders",
    title: "🧾 Pedidos",
    text: "Gestiona los pedidos de tus clientes. Actualiza el estado: pendiente → procesando → enviado → entregado.",
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

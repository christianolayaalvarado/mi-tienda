/**
 * Sistema de paletas de colores (5 colores por paleta)
 *
 * Roles de color:
 *   0: Background   — fondo principal de la página
 *   1: Surface      — tarjetas, modales, sidebar
 *   2: Accent       — botones, enlaces, highlights
 *   3: Text         — texto principal
 *   4: Muted        — texto secundario, bordes
 */

/* ── Paletas integradas (no se pueden editar) ─────────────────────── */

export const BUILTIN_PALETTES = [
  {
    id: "builtin-default",
    name: "Predeterminado",
    colors: ["#FFFFFF", "#F9FAFB", "#16A34A", "#171717", "#6B7280"],
    builtin: true,
  },
  {
    id: "builtin-pastel",
    name: "Pasteles",
    colors: ["#FDF4FF", "#FAF5FF", "#C084FC", "#581c87", "#7C3AED"],
    builtin: true,
  },
  {
    id: "builtin-grayscale",
    name: "Grises",
    colors: ["#FAFAFA", "#F5F5F5", "#525252", "#171717", "#525252"],
    builtin: true,
  },
  {
    id: "builtin-vibrant",
    name: "Encendidos",
    colors: ["#FFFBEB", "#FEF3C7", "#F43F5E", "#1C1917", "#78716C"],
    builtin: true,
  },
  {
    id: "builtin-dark",
    name: "Oscuro",
    colors: ["#0A0A0A", "#111827", "#22C55E", "#F3F4F6", "#9CA3AF"],
    builtin: true,
  },
  {
    id: "builtin-ocean",
    name: "Océano",
    colors: ["#F0F9FF", "#E0F2FE", "#0284C7", "#0C4A6E", "#7DD3FC"],
    builtin: true,
  },
];

/* ── Paletas premium (se desbloquean por ventas) ──────────────────── */

export const PREMIUM_PALETTES = [
  {
    id: "premium-amanecer",
    name: "Amanecer",
    colors: ["#FFFBEB", "#FEF3C7", "#F59E0B", "#78350F", "#D97706"],
    requiredSales: 10,
    icon: "🌅",
  },
  {
    id: "premium-bosque",
    name: "Bosque",
    colors: ["#F0FDF4", "#DCFCE7", "#16A34A", "#14532D", "#22C55E"],
    requiredSales: 50,
    icon: "🌲",
  },
  {
    id: "premium-atardecer",
    name: "Atardecer",
    colors: ["#FFF1F2", "#FFE4E6", "#F43F5E", "#881337", "#FB7185"],
    requiredSales: 100,
    icon: "🌇",
  },
  {
    id: "premium-lavanda",
    name: "Lavanda",
    colors: ["#FAF5FF", "#F3E8FF", "#9333EA", "#3B0764", "#A855F7"],
    requiredSales: 250,
    icon: "💜",
  },
  {
    id: "premium-tropical",
    name: "Tropical",
    colors: ["#ECFDF5", "#D1FAE5", "#10B981", "#064E3B", "#34D399"],
    requiredSales: 500,
    icon: "🌴",
  },
  {
    id: "premium-arcoiris",
    name: "Arcoíris",
    colors: ["#FEFCE8", "#E0F2FE", "#8B5CF6", "#1E1B4B", "#F59E0B"],
    requiredSales: 1000,
    icon: "🌈",
  },
];

/* ── Utilidades ────────────────────────────────────────────────────── */

/** Convierte los 5 colores de una paleta en variables CSS */
export function paletteToCSSVars(colors) {
  const [bg, surface, accent, text, muted] = colors;
  return {
    "--bg-primary": bg,
    "--bg-secondary": surface,
    "--bg-card": lighten(bg, 0.02),
    "--text-primary": text,
    "--text-secondary": muted,
    "--accent": accent,
    "--accent-hover": darken(accent, 0.1),
    "--accent-light": lighten(accent, 0.35),
    "--border": lighten(muted, 0.3),
    "--navbar-bg": bg,
    "--navbar-border": lighten(muted, 0.3),
    "--sidebar-bg": surface,
  };
}

/** Verifica si un color es oscuro (para invertir logo) */
export function isColorDark(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 128;
}

/** Determina si el logo debe invertirse según la paleta */
export function shouldInvertLogo(colors) {
  return isColorDark(colors[0]);
}

/* ── Helpers de color ─────────────────────────────────────────────── */

function hexToHSL(hex) {
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s;
  const l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(h, s, l) {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
}

function lighten(hex, amount) {
  const hsl = hexToHSL(hex);
  return hslToHex(hsl.h, hsl.s, Math.min(100, hsl.l + amount * 100));
}

function darken(hex, amount) {
  const hsl = hexToHSL(hex);
  return hslToHex(hsl.h, hsl.s, Math.max(0, hsl.l - amount * 100));
}

/** Valida que un string sea un hex válido */
export function isValidHex(str) {
  return /^#[0-9A-Fa-f]{6}$/.test(str);
}

/** Nombres de los roles de color para la UI */
export const COLOR_ROLE_LABELS = [
  "Fondo",
  "Superficie",
  "Acento",
  "Texto",
  "Secundario",
];

/** Descripción de qué afecta cada color en el navegador */
export const COLOR_ROLE_DESCRIPTIONS = [
  "Fondo general de la página, barras de navegación, cuerpo",
  "Tarjetas de producto,侧边栏, modales, encabezados de sección",
  "Botones principales, enlaces, badges, iconos interactivos, scroll activo",
  "Títulos, descripciones, precio, texto principal legible",
  "Textos secundarios, bordes, líneas divisorias, placeholders",
];

/** Mini-preview: muestra dónde se aplica cada color en un mockup */
export const COLOR_ROLE_AFFECTS = [
  "Página · Navbar · Footer",
  "Cards · Sidebar · Modals",
  "Botones · Links · Badges",
  "Títulos · Precio · Cuerpo",
  "Bordes · Texto muted · Divider",
];

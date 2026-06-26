"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LABEL_MAP = {
  dashboard: "Dashboard",
  products: "Productos",
  orders: "Órdenes",
  seller: "Vendedor",
  reviews: "Reseñas",
  shipping: "Envíos",
  "payment-methods": "Formas de pago",
  profile: "Perfil",
  edit: "Editar",
  cart: "Carrito",
  checkout: "Pago",
  store: "Tienda",
  product: "Producto",
  auth: "Autenticación",
  login: "Iniciar sesión",
  register: "Registrarse",
  "forgot-password": "Recuperar contraseña",
  "reset-password": "Restablecer contraseña",
  "confirm-code": "Confirmar código",
  chat: "Chat",
  new: "Nuevo",
  tienda: "Tienda",
};

function formatLabel(segment) {
  if (LABEL_MAP[segment]) return LABEL_MAP[segment];
  if (/^[a-f0-9]{24}$/i.test(segment)) return "Detalle";
  return segment
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function Breadcrumbs({ extraItems = [] }) {
  const pathname = usePathname();

  if (!pathname || pathname === "/") return null;

  const segments = pathname.split("/").filter(Boolean);

  // Skip "dashboard" prefix for cleaner breadcrumbs on dashboard pages
  const isDashboard = segments[0] === "dashboard";
  const crumbs = [];

  // Always start with Home
  crumbs.push({ label: "Inicio", href: "/" });

  let currentPath = "";
  const startIdx = isDashboard ? 1 : 0;

  for (let i = startIdx; i < segments.length; i++) {
    const seg = segments[i];
    currentPath += `/${seg}`;

    // Skip dynamic segments that are just IDs
    if (/^[a-f0-9]{24}$/i.test(seg) && i < segments.length - 1) {
      crumbs.push({ label: "Detalle", href: currentPath });
      continue;
    }

    crumbs.push({
      label: formatLabel(seg),
      href: i === segments.length - 1 ? null : currentPath, // last item = current page (no link)
    });
  }

  // Append any extra items (e.g., product name fetched server-side)
  for (const item of extraItems) {
    crumbs.push({ label: item.label, href: item.href || null });
  }

  if (crumbs.length <= 1) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center gap-1 text-sm text-gray-500 flex-wrap">
        {crumbs.map((crumb, idx) => {
          const isLast = idx === crumbs.length - 1;
          return (
            <li key={idx} className="flex items-center gap-1">
              {idx > 0 && (
                <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
              {isLast || !crumb.href ? (
                <span className="text-gray-700 font-medium truncate max-w-[150px] sm:max-w-[200px]">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="hover:text-green-600 transition truncate max-w-[150px] sm:max-w-[200px]"
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

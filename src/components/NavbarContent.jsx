// src/components/NavbarContent.jsx
"use client";

import Link from "next/link";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useSession } from "next-auth/react";

import SearchBox from "./navbar/SearchBox";
import CartPreview from "./navbar/CartPreview";
import UserMenu from "./navbar/UserMenu";
import CategoryScroller from "./navbar/CategoryScroller";
import {
  buildURL,
  safeParseLocalCart,
  readCartRaw,
  removeProductFromCart,
} from "./navbar/utils";

export default function NavbarContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  // useCart debe ser un hook estable exportado desde el contexto
  const cartCtx = useCart();
  const cartItems = useMemo(() => cartCtx?.cartItems ?? [], [cartCtx?.cartItems]);
  const subtotal = Number(cartCtx?.getTotal?.() ?? 0);

  const increaseQuantity = useCallback((id) => {
    const item = cartItems.find((i) => String(i.id ?? i.productId) === String(id));
    const currentQty = item ? Number(item.quantity || 0) : 0;
    cartCtx?.updateQuantity?.(id, item?.storeId ?? undefined, currentQty + 1);
  }, [cartCtx, cartItems]);

  const decreaseQuantity = useCallback((id) => {
    const item = cartItems.find((i) => String(i.id ?? i.productId) === String(id));
    if (!item) return;
    const newQty = (Number(item.quantity) || 0) - 1;
    if (newQty <= 0) cartCtx?.removeFromCart?.(id, item.storeId ?? undefined);
    else cartCtx?.updateQuantity?.(id, item.storeId ?? undefined, newQty);
  }, [cartCtx, cartItems]);

  const removeFromCart = useCallback(async (id, storeId) => {
    try {
      if (cartCtx && typeof cartCtx.removeFromCart === "function") {
        const result = cartCtx.removeFromCart(id, storeId);
        if (result && typeof result.then === "function") await result;
        try { window.dispatchEvent(new CustomEvent("cart:updated", { detail: { removedProductId: id, storeId } })); } catch {}
        try { window.dispatchEvent(new Event("storage")); } catch {}
        return result;
      }
      // fallback a util local
      return removeProductFromCart(id);
    } catch (err) {
      console.error("[NavbarContent] removeFromCart error:", err);
      throw err;
    }
  }, [cartCtx]);

  const currentSearch = searchParams?.get("search") || "";
  const currentCategory = searchParams?.get("category") || "";
  const currentSort = searchParams?.get("sort") || "";

  const [search, setSearch] = useState(currentSearch);
  const [cartOpen, setCartOpen] = useState(false);

  // mounted: diferir el setState para evitar render encadenado
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    let raf = 0;
    raf = typeof window !== "undefined" ? requestAnimationFrame(() => setMounted(true)) : 0;
    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Inicializar localRaw de forma perezosa para evitar setState en efecto
  const [localRaw, setLocalRaw] = useState(() => {
    try {
      const raw = typeof window !== "undefined" ? readCartRaw("mi_tienda_cart") : null;
      return Array.isArray(raw) ? raw : (typeof window !== "undefined" ? safeParseLocalCart("mi_tienda_cart") : []);
    } catch {
      return [];
    }
  });

  const cartRef = useRef(null);

  // Escuchar storage y evento personalizado cart:updated
  useEffect(() => {
    const onStorage = (e) => {
      if (e && e.key && e.key !== "mi_tienda_cart" && e.key !== "cart") return;
      try {
        const raw = readCartRaw("mi_tienda_cart");
        setLocalRaw(Array.isArray(raw) ? raw : safeParseLocalCart("mi_tienda_cart"));
      } catch {
        setLocalRaw([]);
      }
    };

    const onCartUpdated = () => {
      try {
        const raw = readCartRaw("mi_tienda_cart");
        setLocalRaw(Array.isArray(raw) ? raw : safeParseLocalCart("mi_tienda_cart"));
      } catch {
        setLocalRaw([]);
      }
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("cart:updated", onCartUpdated);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("cart:updated", onCartUpdated);
    };
  }, []);

  useEffect(() => {
    if (!mounted) return;
    router.push(buildURL({ searchVal: search, categoryVal: currentCategory, sortVal: currentSort, pageVal: "1" }));
  }, [search, currentCategory, currentSort, mounted, router]);

  const count = (Array.isArray(cartItems) && cartItems.length > 0)
    ? cartItems.reduce((s, it) => s + (Number(it.quantity) || 0), 0)
    : (localRaw || []).reduce((s, it) => s + (Number(it.quantity) || 0), 0);

  return (
    <nav className="w-full bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-6">
        <Link href="/" className="flex items-center">
          <img 
            src="/images/logo.png" 
            alt="Logo MiTienda" 
            className="h-10 w-auto navbar-logo"
          />
        </Link>

        <div className="flex-1">
          <SearchBox initial={currentSearch} onSearch={(val) => setSearch(val)} />
        </div>

        <button
          type="button"
          aria-label={`Abrir carrito, ${count} items`}
          onClick={() => setCartOpen((s) => !s)}
          className="text-sm font-medium cursor-pointer relative select-none"
          aria-haspopup="true"
          aria-expanded={cartOpen}
          ref={cartRef}
        >
          <span data-cart-icon className="relative inline-block">
            🛒 Carrito
            {mounted && count > 0 && (
              <span className="absolute -top-2 -right-3 bg-green-600 text-white text-xs px-2 py-0.5 rounded-full">
                {count}
              </span>
            )}
          </span>
        </button>

        <UserMenu session={session} />

        <CartPreview
          open={cartOpen}
          items={cartItems}
          subtotal={subtotal}
          onIncrease={increaseQuantity}
          onDecrease={decreaseQuantity}
          onRemove={removeFromCart}
          onClose={() => setCartOpen(false)}
          readLocalCart={() => localRaw}
        />
      </div>

      <CategoryScroller
        categories={["Climatizado","Cocina","Coleccionable","Decoración","Electrodoméstico","Fitness","Hogar","Iluminación","Muebles","Vidrio"]}
        currentCategory={currentCategory}
        onSelect={(cat) => {
          if (!mounted) return;
          router.push(buildURL({ categoryVal: cat, pageVal: "1" }));
        }}
      />
    </nav>
  );
}

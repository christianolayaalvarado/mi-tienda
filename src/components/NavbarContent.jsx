"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
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
  // Cart context (assume hook returns stable API)
  const cartCtx = useCart();
  const cartItems = useMemo(() => cartCtx?.cartItems ?? [], [cartCtx?.cartItems]);
  const subtotal = Number(typeof cartCtx?.getTotal === "function" ? cartCtx.getTotal() : 0);

  // Cart operations (memoized callbacks)
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
      return removeProductFromCart(id);
    } catch (err) {
      console.error("[NavbarContent] removeFromCart error:", err);
      throw err;
    }
  }, [cartCtx]);

  // Query params
  const currentSearch = searchParams?.get("search") || "";
  const currentCategory = searchParams?.get("category") || "";
  const currentSort = searchParams?.get("sort") || "";

  // Local UI state
  const [search, setSearch] = useState(currentSearch);
  const [cartOpen, setCartOpen] = useState(false);

  // mounted flag to avoid router.push during SSR/hydration
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // defer setMounted to next frame to avoid synchronous setState in effect
    if (typeof window === "undefined") return;
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => {
      cancelAnimationFrame(raf);
    };
  }, []);

  // localRaw cart (lazy init, guarded)
  const [localRaw, setLocalRaw] = useState(() => {
    try {
      if (typeof window === "undefined") return [];
      const raw = readCartRaw("mi_tienda_cart");
      return Array.isArray(raw) ? raw : safeParseLocalCart("mi_tienda_cart");
    } catch {
      return [];
    }
  });

  const cartRef = useRef(null);

  // Listen storage and custom events to keep localRaw in sync
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

    if (typeof window !== "undefined") {
      window.addEventListener("storage", onStorage);
      window.addEventListener("cart:updated", onCartUpdated);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", onStorage);
        window.removeEventListener("cart:updated", onCartUpdated);
      }
    };
  }, []);

  // Update URL only when user actively changes search/category/sort (not on mount)
  const prevSearchRef = useRef(currentSearch);
  const prevCategoryRef = useRef(currentCategory);
  const prevSortRef = useRef(currentSort);
  const initialMountDone = useRef(false);
  const isNavigatingRef = useRef(false);

  useEffect(() => {
    if (!mounted) return;
    if (!initialMountDone.current) {
      initialMountDone.current = true;
      prevSearchRef.current = currentSearch;
      prevCategoryRef.current = currentCategory;
      prevSortRef.current = currentSort;
      return;
    }

    // Skip if this render was caused by our own router.push
    if (isNavigatingRef.current) {
      isNavigatingRef.current = false;
      prevSearchRef.current = currentSearch;
      prevCategoryRef.current = currentCategory;
      prevSortRef.current = currentSort;
      return;
    }

    const searchChanged = search !== prevSearchRef.current;
    const categoryChanged = currentCategory !== prevCategoryRef.current;
    const sortChanged = currentSort !== prevSortRef.current;

    prevSearchRef.current = search;
    prevCategoryRef.current = currentCategory;
    prevSortRef.current = currentSort;

    if (searchChanged || categoryChanged || sortChanged) {
      isNavigatingRef.current = true;
      const url = buildURL({ searchVal: search, categoryVal: currentCategory, sortVal: currentSort, pageVal: "1" });
      router.push(url);
    }
  }, [search, currentCategory, currentSort, mounted, router]);

  // Count items (prefer cart context, fallback to local storage)
  const count = useMemo(() => {
    if (Array.isArray(cartItems) && cartItems.length > 0) {
      return cartItems.reduce((s, it) => s + (Number(it.quantity) || 0), 0);
    }
    return (Array.isArray(localRaw) ? localRaw : []).reduce((s, it) => s + (Number(it.quantity) || 0), 0);
  }, [cartItems, localRaw]);

  return (
    <>
    <nav className="w-full navbar-theme shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
        {/* Single flex row with wrap: search goes to line 2 on mobile */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-6">
          <Link href="/" className="flex items-center shrink-0 order-1">
            <img src="/images/logo.png" alt="Logo MiTienda" className="h-8 sm:h-10 w-auto navbar-logo animate-[fadeIn_0.5s_ease]" />
          </Link>

          {/* Actions: ml-auto on mobile pushes to right edge, sm:order-3 on desktop */}
          <div className="flex items-center gap-1 sm:gap-3 ml-auto sm:ml-0 order-2 sm:order-3">
            <Link
              href="/ofertas"
              className="flex items-center gap-1 text-red-600 hover:text-red-700 font-bold text-xs sm:text-sm shrink-0 min-h-[44px] px-1 sm:px-2"
            >
              <span className="text-base sm:text-lg">🔥</span>
              <span className="hidden sm:inline">Ofertas</span>
            </Link>
            <button
              type="button"
              aria-label={`Abrir carrito, ${count} items`}
              onClick={() => setCartOpen((s) => !s)}
              className="text-sm font-medium cursor-pointer relative select-none shrink-0 min-h-[44px] flex items-center justify-center px-1 sm:px-3"
              aria-haspopup="true"
              aria-expanded={cartOpen}
              ref={cartRef}
            >
              <span data-cart-icon className="relative inline-block">
                <span className="sm:hidden text-xl">🛒</span>
                <span className="hidden sm:inline">🛒 Carrito</span>
                {mounted && count > 0 && (
                  <span className="absolute -top-2 -right-3 bg-green-600 text-white text-xs px-2 py-0.5 rounded-full">{count}</span>
                )}
              </span>
            </button>
            <UserMenu />
          </div>

          {/* Search: order-3 on mobile (wraps to line 2), order-2 on desktop (between logo and actions) */}
          <div className="w-full sm:w-auto sm:flex-1 order-3 sm:order-2">
            <SearchBox initial={currentSearch} onSearch={(val) => setSearch(val)} />
          </div>
        </div>
      </div>

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

      <CategoryScroller
        categories={["Climatizado","Cocina","Coleccionable","Decoración","Electrodoméstico","Fitness","Hogar","Iluminación","Muebles","Vidrio"]}
        currentCategory={currentCategory}
        onSelect={(cat) => {
          if (!mounted) return;
          router.push(buildURL({ categoryVal: cat, pageVal: "1" }));
        }}
      />
      </nav>

    </>
  );
}

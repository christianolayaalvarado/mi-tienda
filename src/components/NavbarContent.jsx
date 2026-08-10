"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import SearchBox from "./navbar/SearchBox";
import CartPreview from "./navbar/CartPreview";
import UserMenu from "./navbar/UserMenu";
import ThemeToggle from "./navbar/ThemeToggle";
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
  const cartCtx = useCart();
  const cartItems = useMemo(() => cartCtx?.cartItems ?? [], [cartCtx?.cartItems]);
  const subtotal = Number(typeof cartCtx?.getTotal === "function" ? cartCtx.getTotal() : 0);

  // Mascot visibility (synced with ScrollMascot via localStorage + events)
  const [mascotHidden, setMascotHidden] = useState(() => {
    try { return typeof window !== "undefined" && localStorage.getItem("mascot_hidden") === "true"; } catch { return false; }
  });
  useEffect(() => {
    const onHidden = () => setMascotHidden(true);
    const onShow = () => setMascotHidden(false);
    window.addEventListener("mascot:hidden", onHidden);
    window.addEventListener("mascot:show", onShow);
    return () => {
      window.removeEventListener("mascot:hidden", onHidden);
      window.removeEventListener("mascot:show", onShow);
    };
  }, []);

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

  const currentSearch = searchParams?.get("search") || "";
  const currentCategory = searchParams?.get("category") || "";
  const currentSort = searchParams?.get("sort") || "";

  const [search, setSearch] = useState(currentSearch);
  const [cartOpen, setCartOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const [localRaw, setLocalRaw] = useState(() => {
    try {
      if (typeof window === "undefined") return [];
      const raw = readCartRaw("mi_tienda_cart");
      return Array.isArray(raw) ? raw : safeParseLocalCart("mi_tienda_cart");
    } catch { return []; }
  });

  const cartRef = useRef(null);

  useEffect(() => {
    const onStorage = (e) => {
      if (e && e.key && e.key !== "mi_tienda_cart" && e.key !== "cart") return;
      try {
        const raw = readCartRaw("mi_tienda_cart");
        setLocalRaw(Array.isArray(raw) ? raw : safeParseLocalCart("mi_tienda_cart"));
      } catch { setLocalRaw([]); }
    };
    const onCartUpdated = () => {
      try {
        const raw = readCartRaw("mi_tienda_cart");
        setLocalRaw(Array.isArray(raw) ? raw : safeParseLocalCart("mi_tienda_cart"));
      } catch { setLocalRaw([]); }
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
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <Link href="/" className="flex items-center shrink-0 order-1">
            <img src="/images/logo.png" alt="Logo MiTienda" className="h-8 sm:h-10 w-auto navbar-logo animate-[fadeIn_0.5s_ease]" />
          </Link>

          <div className="flex items-center gap-1 sm:gap-2 ml-auto sm:ml-0 order-2 sm:order-3 shrink-0">
            <UserMenu />

            {/* Mascot restore button - only when hidden */}
            {mascotHidden && (
              <div className="relative group">
                <button
                  type="button"
                  aria-label="Mostrar mascota"
                  onClick={() => {
                    try { localStorage.removeItem("mascot_hidden"); } catch {}
                    window.dispatchEvent(new Event("mascot:show"));
                  }}
                  className="w-8 h-8 rounded-full bg-green-100 hover:bg-green-200 flex items-center justify-center transition-all hover:scale-110 shrink-0"
                >
                  <img src="/images/mascots/box.png" alt="" className="w-5 h-5 object-contain" />
                </button>
                <span className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-1 bg-gray-800 text-white text-[10px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">Mostrar mascota</span>
              </div>
            )}

            {/* Cart icon only - tooltip on hover */}
            <div className="relative group">
              <button
                type="button"
                aria-label={`Abrir carrito, ${count} items`}
                onClick={() => setCartOpen((s) => !s)}
                className="text-sm font-medium cursor-pointer relative select-none shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-haspopup="true"
                aria-expanded={cartOpen}
                ref={cartRef}
              >
                <span data-cart-icon className="relative inline-block">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" /></svg>
                  {mounted && count > 0 && (
                    <span className="absolute -top-2 -right-3 bg-green-600 text-white text-xs px-2 py-0.5 rounded-full">{count}</span>
                  )}
                </span>
              </button>
              <span className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-1 bg-gray-800 text-white text-[10px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">Carrito</span>
            </div>

            <ThemeToggle />
          </div>

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

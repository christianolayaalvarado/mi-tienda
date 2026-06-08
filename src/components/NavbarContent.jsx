// components/NavbarContent.jsx
"use client";

import Link from "next/link";
import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useSession } from "next-auth/react";

import SearchBox from "./navbar/SearchBox";
import CartPreview from "./navbar/CartPreview";
import UserMenu from "./navbar/UserMenu";
import CategoryScroller from "./navbar/CategoryScroller";
import { buildURL, safeParseLocalCart } from "./navbar/utils";

export default function NavbarContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  // Cart context guard (no assumptions about provider presence)
  const cartCtx = typeof useCart === "function" ? useCart() : null;
  const cartItems = cartCtx?.cartItems ?? [];
  const subtotal = Number(cartCtx?.getTotal?.() ?? 0);
  const totalItems = Number(
    cartCtx?.getCount?.() ?? (cartItems || []).reduce((s, it) => s + (Number(it.quantity) || 0), 0)
  );

  const increaseQuantity = useCallback(
    (id) => {
      const item = cartItems.find((i) => String(i.id ?? i.productId) === String(id));
      const currentQty = item ? Number(item.quantity || 0) : 0;
      cartCtx?.updateQuantity?.(id, item?.storeId ?? undefined, currentQty + 1);
    },
    [cartCtx, cartItems]
  );

  const decreaseQuantity = useCallback(
    (id) => {
      const item = cartItems.find((i) => String(i.id ?? i.productId) === String(id));
      if (!item) return;
      const newQty = (Number(item.quantity) || 0) - 1;
      if (newQty <= 0) cartCtx?.removeFromCart?.(id, item.storeId ?? undefined);
      else cartCtx?.updateQuantity?.(id, item.storeId ?? undefined, newQty);
    },
    [cartCtx, cartItems]
  );

  const removeFromCart = useCallback((id, storeId) => cartCtx?.removeFromCart?.(id, storeId), [cartCtx]);

  // Search params (safe reads)
  const currentSearch = searchParams?.get("search") || "";
  const currentCategory = searchParams?.get("category") || "";
  const currentSort = searchParams?.get("sort") || "";

  // Local state
  const [search, setSearch] = useState(currentSearch);
  const [cartOpen, setCartOpen] = useState(false);
  const [animateCart, setAnimateCart] = useState(false);
  const [mounted, setMounted] = useState(false);

  // localRaw is read only on client to avoid SSR mismatch
  const [localRaw, setLocalRaw] = useState(null);

  const scrollRef = useRef(null);
  const cartRef = useRef(null);

  const categories = [
    "Climatizado","Cocina","Coleccionable","Decoración","Electrodoméstico","Fitness","Hogar","Iluminación","Muebles","Vidrio"
  ];

  // Mark mounted to avoid router.push or DOM-dependent behavior during SSR
  useEffect(() => {
    setMounted(true);
  }, []);

  // Hydrate local cart from localStorage only on client
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const parsed = safeParseLocalCart();
      setLocalRaw(parsed);
    } catch {
      setLocalRaw(null);
    }
  }, []);

  // Navigate when search changes, only after mount
  useEffect(() => {
    if (!mounted) return;
    // buildURL is pure and safe
    router.push(buildURL({ searchVal: search, categoryVal: currentCategory, sortVal: currentSort, pageVal: "1" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, currentCategory, currentSort, mounted]);

  // Animate cart badge when items change (only on client)
  useEffect(() => {
    if (!mounted || totalItems === 0) return;
    setAnimateCart(true);
    const t = setTimeout(() => setAnimateCart(false), 500);
    return () => clearTimeout(t);
  }, [totalItems, mounted]);

  // Close cart when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (cartRef.current && !cartRef.current.contains(event.target)) setCartOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close cart with Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") setCartOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <nav className="w-full bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-6">
        <Link href="/" className="text-2xl font-bold text-green-600">MiTienda</Link>

        <div className="flex-1">
          <SearchBox initial={currentSearch} onSearch={(val) => setSearch(val)} />
        </div>

        <button
          type="button"
          aria-label={`Abrir carrito, ${totalItems} items`}
          onClick={() => setCartOpen((s) => !s)}
          className="text-sm font-medium cursor-pointer relative select-none"
        >
          🛒 Carrito
          {mounted && totalItems > 0 && (
            <span
              className={`absolute -top-2 -right-3 bg-green-600 text-white text-xs px-2 py-0.5 rounded-full min-w-[20px] text-center ${animateCart ? "scale-125" : "scale-100"} transition-transform duration-300`}
              aria-hidden="true"
            >
              {totalItems}
            </span>
          )}
        </button>

        <UserMenu session={session} />

        <div ref={cartRef}>
          <CartPreview
            open={cartOpen}
            items={cartItems}
            subtotal={subtotal}
            onIncrease={increaseQuantity}
            onDecrease={decreaseQuantity}
            onRemove={removeFromCart}
            onClose={() => setCartOpen(false)}
            // pass the already-read localRaw (avoids reading localStorage during render)
            readLocalCart={() => localRaw}
          />
        </div>
      </div>

      <CategoryScroller
        categories={categories}
        currentCategory={currentCategory}
        onSelect={(cat) => {
          // only navigate on client
          if (!mounted) return;
          router.push(buildURL({ categoryVal: cat, pageVal: "1" }));
        }}
      />
    </nav>
  );
}

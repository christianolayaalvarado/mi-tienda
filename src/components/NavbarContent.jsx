// src/components/NavbarContent.jsx
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
import { fetchSession } from "@/lib/useSessionCheck";

export default function NavbarContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  const cartCtx = typeof useCart === "function" ? useCart() : null;
  const cartItems = cartCtx?.cartItems ?? [];
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

  const removeFromCart = useCallback((id, storeId) => {
    console.log("[NavbarContent] removeFromCart called:", { id, storeId });
    return cartCtx?.removeFromCart?.(id, storeId);
  }, [cartCtx]);

  const currentSearch = searchParams?.get("search") || "";
  const currentCategory = searchParams?.get("category") || "";
  const currentSort = searchParams?.get("sort") || "";

  const [search, setSearch] = useState(currentSearch);
  const [cartOpen, setCartOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [localRaw, setLocalRaw] = useState([]);

  const cartRef = useRef(null);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (typeof window === "undefined") return;
    try { setLocalRaw(safeParseLocalCart("mi_tienda_cart")); }
    catch { setLocalRaw([]); }
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
        <Link href="/" className="text-2xl font-bold text-green-600">MiTienda</Link>

        <div className="flex-1">
          <SearchBox initial={currentSearch} onSearch={(val) => setSearch(val)} />
        </div>

        <button
          type="button"
          aria-label={`Abrir carrito, ${count} items`}
          onClick={() => {
            console.log("[NavbarContent] Cart button clicked");
            setCartOpen((s) => !s);
          }}
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

"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { Trash2, User } from "lucide-react";
import { useSession, signOut } from "next-auth/react";

export default function NavbarContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const {
    cartItems = [],
    addToCart,
    removeFromCart,
    updateQuantity,
    getTotal,
    getCount,
    clearCart,
  } = useCart();

  const subtotal = Number(getTotal?.() ?? 0);
  const totalItems = Number(
    getCount?.() ?? (cartItems || []).reduce((s, it) => s + (Number(it.quantity) || 0), 0)
  );

  const currentSearch = searchParams.get("search") || "";
  const currentCategory = searchParams.get("category") || "";
  const currentSort = searchParams.get("sort") || "";

  const [search, setSearch] = useState(currentSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(currentSearch);
  const [cartOpen, setCartOpen] = useState(false);
  const [animateCart, setAnimateCart] = useState(false);
  const [mounted, setMounted] = useState(false);
  const scrollRef = useRef(null);
  const cartRef = useRef(null);

  const categories = [
    "Climatizado",
    "Cocina",
    "Coleccionable",
    "Decoración",
    "Electrodoméstico",
    "Fitness",
    "Hogar",
    "Iluminación",
    "Muebles",
    "Vidrio",
  ];

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!mounted) return;
    router.push(
      buildURL({
        searchVal: debouncedSearch,
        categoryVal: currentCategory,
        sortVal: currentSort,
        pageVal: "1",
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, currentCategory, currentSort, mounted]);

  useEffect(() => setSearch(currentSearch), [currentSearch]);
  useEffect(() => setMounted(true), []);

  function buildURL({
    searchVal = currentSearch,
    categoryVal = currentCategory,
    sortVal = currentSort,
    pageVal = "1",
  }) {
    const params = new URLSearchParams();
    if (searchVal) params.set("search", searchVal);
    if (categoryVal) params.set("category", categoryVal);
    if (sortVal) params.set("sort", sortVal);
    params.set("page", pageVal);
    return `/?${params.toString()}`;
  }

  useEffect(() => {
    if (!mounted || totalItems === 0) return;
    setAnimateCart(true);
    const timer = setTimeout(() => setAnimateCart(false), 500);
    return () => clearTimeout(timer);
  }, [totalItems, mounted]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (cartRef.current && !cartRef.current.contains(event.target)) setCartOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setCartOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const increaseQuantity = (productId) => {
    const item = (cartItems || []).find(
      (it) =>
        String(it.productId) === String(productId) ||
        String(it.id) === String(productId)
    );
    if (!item) return;
    const newQty = (Number(item.quantity) || 0) + 1;
    const idArg = item.id ?? item.productId;
    updateQuantity?.(idArg, item.storeId ?? undefined, newQty);
  };

  const decreaseQuantity = (productId) => {
    const item = (cartItems || []).find(
      (it) =>
        String(it.productId) === String(productId) ||
        String(it.id) === String(productId)
    );
    if (!item) return;
    const newQty = (Number(item.quantity) || 0) - 1;
    const idArg = item.id ?? item.productId;
    if (newQty <= 0) {
      removeFromCart?.(idArg, item.storeId ?? undefined);
    } else {
      updateQuantity?.(idArg, item.storeId ?? undefined, newQty);
    }
  };

  return (
    <nav className="w-full bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-6">
        <Link href="/" className="text-2xl font-bold text-green-600">
          MiTienda
        </Link>

        <div className="flex-1">
          <input
            type="text"
            placeholder="Buscar productos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 transition"
            aria-label="Buscar productos"
          />
        </div>

        <div
          data-cart-icon
          onClick={() => setCartOpen((s) => !s)}
          className="text-sm font-medium cursor-pointer relative select-none"
          role="button"
          aria-label={`Abrir carrito, ${totalItems} items`}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") setCartOpen((s) => !s);
          }}
        >
          🛒 Carrito
          {mounted && totalItems > 0 && (
            <span
              className={`absolute -top-2 -right-3 bg-green-600 text-white text-xs px-2 py-0.5 rounded-full min-w-[20px] text-center ${
                animateCart ? "scale-125" : "scale-100"
              } transition-transform duration-300`}
            >
              {totalItems}
            </span>
          )}
        </div>

        {!session ? (
          <div className="flex items-center gap-3 text-sm">
            <div onClick={() => router.push("/login")} className="cursor-pointer flex items-center gap-1 hover:text-green-600">
              <User size={18} />
              <span>Login</span>
            </div>
            <div onClick={() => router.push("/register")} className="cursor-pointer bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">
              Registrarse
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-600 text-xs">{session.user?.name || "Usuario"}</span>
              <div onClick={() => router.push("/dashboard")} className="cursor-pointer hover:text-green-600">
                Dashboard
              </div>
            </div>
            <button onClick={() => signOut({ callbackUrl: "/" })} className="text-red-500 hover:underline">
              Salir
            </button>
          </div>
        )}

        {cartOpen && (
          <div
            ref={cartRef}
            className="absolute right-0 top-10 w-80 bg-white shadow-xl border rounded-lg p-4 z-50"
            role="dialog"
            aria-label="Mini carrito"
          >
            <h3 className="font-semibold mb-3">Carrito</h3>
            {(!cartItems || cartItems.length === 0) && <p className="text-sm text-gray-500">El carrito está vacío</p>}

            {(cartItems || []).map((item) => {
              const imgSrc =
                item.image ||
                (Array.isArray(item.images) && item.images[0]) ||
                (item.product && Array.isArray(item.product.images) && item.product.images[0]) ||
                item.product?.image ||
                "/images/placeholder.png";

              // leer localStorage para usar nombre si el servidor no lo trae
const localRaw = (() => {
  try {
    const raw = localStorage.getItem("mi_tienda_cart");
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
})();

const findLocalName = (pid) => {
  if (!localRaw || !Array.isArray(localRaw)) return null;
  const found = localRaw.find((x) => String(x.productId ?? x.id) === String(pid));
  return found ? (found.name || found.title || null) : null;
};

const displayName =
  item.name ||
  item.title ||
  item.product?.title ||
  item.product?.name ||
  findLocalName(item.productId ?? item.id) ||
  "Producto";

              
              const key = item.id ?? `${item.productId}-${item.storeId ?? 0}`;

              return (
                <div
                  key={key}
                  className="flex items-center gap-3 py-2 border-b last:border-none hover:bg-gray-50 rounded-lg px-2 transition"
                >
                  <Link href={`/product/${item.productId}`} className="w-16 h-16 block">
                    <img
                      src={imgSrc}
                      alt={displayName}
                      width={64}
                      height={64}
                      className="object-cover rounded w-16 h-16"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "/images/placeholder.png";
                      }}
                    />
                  </Link>

                  <div className="flex-1 text-sm">
                    <Link href={`/product/${item.productId}`}>
                      <p className="truncate font-medium hover:text-green-600 cursor-pointer">{displayName}</p>
                    </Link>
                    <p className="text-gray-500 text-xs">
                      S/ {Number(item.price || 0).toFixed(2)} × {Number(item.quantity || 0)}
                    </p>

                    <div className="flex items-center gap-2 mt-1">
                      <button
                        onClick={() => decreaseQuantity(item.id ?? item.productId)}
                        className="px-2 bg-gray-200 rounded hover:bg-gray-300"
                        aria-label={`Disminuir cantidad de ${displayName}`}
                      >
                        −
                      </button>
                      <span className="text-xs w-6 text-center">{Number(item.quantity || 0)}</span>
                      <button
                        onClick={() => increaseQuantity(item.id ?? item.productId)}
                        disabled={Number(item.quantity || 0) >= (item.stock ?? Infinity)}
                        className="px-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-40"
                        aria-label={`Aumentar cantidad de ${displayName}`}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => removeFromCart?.(item.id ?? item.productId, item.storeId ?? undefined)}
                    className="p-1 rounded hover:bg-red-100 transition"
                    aria-label={`Eliminar ${displayName}`}
                  >
                    <Trash2 size={20} className="text-gray-500 hover:text-red-600" />
                  </button>
                </div>
              );
            })}

            {cartItems && cartItems.length > 0 && (
              <>
                <div className="flex justify-between items-center mt-3 pt-3 border-t text-sm font-semibold">
                  <span>Subtotal</span>
                  <span>S/ {(subtotal ?? 0).toFixed(2)}</span>
                </div>

                <button
                  onClick={() => {
                    setCartOpen(false);
                    router.push("/cart");
                  }}
                  className="mt-4 w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
                >
                  Ver carrito
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="border-t relative">
        <div ref={scrollRef} className="max-w-7xl mx-auto px-6 py-2 flex gap-6 text-sm overflow-x-auto whitespace-nowrap scrollbar-none">
          <button
            onClick={() => router.push(buildURL({ searchVal: "", categoryVal: "", pageVal: "1" }))}
            className={`font-semibold px-2 py-1 rounded ${currentCategory === "" ? "bg-green-600 text-white" : "hover:text-green-600"}`}
          >
            Todos
          </button>
          {categories.map((cat, index) => (
            <button
              key={index}
              onClick={() => router.push(buildURL({ categoryVal: cat, pageVal: "1" }))}
              className={`px-2 py-1 rounded ${currentCategory === cat ? "bg-green-600 text-white" : "hover:text-green-600"}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}

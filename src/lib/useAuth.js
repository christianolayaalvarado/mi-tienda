"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  setLogoutInProgress,
  isLogoutInProgress,
  markJustLoggedOut,
  isRecentLogout,
} from "@/utils/authFlags";

/**
 * useAuth hook
 * - fetchMe: obtiene /api/auth/me (incluye credentials)
 * - logout: llama /api/auth/logout, limpia estado cliente y notifica globalmente
 * - refresh: revalida la sesión llamando a fetchMe
 *
 * Notas:
 * - Emite eventos globales `auth:logout-request`, `auth:logout` y `auth:refresh`
 *   para que componentes (Navbar, RootLayoutClientInit, etc.) reaccionen inmediatamente.
 * - Usa banderas en localStorage y window para evitar races entre logout y refresh.
 */

export function useAuth({ initialFetch = true } = {}) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(initialFetch);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);
  const router = useRouter();

  const fetchMe = useCallback(async (opts = {}) => {
    const { signal } = opts;
    if (!mountedRef.current) return null;
    if (isLogoutInProgress() || isRecentLogout()) {
      // Evitar revalidar durante o justo después de logout
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/me", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        credentials: "include",
        signal,
      });

      if (!res.ok) {
        setUser(null);
        setError("No authenticated");
        return null;
      }

      const data = await res.json().catch(() => null);
      if (data?.ok && data.user) {
        setUser(data.user);
        setError(null);
        return data.user;
      }

      setUser(null);
      setError(data?.message || "No user");
      return null;
    } catch (err) {
      if (err && err.name === "AbortError") return null;
      console.error("useAuth fetchMe error:", err);
      setUser(null);
      setError("Network error");
      return null;
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  const logout = useCallback(async ({ redirectTo = "/login" } = {}) => {
    // Marcar inicio de logout y notificar a UI para ocultar elementos inmediatamente
    try {
      // Emitir evento de petición de logout para que la UI reaccione instantáneamente
      try { window.dispatchEvent(new Event("auth:logout-request")); } catch (e) { }
    } catch (e) { }

    setLogoutInProgress(true);
    markJustLoggedOut();

    try {
      // 1. Invalidar sesión NextAuth en servidor PRIMERO
      try {
        await signOut({ redirect: false });
      } catch (e) {
        console.warn("next-auth signOut error (non-fatal):", e);
      }

      // 2. Limpiar cookies en servidor vía nuestro endpoint (token, refreshToken, etc.)
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      }).catch((e) => console.warn("logout endpoint error", e));

      // Limpiar tokens locales
      try {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
      } catch (e) { }

      // Limpiar carrito en localStorage al cerrar sesión
      try {
        localStorage.removeItem("mi_tienda_cart");
        localStorage.removeItem("mi_tienda_cart_last_update");
      } catch (e) { }

      try {
        sessionStorage.clear();
      } catch (e) { }

      // Intento de limpiar cookies en cliente (suave)
      try {
        document.cookie.split(";").forEach((c) => {
          document.cookie = c.replace(/=.*/, "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/");
        });
      } catch (e) { }

      // Limpiar estado local
      setUser(null);
      setError(null);
      setLoading(false);

      // Notificar globalmente que el logout se completó
      try {
        window.dispatchEvent(new Event("auth:logout"));
        console.log("[useAuth] dispatched auth:logout event");
      } catch (e) {
        console.warn("[useAuth] dispatch auth:logout failed", e);
      }

      // Navegación final (hard replace para asegurar limpieza de SessionProvider)
      try {
        router.replace(redirectTo);
      } catch (e) {
        try { window.location.replace(redirectTo); } catch (err) { }
      }
    } catch (err) {
      console.error("logout error:", err);
      try { window.location.replace(redirectTo); } catch (e) { }
    } finally {
      // Mantener la bandera por un corto periodo para evitar races con refresh
      setTimeout(() => {
        try { setLogoutInProgress(false); } catch (e) { }
        try { window.__auth_logout_in_progress = false; } catch (e) { }
        try { localStorage.removeItem("auth:justLoggedOut"); } catch (e) { }
      }, 500);
    }
  }, [router]);

  const refresh = useCallback(async () => {
    if (isLogoutInProgress() || isRecentLogout()) {
      return { result: null, abort: () => { } };
    }
    if (typeof window !== "undefined" && window.__auth_refresh_in_progress) {
      return { result: null, abort: () => { } };
    }

    window.__auth_refresh_in_progress = true;
    const controller = new AbortController();
    try {
      const result = await fetchMe({ signal: controller.signal });
      // Notificar que hubo refresh exitoso para que otros componentes puedan revalidar
      try { window.dispatchEvent(new Event("auth:refresh")); } catch (e) { }
      return { result, abort: () => controller.abort() };
    } finally {
      window.__auth_refresh_in_progress = false;
    }
  }, [fetchMe]);

  useEffect(() => {
    mountedRef.current = true;
    if (initialFetch) {
      // Intentar revalidar al montar si corresponde
      refresh();
    }

    function onAuthRefresh() {
      refresh();
    }
    function onAuthLogoutRequest() {
      // Si otro componente inició logout, ocultar estado local inmediatamente
      setUser(null);
      setError(null);
      setLoading(false);
    }

    window.addEventListener("auth:refresh", onAuthRefresh);
    window.addEventListener("auth:logout-request", onAuthLogoutRequest);

    return () => {
      mountedRef.current = false;
      window.removeEventListener("auth:refresh", onAuthRefresh);
      window.removeEventListener("auth:logout-request", onAuthLogoutRequest);
    };
  }, [initialFetch, refresh]);

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    refresh,
    logout,
  };
}

export default useAuth;

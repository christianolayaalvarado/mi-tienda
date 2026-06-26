// src/context/AuthProvider.jsx
"use client";

import React, { createContext, useContext, useMemo } from "react";
import useAuth from "@/lib/useAuth";

const AuthContext = createContext(null);

export function AuthProvider({ children, initialFetch = true }) {
  const auth = useAuth({ initialFetch });

  const value = useMemo(() => ({
    user: auth.user,
    loading: auth.loading,
    error: auth.error,
    isAuthenticated: auth.isAuthenticated,
    refresh: auth.refresh,
    logout: auth.logout,
  }), [auth.user, auth.loading, auth.error, auth.isAuthenticated, auth.refresh, auth.logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used inside AuthProvider");
  return ctx;
}

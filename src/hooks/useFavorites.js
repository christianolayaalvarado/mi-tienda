"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthContext } from "@/context/AuthProvider";

export function useFavorites() {
  const { user } = useAuthContext();
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) {
      setFavoriteIds(new Set());
      setLoaded(true);
      return;
    }
    fetch("/api/favorites")
      .then((r) => r.json())
      .then((data) => {
        setFavoriteIds(new Set(data.ids || []));
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [user]);

  const toggle = useCallback(
    async (productId) => {
      if (!user) return false;

      const isFav = favoriteIds.has(productId);
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (isFav) next.delete(productId);
        else next.add(productId);
        return next;
      });

      try {
        if (isFav) {
          await fetch(`/api/favorites?productId=${productId}`, { method: "DELETE" });
        } else {
          await fetch("/api/favorites", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId }),
          });
        }
        return !isFav;
      } catch {
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          if (isFav) next.add(productId);
          else next.delete(productId);
          return next;
        });
        return false;
      }
    },
    [user, favoriteIds]
  );

  const isFavorited = useCallback(
    (productId) => favoriteIds.has(productId),
    [favoriteIds]
  );

  return { favoriteIds, toggle, isFavorited, loaded };
}

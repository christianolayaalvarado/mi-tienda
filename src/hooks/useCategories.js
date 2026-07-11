"use client";
// src/hooks/useCategories.js
import { useEffect, useState } from "react";

export default function useCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        if (mounted) setCategories(data || []);
      })
      .catch((err) => console.error("Error cargando categorías:", err))
      .finally(() => setLoading(false));
    return () => { mounted = false; };
  }, []);

  return { categories, loading };
}

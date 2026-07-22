"use client";

import { useEffect } from "react";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";

export default function ProductViewTracker({ product }) {
  const { addView } = useRecentlyViewed();

  useEffect(() => {
    if (!product?.id) return;

    // Local tracking (recently viewed)
    addView(product);

    // Server tracking (IP geolocation)
    fetch("/api/product-views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: String(product.id) }),
    }).catch(() => {});
  }, [product?.id]);

  return null;
}

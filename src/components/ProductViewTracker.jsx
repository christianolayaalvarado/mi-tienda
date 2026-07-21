"use client";

import { useEffect } from "react";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";

export default function ProductViewTracker({ product }) {
  const { addView } = useRecentlyViewed();

  useEffect(() => {
    if (product?.id) {
      addView(product);
    }
  }, [product?.id]);

  return null;
}

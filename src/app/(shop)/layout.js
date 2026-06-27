"use client";

import ShopFooter from "@/components/ShopFooter";

export default function ShopLayout({ children }) {
  return (
    <>
      {children}
      <ShopFooter />
    </>
  );
}

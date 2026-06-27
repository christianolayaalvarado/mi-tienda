"use client";

import ShopFooter from "@/components/ShopFooter";

export default function ScrollWrapper({ children }) {
  return (
    <>
      {children}
      <ShopFooter />
    </>
  );
}

"use client";

import HelpModal from "@/components/HelpModal";
import ShopFooter from "@/components/ShopFooter";

export default function ShopLayout({ children }) {
  return (
    <>
      {children}
      <ShopFooter />
      <HelpModal />
    </>
  );
}

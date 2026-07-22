"use client";

import { usePathname } from "next/navigation";
import ShopFooter from "@/components/ShopFooter";

export default function ScrollWrapper({ children }) {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith("/dashboard");

  return (
    <>
      {children}
      {!isDashboard && <ShopFooter />}
    </>
  );
}

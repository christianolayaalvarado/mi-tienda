"use client"

import { Suspense } from "react"
import NavbarContent from "./NavbarContent"

export default function Navbar() {
  return (
    <Suspense
      fallback={
        <div className="h-16 w-full bg-gray-100 animate-pulse">
          {/* Placeholder mientras carga NavbarContent */}
        </div>
      }
    >
      <NavbarContent />
    </Suspense>
  )
}
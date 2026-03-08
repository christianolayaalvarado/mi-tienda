"use client"

import Link from "next/link"
import { Suspense } from "react"
import NavbarContent from "./NavbarContent"

export default function Navbar() {
  return (
    <Suspense fallback={null}>
      <NavbarContent />
    </Suspense>
  )
}
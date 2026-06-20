"use client";

import React, { Suspense } from "react";
import dynamic from "next/dynamic";

const LoginClient = dynamic(() => import("@/components/LoginClient"), { ssr: false });

export default function LoginClientLoader() {
  return (
    <Suspense fallback={<div className="text-gray-600">Cargando formulario...</div>}>
      <LoginClient />
    </Suspense>
  );
}

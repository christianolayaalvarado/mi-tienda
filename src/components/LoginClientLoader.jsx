"use client";

import React, { Suspense } from "react";
import dynamic from "next/dynamic";

const LoginClient = dynamic(() => import("@/components/LoginClient"), { ssr: false });

function LoginSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md px-4">
        <div className="animate-pulse space-y-6">
          <div className="text-center space-y-2">
            <div className="h-8 bg-gray-200 rounded w-2/3 mx-auto" />
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto" />
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-8 space-y-5">
            {[1, 2].map((i) => (
              <div key={i} className="space-y-1">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-10 bg-gray-200 rounded" />
              </div>
            ))}
            <div className="h-12 bg-gray-200 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginClientLoader() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginClient />
    </Suspense>
  );
}

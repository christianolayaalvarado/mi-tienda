"use client";

import { useSearchParams } from "next/suspense";
import Link from "next/link";
import { Suspense } from "react";

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const success = searchParams.get("success") === "true";
  const error = searchParams.get("error") === "true";
  const email = searchParams.get("email");

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-8 text-center">
        {error ? (
          <>
            <div className="text-5xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
            <p className="text-gray-600 mb-6">
              Hubo un problema al procesar tu solicitud. Intenta de nuevo mas tarde.
            </p>
          </>
        ) : success ? (
          <>
            <div className="text-5xl mb-4">✅</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Desuscrito correctamente</h1>
            <p className="text-gray-600 mb-2">
              Tu correo <strong>{email}</strong> ha sido removido de nuestra lista de correos promocionales.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              No recibirás mas correos de marketing de Mi Tienda. Los correos transaccionales (confirmaciones de pedido, etc.) seguirán llegando.
            </p>
          </>
        ) : (
          <>
            <div className="text-5xl mb-4">📧</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Desuscribirse</h1>
            <p className="text-gray-600 mb-6">
              Si llegaste aquí por un correo de marketing, usa el link que se te envió para desuscribirte.
            </p>
          </>
        )}

        <Link
          href="/"
          className="inline-block px-6 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition"
        >
          Volver a Mi Tienda
        </Link>
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Cargando...</div>}>
      <UnsubscribeContent />
    </Suspense>
  );
}

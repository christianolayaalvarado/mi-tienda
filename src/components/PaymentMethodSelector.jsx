"use client";
import { useEffect, useState } from "react";
import Image from "next/image";

const PAYMENT_LABELS = {
  yape: "Yape",
  plin: "Plin",
  bank_transfer: "Transferencia bancaria",
};

function getMethodLabel(m) {
  const base = PAYMENT_LABELS[m.type] || m.type;
  if (m.type === "yape" && m.qrImageUrl) return `${base} (Código QR)`;
  if (m.type === "yape" && m.phone) return `${base} (Número de teléfono)`;
  if (m.type === "plin" && m.phone) return `${base} (Número de teléfono)`;
  return base;
}

export default function PaymentMethodSelector({ sellerId, onSelect }) {
  const [methods, setMethods] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [qrModal, setQrModal] = useState(null);

  useEffect(() => {
    if (!sellerId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const res = await fetch(`/api/sellers/${encodeURIComponent(sellerId)}/payment-methods`);
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(text || `HTTP ${res.status}`);
        }
        const data = await res.json();
        if (cancelled) return;
        const list = Array.isArray(data) ? data : Array.isArray(data.methods) ? data.methods : [];
        setMethods(list);
        const primary = list.find((m) => m.isPrimary);
        if (primary) {
          setSelected(primary.id);
          onSelect?.(primary.id);
        }
      } catch (err) {
        if (cancelled) return;
        console.error("Error fetching payment methods:", err);
        setError("No se pudieron cargar métodos de pago");
        setMethods([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sellerId, onSelect]);

  useEffect(() => {
    if (!sellerId) {
      Promise.resolve().then(() => {
        setMethods([]);
        setSelected(null);
      });
    }
  }, [sellerId]);

  if (loading) {
    return (
      <div className="space-y-2 animate-pulse">
        {[1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg">
            <div className="w-5 h-5 bg-gray-200 rounded-full" />
            <div className="h-4 bg-gray-200 rounded w-1/3" />
          </div>
        ))}
      </div>
    );
  }
  if (error) return <p className="text-sm text-red-600">{error}</p>;

  return (
    <>
      <div>
        {methods.length === 0 ? (
          <p className="text-sm text-gray-500">No hay métodos configurados</p>
        ) : (
          <ul className="space-y-3">
            {methods.map((m) => {
              const hasQR = m.type === "yape" && m.qrImageUrl;
              return (
                <li key={m.id} className="flex items-center justify-between gap-4 p-4 border rounded-lg hover:border-green-400 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <label className="flex items-center gap-3 cursor-pointer shrink-0">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={m.id}
                        checked={selected === m.id}
                        onChange={() => {
                          setSelected(m.id);
                          onSelect?.(m.id);
                        }}
                        className="w-4 h-4 text-green-600"
                      />
                      <span className="font-medium text-sm">{getMethodLabel(m)}</span>
                    </label>

                    <div className="text-sm text-gray-600 min-w-0">
                      {m.phone && <div>Tel: {m.phone}</div>}
                      {m.account && <div className="truncate">Cuenta: {m.account}</div>}
                      {m.cci && <div className="truncate">CCI: {m.cci}</div>}
                    </div>
                  </div>

                  {hasQR && (
                    <button
                      type="button"
                      onClick={() => setQrModal(m.qrImageUrl)}
                      className="shrink-0 w-20 h-20 relative rounded-lg overflow-hidden border border-gray-200 hover:border-green-500 transition-colors cursor-pointer"
                      title="Ver código QR"
                    >
                      <Image src={m.qrImageUrl} alt={`QR ${m.type}`} fill style={{ objectFit: "contain" }} />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {qrModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setQrModal(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setQrModal(null)}
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 text-lg"
            >
              ✕
            </button>
            <h3 className="font-semibold text-center mb-4">Código QR para Yapear</h3>
            <div className="relative w-64 h-64 mx-auto rounded-xl overflow-hidden border">
              <Image src={qrModal} alt="Código QR Yape" fill style={{ objectFit: "contain" }} />
            </div>
            <p className="text-sm text-gray-500 text-center mt-4">
              Abre tu app de Yape y escanea este código para pagar.
            </p>
          </div>
        </div>
      )}
    </>
  );
}

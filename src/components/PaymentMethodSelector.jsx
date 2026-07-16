"use client";
import { useEffect, useState } from "react";
import Image from "next/image";

const PAYMENT_LABELS = {
  yape: "Yape",
  plin: "Plin",
  bank_transfer: "Transferencia bancaria",
};

export default function PaymentMethodSelector({ sellerId, onSelect }) {
  const [methods, setMethods] = useState([]); // ya vacío por defecto
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Si no hay sellerId, no ejecutamos el efecto de fetch.
    // No llamamos setMethods([]) aquí para evitar setState sincrónico.
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

  // Si quieres limpiar methods cuando sellerId desaparece, hazlo fuera del efecto:
  useEffect(() => {
    if (!sellerId) {
      // limpieza asíncrona para evitar el warning
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
          <div key={i} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
            <div className="w-5 h-5 bg-gray-200 rounded-full" />
            <div className="h-4 bg-gray-200 rounded w-1/3" />
          </div>
        ))}
      </div>
    );
  }
  if (error) return <p className="text-sm text-red-600">{error}</p>;

  return (
    <div>
      {methods.length === 0 ? (
        <p className="text-sm text-gray-500">No hay métodos configurados</p>
      ) : (
        <ul className="space-y-3">
          {methods.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-4 p-2 border rounded">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={m.id}
                    checked={selected === m.id}
                    onChange={() => {
                      setSelected(m.id);
                      onSelect?.(m.id);
                    }}
                  />
                  <span className="font-medium">{PAYMENT_LABELS[m.type] || m.type}</span>
                </label>

                <div className="text-sm text-gray-600">
                  {m.phone && <div>Tel: {m.phone}</div>}
                  {m.account && <div>Cuenta: {m.account}</div>}
                  {m.cci && <div>CCI: {m.cci}</div>}
                </div>
              </div>

              {m.qrImageUrl && (
                // Uso de next/image para mejor LCP y optimización
                <div className="w-20 h-20 relative">
                  <Image src={m.qrImageUrl} alt={`QR ${m.type}`} fill style={{ objectFit: "contain" }} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

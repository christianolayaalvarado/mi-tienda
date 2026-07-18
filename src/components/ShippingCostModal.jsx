"use client";

import { useState, useEffect, useCallback } from "react";
import { ubigeo } from "@/data/ubigeo";

const TRUJILLO_DEPT = "13";
const TRUJILLO_PROV = "1301";
const ORIGIN_CITY = "Trujillo";

const STORAGE_KEY = "mi_tienda_shipping";

function getSavedShipping() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveShipping(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

export default function ShippingCostModal({ storeId, storeCity, onShippingChange }) {
  const [open, setOpen] = useState(false);
  const [deliveryType, setDeliveryType] = useState("local");
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedProv, setSelectedProv] = useState("");
  const [selectedDist, setSelectedDist] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const origin = storeCity || ORIGIN_CITY;

  const provincias = selectedDept
    ? ubigeo.find((d) => d.code === selectedDept)?.provinces || []
    : [];

  const distritos = selectedProv
    ? provincias.find((p) => p.code === selectedProv)?.districts || []
    : [];

  const getDeptName = (code) => ubigeo.find((d) => d.code === code)?.name || "";
  const getProvName = (deptCode, provCode) => {
    const dept = ubigeo.find((d) => d.code === deptCode);
    return dept?.provinces.find((p) => p.code === provCode)?.name || "";
  };

  useEffect(() => {
    const saved = getSavedShipping();
    if (saved) {
      setDeliveryType(saved.deliveryType || "local");
      setSelectedDept(saved.department || "");
      setSelectedProv(saved.province || "");
      setSelectedDist(saved.district || "");
      if (saved.result) setResult(saved.result);
      if (saved.deliveryType === "local" && onShippingChange) {
        onShippingChange({ cost: 0, included: true, label: "Incluido", destination: origin });
      }
    }
  }, []);

  const calculateShipping = useCallback(async (deptCode, provCode) => {
    if (!storeId || !deptCode) return;
    setLoading(true);
    try {
      const deptName = getDeptName(deptCode);
      const provName = getProvName(deptCode, provCode);
      const res = await fetch("/api/shipping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId,
          department: deptName,
          province: provName || undefined,
        }),
      });
      const data = await res.json();
      const destName = getProvName(deptCode, provCode) || getDeptName(deptCode);
      const hasCost = data.shippingCost > 0;
      const shippingResult = {
        cost: data.shippingCost || 0,
        included: false,
        estimatedDays: data.estimatedDays,
        message: data.message,
        destination: destName,
        label: hasCost ? `S/ ${data.shippingCost.toFixed(2)}` : "Pago en destino",
      };
      setResult(shippingResult);
      saveShipping({
        deliveryType: "external",
        department: deptCode,
        province: provCode || "",
        district: selectedDist,
        result: shippingResult,
      });
      if (onShippingChange) onShippingChange(shippingResult);
    } catch {
      setResult({ cost: 0, included: false, label: "No disponible", destination: getProvName(deptCode, provCode), message: "Error calculando envío" });
    } finally {
      setLoading(false);
    }
  }, [storeId, selectedDist, onShippingChange]);

  const handleDeliveryTypeChange = (type) => {
    setDeliveryType(type);
    setResult(null);
    setSelectedDept("");
    setSelectedProv("");
    setSelectedDist("");

    if (type === "local") {
      const localResult = { cost: 0, included: true, label: "Incluido", destination: origin };
      setResult(localResult);
      saveShipping({ deliveryType: "local", result: localResult });
      if (onShippingChange) onShippingChange(localResult);
    }
  };

  const handleDeptChange = (code) => {
    setSelectedDept(code);
    setSelectedProv("");
    setSelectedDist("");
    setResult(null);
  };

  const handleProvChange = (code) => {
    setSelectedProv(code);
    setSelectedDist("");
    if (selectedDept) calculateShipping(selectedDept, code);
  };

  const handleDistChange = (code) => {
    setSelectedDist(code);
  };

  const isTrujillo = deliveryType === "local" || (selectedDept === TRUJILLO_DEPT && selectedProv === TRUJILLO_PROV);

  const destinationName = isTrujillo
    ? origin
    : selectedProv
      ? getProvName(selectedDept, selectedProv)
      : selectedDept
        ? getDeptName(selectedDept)
        : "";

  const buttonLabel = isTrujillo
    ? `Envío: ${origin}`
    : destinationName
      ? `Envío: ${origin} → ${destinationName}`
      : "Calcular envío";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-green-600 hover:text-green-700 underline ml-1"
      >
        {buttonLabel}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-lg w-full mx-4 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500"
            >
              ✕
            </button>

            <h3 className="font-bold text-lg mb-1">Destino de envío</h3>
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
              <span className="font-medium text-gray-800">{origin}</span>
              <span>→</span>
              <span className={`font-medium ${isTrujillo ? "text-green-600" : destinationName ? "text-blue-600" : "text-gray-400"}`}>
                {isTrujillo ? origin : destinationName || "¿A dónde enviamos?"}
              </span>
            </div>

            {/* Selector de tipo */}
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => handleDeliveryTypeChange("local")}
                className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium border-2 transition ${
                  deliveryType === "local"
                    ? "border-green-500 bg-green-50 text-green-700"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                🏠 En {origin}
              </button>
              <button
                type="button"
                onClick={() => handleDeliveryTypeChange("external")}
                className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium border-2 transition ${
                  deliveryType === "external"
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                🚚 Fuera de {origin}
              </button>
            </div>

            {/* Mensaje local */}
            {isTrujillo && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-green-700 font-medium text-sm">✓ Envío incluido</p>
                <p className="text-green-600 text-xs mt-1">
                  El envío dentro de {origin} es gratuito. No hay costo adicional.
                </p>
              </div>
            )}

            {/* Selectores UBIGEO */}
            {deliveryType === "external" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Departamento *</label>
                  <select
                    value={selectedDept}
                    onChange={(e) => handleDeptChange(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value="">Seleccionar departamento</option>
                    {ubigeo.map((d) => (
                      <option key={d.code} value={d.code}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Provincia *</label>
                  <select
                    value={selectedProv}
                    onChange={(e) => handleProvChange(e.target.value)}
                    disabled={!selectedDept}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm disabled:bg-gray-100 disabled:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value="">{selectedDept ? "Seleccionar provincia" : "Primero elige departamento"}</option>
                    {provincias.map((p) => (
                      <option key={p.code} value={p.code}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Distrito</label>
                  <select
                    value={selectedDist}
                    onChange={(e) => handleDistChange(e.target.value)}
                    disabled={!selectedProv}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm disabled:bg-gray-100 disabled:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value="">{selectedProv ? "Seleccionar distrito (opcional)" : "Primero elige provincia"}</option>
                    {distritos.map((d) => (
                      <option key={d.code} value={d.code}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Resultado */}
            {loading && (
              <div className="mt-4 flex items-center gap-2 text-sm text-blue-600">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                Calculando costo de envío...
              </div>
            )}

            {!loading && result && (
              <div className={`mt-4 rounded-lg p-4 ${isTrujillo ? "bg-green-50 border border-green-200" : "bg-blue-50 border border-blue-200"}`}>
                <p className={`font-medium text-sm ${isTrujillo ? "text-green-700" : "text-blue-700"}`}>
                  {origin} → {result.destination || destinationName}
                </p>
                <p className={`text-lg font-bold mt-1 ${isTrujillo ? "text-green-600" : "text-blue-700"}`}>
                  {result.label}
                </p>
                {result.estimatedDays && (
                  <p className="text-xs text-gray-500 mt-1">
                    Tiempo estimado: {result.estimatedDays} día{result.estimatedDays > 1 ? "s" : ""}
                  </p>
                )}
                {result.message && !isTrujillo && (
                  <p className="text-xs text-gray-500 mt-1">{result.message}</p>
                )}
                {!isTrujillo && result.cost > 0 && (
                  <p className="text-xs text-orange-600 mt-2 font-medium">
                    Este costo NO se incluye en el total. Se paga en la agencia de envío al retirar.
                  </p>
                )}
                {!isTrujillo && result.cost === 0 && result.label === "Pago en destino" && (
                  <p className="text-xs text-orange-600 mt-2 font-medium">
                    El costo será asumido por el comprador al retirar el producto en la agencia de envío.
                  </p>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-4 w-full bg-green-600 text-white py-2.5 rounded-lg hover:bg-green-700 font-medium text-sm"
            >
              Confirmar destino
            </button>
          </div>
        </div>
      )}
    </>
  );
}

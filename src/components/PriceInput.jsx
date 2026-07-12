"use client";

import { useState, useEffect } from "react";

/**
 * PriceInput — Componente de precios con cálculo bidireccional
 * 
 * Permite al usuario ingresar:
 * - Precio inicial (originalPrice)
 * - % de descuento (discountPct)
 * - Precio final (price)
 * 
 * Si ingresa precio inicial + precio final → calcula % descuento
 * Si ingresa % descuento + precio final → calcula precio inicial
 */
export default function PriceInput({ originalPrice, discountPct, price, onChange }) {
  const [localOriginal, setLocalOriginal] = useState(originalPrice || "");
  const [localDiscount, setLocalDiscount] = useState(discountPct || "");
  const [localPrice, setLocalPrice] = useState(price || "");
  const [lastEdited, setLastEdited] = useState(null);

  // Sincronizar con props externas
  useEffect(() => {
    if (originalPrice !== undefined) setLocalOriginal(originalPrice || "");
  }, [originalPrice]);

  useEffect(() => {
    if (discountPct !== undefined) setLocalDiscount(discountPct || "");
  }, [discountPct]);

  useEffect(() => {
    if (price !== undefined) setLocalPrice(price || "");
  }, [price]);

  const calcDiscount = (original, final) => {
    if (!original || !final || original <= 0) return 0;
    return Math.round(((original - final) / original) * 100);
  };

  const calcOriginal = (final, discount) => {
    if (!final || !discount || discount <= 0) return 0;
    return final / (1 - discount / 100);
  };

  const handleOriginalChange = (val) => {
    const num = val === "" ? "" : parseFloat(val);
    setLocalOriginal(val);
    setLastEdited("original");

    const priceNum = parseFloat(localPrice);
    if (num && priceNum && priceNum > 0) {
      const disc = calcDiscount(num, priceNum);
      setLocalDiscount(disc);
      onChange?.({
        originalPrice: num,
        discountPct: disc,
        price: priceNum,
      });
    } else {
      onChange?.({
        originalPrice: num || null,
        discountPct: parseFloat(localDiscount) || null,
        price: priceNum || null,
      });
    }
  };

  const handleDiscountChange = (val) => {
    const num = val === "" ? "" : parseFloat(val);
    setLocalDiscount(val);
    setLastEdited("discount");

    const priceNum = parseFloat(localPrice);
    if (num && priceNum && priceNum > 0) {
      const orig = calcOriginal(priceNum, num);
      setLocalOriginal(orig > 0 ? Math.round(orig * 100) / 100 : "");
      onChange?.({
        originalPrice: orig > 0 ? Math.round(orig * 100) / 100 : null,
        discountPct: num,
        price: priceNum,
      });
    } else {
      onChange?.({
        originalPrice: parseFloat(localOriginal) || null,
        discountPct: num || null,
        price: priceNum || null,
      });
    }
  };

  const handlePriceChange = (val) => {
    const num = val === "" ? "" : parseFloat(val);
    setLocalPrice(val);
    setLastEdited("price");

    const origNum = parseFloat(localOriginal);
    const discNum = parseFloat(localDiscount);

    if (origNum && num && origNum > num) {
      const disc = calcDiscount(origNum, num);
      setLocalDiscount(disc);
      onChange?.({
        originalPrice: origNum,
        discountPct: disc,
        price: num,
      });
    } else if (discNum && num) {
      const orig = calcOriginal(num, discNum);
      setLocalOriginal(orig > 0 ? Math.round(orig * 100) / 100 : "");
      onChange?.({
        originalPrice: orig > 0 ? Math.round(orig * 100) / 100 : null,
        discountPct: discNum,
        price: num,
      });
    } else {
      onChange?.({
        originalPrice: origNum || null,
        discountPct: discNum || null,
        price: num || null,
      });
    }
  };

  return (
    <div className="space-y-3">
      {/* Precio Inicial */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Precio Inicial (S/)
          <span className="ml-2 text-xs text-gray-400 font-normal">opcional</span>
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">S/</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={localOriginal}
            onChange={(e) => handleOriginalChange(e.target.value)}
            placeholder="0.00"
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
          />
        </div>
      </div>

      {/* % Descuento + Precio Final en fila */}
      <div className="grid grid-cols-2 gap-3">
        {/* % Descuento */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            % Descuento
            <span className="ml-2 text-xs text-gray-400 font-normal">opcional</span>
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              max="90"
              step="1"
              value={localDiscount}
              onChange={(e) => handleDiscountChange(e.target.value)}
              placeholder="0"
              className="w-full pl-4 pr-8 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
          </div>
        </div>

        {/* Precio Final */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Precio Final (S/)
            <span className="ml-1 text-red-500 text-xs">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">S/</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={localPrice}
              onChange={(e) => handlePriceChange(e.target.value)}
              placeholder="0.00"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
            />
          </div>
        </div>
      </div>

      {/* Preview del ahorro */}
      {parseFloat(localOriginal) > 0 && parseFloat(localPrice) > 0 && parseFloat(localOriginal) > parseFloat(localPrice) && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 flex items-center gap-2">
          <span className="text-green-600 text-sm">✓</span>
          <span className="text-sm text-green-700">
            El cliente ahorra <strong>S/ {(parseFloat(localOriginal) - parseFloat(localPrice)).toFixed(2)}</strong>
            {parseFloat(localDiscount) > 0 && (
              <span className="ml-1">({localDiscount}% dto.)</span>
            )}
          </span>
        </div>
      )}
    </div>
  );
}

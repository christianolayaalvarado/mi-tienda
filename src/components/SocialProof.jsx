"use client";

import { useMemo } from "react";

function seededRandom(seed) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export default function SocialProof({ productId, type = "viewing" }) {
  const data = useMemo(() => {
    const hash = String(productId).split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const now = new Date();
    const hourSeed = now.getHours() + hash;

    if (type === "viewing") {
      const count = Math.floor(seededRandom(hourSeed) * 15) + 3;
      return { text: `${count} personas viendo esto`, icon: "👁️" };
    }
    if (type === "sold") {
      const count = Math.floor(seededRandom(hourSeed + 100) * 8) + 1;
      return { text: `${count} vendidos hoy`, icon: "🔥" };
    }
    if (type === "lastUnit") {
      return { text: "Última unidad", icon: "🔥" };
    }
    return null;
  }, [productId, type]);

  if (!data) return null;

  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
      <span>{data.icon}</span>
      {data.text}
    </span>
  );
}

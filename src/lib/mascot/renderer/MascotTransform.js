"use client";

import { useMemo } from "react";

export default function MascotTransform({
  transform = {},
  origin = "center",
  children
}) {

  const style = useMemo(() => {

    const tx = transform.translateX ?? 0;
    const ty = transform.translateY ?? 0;

    const rotation = transform.rotation ?? 0;

    const scale = transform.scale ?? 1;

    const scaleX = transform.scaleX ?? scale;
    const scaleY = transform.scaleY ?? scale;

    const skewX = transform.skewX ?? 0;
    const skewY = transform.skewY ?? 0;

    return {

      transformBox: "fill-box",

      transformOrigin: origin,

      transform: `
translate(${tx}px,${ty}px)
rotate(${rotation}deg)
scale(${scaleX},${scaleY})
skew(${skewX}deg,${skewY}deg)
`
        .replace(/\s+/g, " ")
        .trim(),

      willChange: "transform"
    };

  }, [transform, origin]);

  return (

    <g style={style}>

      {children}

    </g>

  );

}
"use client";

import { useMemo } from "react";

/**
 * =========================================================
 * MASCOT ENGINE v2.8
 * Module: MascotTransform
 * ---------------------------------------------------------
 * Aplica las transformaciones calculadas por el
 * RenderPipeline sobre cualquier grupo del SVG.
 * =========================================================
 */

export default function MascotTransform({
  transform = {},
  origin = "center",
  opacity = 1,
  visible = true,
  children,
}) {
  const style = useMemo(() => {
    const translateX = transform.translateX ?? 0;
    const translateY = transform.translateY ?? 0;

    const rotation = transform.rotation ?? 0;

    const scale = transform.scale ?? 1;

    const scaleX = transform.scaleX ?? scale;
    const scaleY = transform.scaleY ?? scale;

    const skewX = transform.skewX ?? 0;
    const skewY = transform.skewY ?? 0;

    const brightness = transform.brightness ?? 1;
    const saturation = transform.saturation ?? 1;
    const blur = transform.blur ?? 0;

    return {
      transformBox: "fill-box",
      transformOrigin: origin,

      transform: [
        `translate(${translateX}px, ${translateY}px)`,
        `rotate(${rotation}deg)`,
        `scale(${scaleX}, ${scaleY})`,
        `skew(${skewX}deg, ${skewY}deg)`,
      ].join(" "),

      filter: [
        `brightness(${brightness})`,
        `saturate(${saturation})`,
        `blur(${blur}px)`,
      ].join(" "),

      opacity,

      visibility: visible ? "visible" : "hidden",

      willChange: "transform, opacity, filter",
    };
  }, [transform, origin, opacity, visible]);

  return <g style={style}>{children}</g>;
}
"use client";

import useRenderState from "@/hooks/useRenderState";

export default function MascotAnimationController({
  children,
}) {
  const renderState = useRenderState();

  if (!renderState) {
    return children;
  }

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",

        transform: renderState.transformCSS,

        filter: renderState.filterCSS,

        opacity: renderState.opacity ?? 1,

        willChange: "transform, filter",
      }}
    >
      {children}
    </div>
  );
}
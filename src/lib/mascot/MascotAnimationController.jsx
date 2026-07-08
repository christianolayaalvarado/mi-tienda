"use client";

import useRenderState from "./hooks/useRenderState";

export default function MascotAnimationController({
  children,
  className = "",
  style = {},
}) {
  const renderState = useRenderState();

  if (!renderState) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }

  return children(renderState);
}
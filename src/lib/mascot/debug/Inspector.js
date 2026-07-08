"use client";

import { useEffect, useState } from "react";

import mascotEngine from "../MascotEngine";
import mascotLoop from "../core/MascotLoop";

/**
 * =========================================================
 * MASCOT ENGINE v2.2
 * Module: Inspector
 * ---------------------------------------------------------
 * Inspector interno del RenderState.
 *
 * Permite visualizar exactamente qué está produciendo
 * el RenderPipeline en cada frame.
 * =========================================================
 */

export default function Inspector() {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const unsubscribe = mascotLoop.subscribe(() => {
      forceUpdate((v) => v + 1);
    });

    return unsubscribe;
  }, []);

  const renderState = mascotEngine.getRenderState();

  if (!renderState) return null;

  const global = renderState.transform?.global ?? {};
  const filters = renderState.filters ?? {};
  const animation = renderState.animation ?? {};

  return (
    <div
      style={{
        position: "fixed",
        left: 15,
        bottom: 15,
        width: 360,
        maxHeight: "70vh",
        overflowY: "auto",
        zIndex: 999998,
        padding: 14,
        borderRadius: 10,
        background: "rgba(15,15,15,.9)",
        color: "#8cff8c",
        fontFamily: "monospace",
        fontSize: 12,
        lineHeight: 1.55,
        backdropFilter: "blur(10px)",
      }}
    >
      <div
        style={{
          fontWeight: "bold",
          marginBottom: 12,
          color: "#ffffff",
        }}
      >
        Render Inspector
      </div>

      <hr />

      <p><strong>Translate X:</strong> {Number(global.translateX ?? 0).toFixed(2)}</p>

      <p><strong>Translate Y:</strong> {Number(global.translateY ?? 0).toFixed(2)}</p>

      <p><strong>Scale:</strong> {Number(global.scale ?? 1).toFixed(4)}</p>

      <p><strong>Rotation:</strong> {Number(global.rotation ?? 0).toFixed(2)}°</p>

      <hr />

      <p><strong>Opacity:</strong> {Number(renderState.opacity ?? 1).toFixed(2)}</p>

      <p><strong>View:</strong> {renderState.view}</p>

      <hr />

      <p><strong>Brightness:</strong> {Number(filters.brightness ?? 1).toFixed(2)}</p>

      <p><strong>Saturation:</strong> {Number(filters.saturation ?? 1).toFixed(2)}</p>

      <p><strong>Blur:</strong> {Number(filters.blur ?? 0).toFixed(2)}</p>

      <p><strong>Hue:</strong> {Number(filters.hue ?? 0).toFixed(2)}</p>

      <hr />

      <div style={{ marginBottom: 6 }}>
        <strong>Animation</strong>
      </div>

      <pre
        style={{
          whiteSpace: "pre-wrap",
          margin: 0,
          color: "#7fdcff",
        }}
      >
        {JSON.stringify(animation, null, 2)}
      </pre>

      <hr />

      <div style={{ marginBottom: 6 }}>
        <strong>Body Parts</strong>
      </div>

      <pre
        style={{
          whiteSpace: "pre-wrap",
          margin: 0,
          color: "#ffd37f",
        }}
      >
        {JSON.stringify(renderState.transform?.parts ?? {}, null, 2)}
      </pre>
    </div>
  );
}
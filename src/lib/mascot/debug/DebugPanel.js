"use client";

import { useEffect, useState } from "react";

import mascotEngine from "../MascotEngine";
import mascotLoop from "../core/MascotLoop";

/**
 * =========================================================
 * MASCOT ENGINE v2.2
 * Module: DebugPanel
 * ---------------------------------------------------------
 * Panel de depuración en tiempo real del Character Engine.
 * =========================================================
 */

export default function DebugPanel() {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const unsubscribe = mascotLoop.subscribe(() => {
      forceUpdate((v) => v + 1);
    });

    return unsubscribe;
  }, []);

  const state = mascotEngine.getState();
  const pipeline = mascotEngine.getPipeline();

  if (!state) return null;

  return (
    <div
      style={{
        position: "fixed",
        right: 15,
        bottom: 15,
        zIndex: 999999,
        width: 310,
        padding: 14,
        borderRadius: 10,
        background: "rgba(20,20,20,.88)",
        color: "#fff",
        fontSize: 12,
        fontFamily: "monospace",
        backdropFilter: "blur(10px)",
        lineHeight: 1.6,
      }}
    >
      <div
        style={{
          fontWeight: "bold",
          marginBottom: 10,
          fontSize: 13,
        }}
      >
        Mascot Engine Debug
      </div>

      <hr />

      <p>
        <strong>Engine:</strong>{" "}
        {mascotEngine.isInitialized() ? "Running" : "Stopped"}
      </p>

      <p>
        <strong>Loop:</strong>{" "}
        {mascotLoop.isRunning()
          ? mascotLoop.isPaused()
            ? "Paused"
            : "Running"
          : "Stopped"}
      </p>

      <p>
        <strong>Subscribers:</strong>{" "}
        {mascotLoop.getSubscriberCount()}
      </p>

      <hr />

      <p>
        <strong>Emotion:</strong> {state.emotion}
      </p>

      <p>
        <strong>Direction:</strong> {state.direction}
      </p>

      <p>
        <strong>Visible:</strong> {String(state.visible)}
      </p>

      <p>
        <strong>Enabled:</strong> {String(state.enabled)}
      </p>

      <hr />

      <p>
        <strong>Idle:</strong>{" "}
        {state.idleTime.toFixed(2)} s
      </p>

      <p>
        <strong>Last Interaction:</strong>{" "}
        {Math.round((Date.now() - state.lastInteraction) / 1000)} s ago
      </p>

      <hr />

      <p>
        <strong>Position:</strong>{" "}
        ({state.position.x.toFixed(2)}, {state.position.y.toFixed(2)})
      </p>

      <p>
        <strong>Velocity:</strong>{" "}
        ({state.velocity.x.toFixed(2)}, {state.velocity.y.toFixed(2)})
      </p>

      <p>
        <strong>Rotation:</strong>{" "}
        {state.rotation.toFixed(2)}
      </p>

      <p>
        <strong>Scale:</strong>{" "}
        {state.scale.toFixed(3)}
      </p>

      <hr />

      <p>
        <strong>Cursor:</strong>{" "}
        ({state.cursor.x.toFixed(0)}, {state.cursor.y.toFixed(0)})
      </p>

      <p>
        <strong>Looking:</strong>{" "}
        {String(state.lookingAtCursor)}
      </p>

      <hr />

      <p>
        <strong>Current Event:</strong>{" "}
        {state.currentEvent ?? "-"}
      </p>

      <p>
        <strong>Layers:</strong>{" "}
        {pipeline?.getLayers()?.length ?? 0}
      </p>
    </div>
  );
}
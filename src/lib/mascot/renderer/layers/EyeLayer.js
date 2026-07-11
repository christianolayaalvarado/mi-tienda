"use client";
// =========================================================
// MASCOT ENGINE v2.3
// Module: EyeLayer
// ---------------------------------------------------------
// Controla el movimiento de los ojos.
//
// • Sigue el cursor
// • Reacciona a emociones
// • Aplica suavizado
// =========================================================

import { MascotEmotion } from "../../MascotEmotion";

export class EyeLayer {
  constructor() {
    this.maxOffset = 4;
    this.smoothing = 0.18;

    this.currentX = 0;
    this.currentY = 0;
  }

  apply(renderState = {}, mascotState = {}) {
    const parts = renderState.transform?.parts ?? {};

    const cursor = mascotState.cursor ?? {
      x: 0,
      y: 0,
    };

    const viewportWidth =
      typeof window !== "undefined"
        ? window.innerWidth
        : 1;

    const viewportHeight =
      typeof window !== "undefined"
        ? window.innerHeight
        : 1;

    let normalizedX =
      (cursor.x / viewportWidth) * 2 - 1;

    let normalizedY =
      (cursor.y / viewportHeight) * 2 - 1;

    normalizedX = Math.max(-1, Math.min(1, normalizedX));
    normalizedY = Math.max(-1, Math.min(1, normalizedY));

    let targetX = normalizedX * this.maxOffset;
    let targetY = normalizedY * this.maxOffset;

    switch (mascotState.emotion) {
      case MascotEmotion.THINKING:
        targetX *= 0.5;
        targetY -= 1;
        break;

      case MascotEmotion.CURIOUS:
        targetX *= 1.25;
        break;

      case MascotEmotion.CONFUSED:
        targetX *= -0.5;
        break;

      case MascotEmotion.SLEEPY:
        targetX = 0;
        targetY = 1;
        break;

      case MascotEmotion.TIRED:
        targetY = 1;
        break;

      case MascotEmotion.SAD:
        targetY = 1.5;
        break;

      default:
        break;
    }

    this.currentX +=
      (targetX - this.currentX) *
      this.smoothing;

    this.currentY +=
      (targetY - this.currentY) *
      this.smoothing;

    return {
      ...renderState,

      transform: {
        ...(renderState.transform ?? {}),

        parts: {
          ...parts,

          eyes: {
            translateX: this.currentX,
            translateY: this.currentY,
            rotation: 0,
            scale: 1,
            scaleX: 1,
            scaleY: 1,
            skewX: 0,
            skewY: 0,
          },
        },
      },
    };
  }

  reset() {
    this.currentX = 0;
    this.currentY = 0;
  }

  setMaxOffset(value) {
    this.maxOffset = value;
  }

  setSmoothing(value) {
    this.smoothing = value;
  }
}
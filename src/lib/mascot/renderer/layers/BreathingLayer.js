// =========================================================
// MASCOT ENGINE v2
// Module: BreathingLayer
// Responsibility:
// Applies a subtle breathing animation using the shared
// animation clock.
// =========================================================

import { animationClock } from "@/lib/mascot/core/AnimationClock";

export class BreathingLayer {
  /**
   * Applies the breathing effect.
   *
   * @param {Object} renderState
   * @param {Object} mascotState
   * @returns {Object}
   */
  apply(renderState, mascotState) {
    const time = animationClock.getTime();

    // Small breathing oscillation
    const scale = 1 + Math.sin(time * 2) * 0.015;

    return {
      ...renderState,

      transform: {
        ...renderState.transform,

        global: {
          ...renderState.transform.global,
          scale,
        },
      },
    };
  }
}
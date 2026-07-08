// =========================================================
// MASCOT ENGINE v2
// Module: IdleLayer
// Responsibility:
// Adds subtle idle motion to make the mascot feel alive.
// This layer never controls behaviour.
// It only applies small render transformations.
// =========================================================

import { animationClock } from "@/lib/mascot/core/AnimationClock";

const IDLE_SWAY_SPEED = 0.8;
const IDLE_SWAY_AMOUNT = 2;

const IDLE_FLOAT_SPEED = 0.6;
const IDLE_FLOAT_AMOUNT = 1.5;

export class IdleLayer {
  /**
   * Applies subtle idle movement.
   *
   * @param {Object} renderState
   * @param {Object} mascotState
   * @returns {Object}
   */
  apply(renderState, mascotState) {
    const time = animationClock.getTime();

    const sway =
      Math.sin(time * IDLE_SWAY_SPEED) *
      IDLE_SWAY_AMOUNT;

    const floatY =
      Math.sin(time * IDLE_FLOAT_SPEED) *
      IDLE_FLOAT_AMOUNT;

    return {
      ...renderState,

      transform: {
        ...renderState.transform,

        global: {
          ...renderState.transform.global,

          rotation:
            renderState.transform.global.rotation +
            sway,

          translateY:
            renderState.transform.global.translateY +
            floatY,
        },
      },
    };
  }
}
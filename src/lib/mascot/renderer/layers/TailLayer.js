// =========================================================
// MASCOT ENGINE v2.5
// Module: TailLayer
// ---------------------------------------------------------
// Genera el movimiento de la cola.
//
// Esta capa únicamente modifica el RenderState.
// No modifica el MascotState.
// =========================================================

import { animationClock } from "../../core/AnimationClock";
import { MascotEmotion } from "../../MascotEmotion";

export class TailLayer {
  /**
   * @param {Object} renderState
   * @param {Object} mascotState
   * @returns {Object}
   */
  apply(renderState, mascotState) {
    const time = animationClock.getTime();

    const tail = {
      rotation: 0,
      translateX: 0,
      translateY: 0,
      scale: 1,
    };

    const emotion = mascotState.emotion;

    // ================================================
    // Movimiento base
    // ================================================

    let amplitude = 6;
    let speed = 2;

    // ================================================
    // Emociones
    // ================================================

    switch (emotion) {
      case MascotEmotion.HAPPY:
        amplitude = 14;
        speed = 5;
        break;

      case MascotEmotion.EXCITED:
        amplitude = 20;
        speed = 7;
        break;

      case MascotEmotion.CELEBRATING:
        amplitude = 26;
        speed = 9;
        break;

      case MascotEmotion.LOVE:
        amplitude = 16;
        speed = 5;
        break;

      case MascotEmotion.CURIOUS:
        amplitude = 10;
        speed = 3;
        break;

      case MascotEmotion.SLEEPY:
        amplitude = 2;
        speed = 0.8;
        break;

      case MascotEmotion.TIRED:
        amplitude = 1;
        speed = 0.5;
        break;

      case MascotEmotion.SAD:
        amplitude = 0;
        speed = 0;
        break;

      case MascotEmotion.ANGRY:
        amplitude = 5;
        speed = 8;
        break;

      default:
        break;
    }

    // ================================================
    // Movimiento por velocidad
    // ================================================

    const velocity =
      Math.abs(mascotState.velocity?.x ?? 0) +
      Math.abs(mascotState.velocity?.y ?? 0);

    amplitude += velocity * 0.35;

    // ================================================
    // Dirección
    // ================================================

    const direction =
      mascotState.direction === "left" ? -1 : 1;

    tail.rotation =
      Math.sin(time * speed) *
      amplitude *
      direction;

    return {
      ...renderState,

      transform: {
        ...renderState.transform,

        parts: {
          ...renderState.transform.parts,

          tail,
        },
      },
    };
  }
}
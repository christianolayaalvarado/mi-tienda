// =========================================================
// MASCOT ENGINE v2.5
// Module: HeadLayer
// ---------------------------------------------------------
// Controla el movimiento de la cabeza.
//
// La cabeza reacciona a:
//
// • Emoción
// • Cursor
// • Respiración
// • Estado idle
//
// No modifica MascotState.
// =========================================================

import { animationClock } from "../../core/AnimationClock";
import { MascotEmotion } from "../../MascotEmotion";

export class HeadLayer {
  apply(renderState, mascotState) {
    const time = animationClock.getTime();

    const head = {
      translateX: 0,
      translateY: 0,
      rotation: 0,
      scale: 1,
    };

    // ============================================
    // Mirar al cursor
    // ============================================

    if (mascotState.lookingAtCursor) {
      const x = mascotState.cursor?.x ?? 0;

      head.rotation = Math.max(
        -10,
        Math.min(10, x * 0.015)
      );
    }

    // ============================================
    // Emociones
    // ============================================

    switch (mascotState.emotion) {
      case MascotEmotion.CURIOUS:
        head.rotation -= 10;
        break;

      case MascotEmotion.THINKING:
        head.rotation += 8;
        break;

      case MascotEmotion.CONFUSED:
        head.rotation +=
          Math.sin(time * 4) * 10;
        break;

      case MascotEmotion.HAPPY:
        head.translateY =
          Math.sin(time * 6) * 1.5;
        break;

      case MascotEmotion.EXCITED:
        head.translateY =
          Math.sin(time * 10) * 3;
        break;

      case MascotEmotion.CELEBRATING:
        head.rotation +=
          Math.sin(time * 10) * 8;
        break;

      case MascotEmotion.SLEEPY:
        head.rotation += 5;
        head.translateY += 2;
        break;

      case MascotEmotion.SAD:
        head.rotation += 6;
        head.translateY += 3;
        break;

      default:
        break;
    }

    return {
      ...renderState,

      transform: {
        ...renderState.transform,

        parts: {
          ...renderState.transform.parts,

          head,
        },
      },
    };
  }
}
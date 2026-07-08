// =========================================================
// MASCOT ENGINE v2.5
// Module: EarLayer
// ---------------------------------------------------------
// Controla las orejas.
//
// Las orejas reaccionan a:
//
// • Emoción
// • Respiración
// • Movimiento
//
// No modifica MascotState.
// =========================================================

import { animationClock } from "../../core/AnimationClock";
import { MascotEmotion } from "../../MascotEmotion";

export class EarLayer {
  apply(renderState, mascotState) {
    const time = animationClock.getTime();

    const leftEar = {
      rotation: 0,
      translateX: 0,
      translateY: 0,
      scale: 1,
    };

    const rightEar = {
      rotation: 0,
      translateX: 0,
      translateY: 0,
      scale: 1,
    };

    // Movimiento natural
    const idle = Math.sin(time * 2) * 2;

    leftEar.rotation += idle;
    rightEar.rotation -= idle;

    switch (mascotState.emotion) {
      case MascotEmotion.HAPPY:
        leftEar.rotation += 8;
        rightEar.rotation -= 8;
        break;

      case MascotEmotion.EXCITED:
        leftEar.rotation += Math.sin(time * 10) * 15;
        rightEar.rotation -= Math.sin(time * 10) * 15;
        break;

      case MascotEmotion.CURIOUS:
        leftEar.rotation += 18;
        rightEar.rotation -= 4;
        break;

      case MascotEmotion.THINKING:
        leftEar.rotation += 10;
        rightEar.rotation -= 10;
        break;

      case MascotEmotion.CONFUSED:
        leftEar.rotation += Math.sin(time * 5) * 12;
        rightEar.rotation -= Math.sin(time * 5) * 12;
        break;

      case MascotEmotion.SAD:
        leftEar.rotation -= 10;
        rightEar.rotation += 10;
        break;

      case MascotEmotion.SLEEPY:
        leftEar.rotation -= 18;
        rightEar.rotation += 18;
        break;

      case MascotEmotion.SCARED:
        leftEar.rotation += 25;
        rightEar.rotation -= 25;
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

          leftEar,
          rightEar,
        },
      },
    };
  }
}
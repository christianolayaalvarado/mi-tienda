// =========================================================
// MASCOT ENGINE v2.6
// Module: EarLayer
// ---------------------------------------------------------
// Controla las orejas.
//
// • Movimiento natural
// • Emociones
// • Preparado para RenderPipeline
// =========================================================

import { animationClock } from "../../core/AnimationClock";
import { MascotEmotion } from "../../MascotEmotion";

export class EarLayer {
  apply(renderState = {}, mascotState = {}) {
    const time = animationClock.getTime();

    const leftEar = {
      translateX: 0,
      translateY: 0,
      rotation: 0,
      scale: 1,
      scaleX: 1,
      scaleY: 1,
      skewX: 0,
      skewY: 0,
    };

    const rightEar = {
      translateX: 0,
      translateY: 0,
      rotation: 0,
      scale: 1,
      scaleX: 1,
      scaleY: 1,
      skewX: 0,
      skewY: 0,
    };

    // =====================================================
    // Movimiento natural
    // =====================================================

    const idle = Math.sin(time * 2) * 2;

    leftEar.rotation += idle;
    rightEar.rotation -= idle;

    // =====================================================
    // Emociones
    // =====================================================

    switch (mascotState.emotion) {
      case MascotEmotion.HAPPY:
        leftEar.rotation += 8;
        rightEar.rotation -= 8;
        break;

      case MascotEmotion.EXCITED:
        leftEar.rotation += Math.sin(time * 10) * 15;
        rightEar.rotation -= Math.sin(time * 10) * 15;

        leftEar.scale = 1.05;
        rightEar.scale = 1.05;
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

        leftEar.translateY = 2;
        rightEar.translateY = 2;
        break;

      case MascotEmotion.SLEEPY:
        leftEar.rotation -= 18;
        rightEar.rotation += 18;

        leftEar.translateY = 3;
        rightEar.translateY = 3;
        break;

      case MascotEmotion.SCARED:
        leftEar.rotation += 25;
        rightEar.rotation -= 25;

        leftEar.scale = 1.08;
        rightEar.scale = 1.08;
        break;

      case MascotEmotion.PROUD:
        leftEar.rotation += 5;
        rightEar.rotation -= 5;
        break;

      default:
        break;
    }

    return {
      ...renderState,

      transform: {
        ...(renderState.transform ?? {}),

        parts: {
          ...(renderState.transform?.parts ?? {}),

          leftEar,
          rightEar,
        },
      },
    };
  }
}
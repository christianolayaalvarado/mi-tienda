// =========================================================
// MASCOT ENGINE v2.6
// Module: ArmLayer
// ---------------------------------------------------------
// Controla ambos brazos.
//
// • Movimiento natural
// • Emociones
// • Preparado para futuras animaciones
// =========================================================

import { animationClock } from "../../core/AnimationClock";
import { MascotEmotion } from "../../MascotEmotion";

export class ArmLayer {
  apply(renderState = {}, mascotState = {}) {
    const time = animationClock.getTime();

    const leftArm = {
      translateX: 0,
      translateY: 0,
      rotation: 0,
      scale: 1,
      scaleX: 1,
      scaleY: 1,
      skewX: 0,
      skewY: 0,
    };

    const rightArm = {
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

    leftArm.rotation += idle;
    rightArm.rotation -= idle;

    // =====================================================
    // Emociones
    // =====================================================

    switch (mascotState.emotion) {
      case MascotEmotion.HAPPY:
        leftArm.rotation -= 8;
        rightArm.rotation += 8;
        break;

      case MascotEmotion.EXCITED:
        leftArm.rotation += Math.sin(time * 10) * 18;
        rightArm.rotation -= Math.sin(time * 10) * 18;

        leftArm.scale = 1.03;
        rightArm.scale = 1.03;
        break;

      case MascotEmotion.CELEBRATING:
        leftArm.rotation += Math.sin(time * 14) * 40;
        rightArm.rotation -= Math.sin(time * 14) * 40;

        leftArm.scale = 1.05;
        rightArm.scale = 1.05;
        break;

      case MascotEmotion.GREETING:
        rightArm.rotation = -55;
        leftArm.rotation = 10;
        break;

      case MascotEmotion.WAVING:
        rightArm.rotation =
          -45 + Math.sin(time * 12) * 25;

        leftArm.rotation = 8;
        break;

      case MascotEmotion.PROUD:
        leftArm.rotation = -15;
        rightArm.rotation = 15;
        break;

      case MascotEmotion.LOVE:
        leftArm.rotation = -25;
        rightArm.rotation = 25;

        leftArm.translateY = -2;
        rightArm.translateY = -2;
        break;

      case MascotEmotion.SCARED:
        leftArm.rotation = -45;
        rightArm.rotation = 45;

        leftArm.translateY = -3;
        rightArm.translateY = -3;
        break;

      case MascotEmotion.SAD:
        leftArm.rotation += 15;
        rightArm.rotation -= 15;

        leftArm.translateY = 3;
        rightArm.translateY = 3;
        break;

      case MascotEmotion.SLEEPY:
        leftArm.rotation += 20;
        rightArm.rotation -= 20;

        leftArm.translateY = 4;
        rightArm.translateY = 4;
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

          leftArm,
          rightArm,
        },
      },
    };
  }
}
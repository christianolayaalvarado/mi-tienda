// =========================================================
// MASCOT ENGINE v2.5
// Module: ArmLayer
// ---------------------------------------------------------
// Controla ambos brazos.
//
// Reacciona a:
// • Emoción
// • Movimiento
// • Respiración
// =========================================================

import { animationClock } from "../../core/AnimationClock";
import { MascotEmotion } from "../../MascotEmotion";

export class ArmLayer {
  apply(renderState, mascotState) {
    const time = animationClock.getTime();

    const leftArm = {
      rotation: 0,
      translateX: 0,
      translateY: 0,
      scale: 1,
    };

    const rightArm = {
      rotation: 0,
      translateX: 0,
      translateY: 0,
      scale: 1,
    };

    // Movimiento natural
    leftArm.rotation += Math.sin(time * 2) * 2;
    rightArm.rotation -= Math.sin(time * 2) * 2;

    switch (mascotState.emotion) {
      case MascotEmotion.HAPPY:
        leftArm.rotation -= 8;
        rightArm.rotation += 8;
        break;

      case MascotEmotion.EXCITED:
        leftArm.rotation += Math.sin(time * 10) * 18;
        rightArm.rotation -= Math.sin(time * 10) * 18;
        break;

      case MascotEmotion.CELEBRATING:
        leftArm.rotation += Math.sin(time * 14) * 40;
        rightArm.rotation -= Math.sin(time * 14) * 40;
        break;

      case MascotEmotion.GREETING:
        rightArm.rotation = -55;
        break;

      case MascotEmotion.WAVING:
        rightArm.rotation =
          -45 + Math.sin(time * 12) * 25;
        break;

      case MascotEmotion.SAD:
        leftArm.rotation += 15;
        rightArm.rotation -= 15;
        break;

      case MascotEmotion.SLEEPY:
        leftArm.rotation += 20;
        rightArm.rotation -= 20;
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

          leftArm,
          rightArm,
        },
      },
    };
  }
}
// =========================================================
// MASCOT ENGINE v2.5
// Module: LegLayer
// ---------------------------------------------------------
// Controla ambas piernas.
// =========================================================

import { animationClock } from "../../core/AnimationClock";
import { MascotEmotion } from "../../MascotEmotion";

export class LegLayer {
  apply(renderState, mascotState) {
    const time = animationClock.getTime();

    const leftLeg = {
      rotation: 0,
      translateX: 0,
      translateY: 0,
      scale: 1,
    };

    const rightLeg = {
      rotation: 0,
      translateX: 0,
      translateY: 0,
      scale: 1,
    };

    const walk =
      Math.sin(time * 8) * 12;

    switch (mascotState.emotion) {
      case MascotEmotion.WALKING:
        leftLeg.rotation = walk;
        rightLeg.rotation = -walk;
        break;

      case MascotEmotion.RUNNING:
        leftLeg.rotation = walk * 1.8;
        rightLeg.rotation = -walk * 1.8;
        break;

      case MascotEmotion.JUMPING:
        leftLeg.rotation = -15;
        rightLeg.rotation = 15;
        break;

      case MascotEmotion.DANCING:
        leftLeg.rotation =
          Math.sin(time * 12) * 20;

        rightLeg.rotation =
          -Math.sin(time * 12) * 20;

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

          leftLeg,
          rightLeg,
        },
      },
    };
  }
}
// =========================================================
// MASCOT ENGINE v2.6
// Module: LegLayer
// ---------------------------------------------------------
// Controla ambas piernas.
// =========================================================

import { animationClock } from "../../core/AnimationClock";
import { MascotEmotion } from "../../MascotEmotion";

export class LegLayer {
  apply(renderState = {}, mascotState = {}) {
    const time = animationClock.getTime();

    const leftLeg = {
      translateX: 0,
      translateY: 0,
      rotation: 0,
      scale: 1,
      scaleX: 1,
      scaleY: 1,
      skewX: 0,
      skewY: 0,
    };

    const rightLeg = {
      translateX: 0,
      translateY: 0,
      rotation: 0,
      scale: 1,
      scaleX: 1,
      scaleY: 1,
      skewX: 0,
      skewY: 0,
    };

    const walk = Math.sin(time * 8) * 12;

    switch (mascotState.emotion) {
      case MascotEmotion.WALKING:
        leftLeg.rotation = walk;
        rightLeg.rotation = -walk;

        leftLeg.translateY = Math.abs(Math.sin(time * 8)) * 2;
        rightLeg.translateY = Math.abs(Math.sin(time * 8 + Math.PI)) * 2;
        break;

      case MascotEmotion.RUNNING:
        leftLeg.rotation = walk * 1.8;
        rightLeg.rotation = -walk * 1.8;

        leftLeg.translateY = Math.abs(Math.sin(time * 12)) * 4;
        rightLeg.translateY = Math.abs(Math.sin(time * 12 + Math.PI)) * 4;

        leftLeg.scale = 1.03;
        rightLeg.scale = 1.03;
        break;

      case MascotEmotion.JUMPING:
        leftLeg.rotation = -15;
        rightLeg.rotation = 15;

        leftLeg.translateY = -3;
        rightLeg.translateY = -3;
        break;

      case MascotEmotion.DANCING:
        leftLeg.rotation = Math.sin(time * 12) * 20;
        rightLeg.rotation = -Math.sin(time * 12) * 20;

        leftLeg.translateY = Math.sin(time * 12) * 2;
        rightLeg.translateY = -Math.sin(time * 12) * 2;
        break;

      case MascotEmotion.CELEBRATING:
        leftLeg.rotation = Math.sin(time * 10) * 12;
        rightLeg.rotation = -Math.sin(time * 10) * 12;
        break;

      case MascotEmotion.SLEEPY:
        leftLeg.rotation = 3;
        rightLeg.rotation = -3;
        break;

      case MascotEmotion.SAD:
        leftLeg.translateY = 2;
        rightLeg.translateY = 2;
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

          leftLeg,
          rightLeg,
        },
      },
    };
  }
}
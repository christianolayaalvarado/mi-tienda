// =========================================================
// MASCOT ENGINE v2.6
// Module: BodyLayer
// ---------------------------------------------------------
// Controla únicamente las transformaciones del cuerpo.
// =========================================================

import { animationClock } from "../../core/AnimationClock";
import { MascotEmotion } from "../../MascotEmotion";

export class BodyLayer {
  apply(renderState = {}, mascotState = {}) {
    const time = animationClock.getTime();

    const body = {
      translateX: 0,
      translateY: 0,
      rotation: 0,
      scale: 1,
      scaleX: 1,
      scaleY: 1,
      skewX: 0,
      skewY: 0,
      brightness: 1,
      saturation: 1,
      blur: 0,
    };

    switch (mascotState.emotion) {
      case MascotEmotion.HAPPY:
        body.translateY = Math.sin(time * 4) * 1.5;
        body.scaleY = 1.01;
        break;

      case MascotEmotion.EXCITED:
        body.translateY = Math.sin(time * 8) * 3;
        body.scale = 1.03;
        break;

      case MascotEmotion.CELEBRATING:
        body.translateY = Math.sin(time * 10) * 5;
        body.rotation = Math.sin(time * 10) * 5;
        body.scale = 1.05;
        break;

      case MascotEmotion.SLEEPY:
        body.rotation = 3;
        body.translateY = 1;
        break;

      case MascotEmotion.TIRED:
        body.rotation = 2;
        body.translateY = 2;
        break;

      case MascotEmotion.SAD:
        body.translateY = 2;
        body.scaleY = 0.98;
        break;

      case MascotEmotion.PROUD:
        body.translateY = -1;
        body.scale = 1.02;
        break;

      case MascotEmotion.ANGRY:
        body.scaleX = 1.03;
        body.scaleY = 0.97;
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

          body,
        },
      },
    };
  }
}
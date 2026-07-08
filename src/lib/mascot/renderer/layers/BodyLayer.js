// =========================================================
// MASCOT ENGINE v2.5
// Module: BodyLayer
// ---------------------------------------------------------
// Controla las transformaciones del cuerpo principal.
//
// No modifica el estado.
// Solo modifica el RenderState.
// =========================================================

import { animationClock } from "../../core/AnimationClock";
import { MascotEmotion } from "../../MascotEmotion";

export class BodyLayer {
  apply(renderState, mascotState) {
    const time = animationClock.getTime();

    const body = {
      translateX: 0,
      translateY: 0,
      rotation: 0,
      scale: 1,
    };

    switch (mascotState.emotion) {
      case MascotEmotion.HAPPY:
        body.translateY =
          Math.sin(time * 4) * 1.5;
        break;

      case MascotEmotion.EXCITED:
        body.translateY =
          Math.sin(time * 8) * 3;
        break;

      case MascotEmotion.CELEBRATING:
        body.translateY =
          Math.sin(time * 10) * 5;

        body.rotation =
          Math.sin(time * 10) * 5;
        break;

      case MascotEmotion.SLEEPY:
        body.rotation = 3;
        break;

      case MascotEmotion.SAD:
        body.translateY = 2;
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

          body,
        },
      },
    };
  }
}
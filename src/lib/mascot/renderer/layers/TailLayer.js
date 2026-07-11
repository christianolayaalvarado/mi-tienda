// =========================================================
// MASCOT ENGINE v2.6
// Module: TailLayer
// ---------------------------------------------------------
// Controla el movimiento dinámico de la cola.
// =========================================================

import { animationClock } from "../../core/AnimationClock";
import { MascotEmotion } from "../../MascotEmotion";

export class TailLayer {
  apply(renderState = {}, mascotState = {}) {
    const time = animationClock.getTime();

    const tail = {
      translateX: 0,
      translateY: 0,
      rotation: 0,
      scale: 1,
      scaleX: 1,
      scaleY: 1,
      skewX: 0,
      skewY: 0,
    };

    let amplitude = 6;
    let speed = 2;

    switch (mascotState.emotion) {
      case MascotEmotion.HAPPY:
        amplitude = 14;
        speed = 5;
        break;

      case MascotEmotion.EXCITED:
        amplitude = 20;
        speed = 7;
        tail.scale = 1.03;
        break;

      case MascotEmotion.CELEBRATING:
        amplitude = 26;
        speed = 9;
        tail.scale = 1.05;
        break;

      case MascotEmotion.LOVE:
        amplitude = 16;
        speed = 5;
        break;

      case MascotEmotion.CURIOUS:
        amplitude = 10;
        speed = 3;
        break;

      case MascotEmotion.PROUD:
        amplitude = 12;
        speed = 4;
        break;

      case MascotEmotion.SCARED:
        amplitude = 30;
        speed = 12;
        break;

      case MascotEmotion.ANGRY:
        amplitude = 5;
        speed = 8;
        break;

      case MascotEmotion.SLEEPY:
        amplitude = 2;
        speed = 0.8;
        tail.translateY = 1;
        break;

      case MascotEmotion.TIRED:
        amplitude = 1;
        speed = 0.5;
        tail.translateY = 2;
        break;

      case MascotEmotion.SAD:
        amplitude = 0;
        speed = 0;
        tail.translateY = 3;
        break;

      default:
        break;
    }

    const velocity =
      Math.abs(mascotState.velocity?.x ?? 0) +
      Math.abs(mascotState.velocity?.y ?? 0);

    amplitude += velocity * 0.35;

    const direction =
      mascotState.direction === "left" ? -1 : 1;

    tail.rotation =
      Math.sin(time * speed) *
      amplitude *
      direction;

    return {
      ...renderState,

      transform: {
        ...(renderState.transform ?? {}),

        parts: {
          ...(renderState.transform?.parts ?? {}),

          tail,
        },
      },
    };
  }
}
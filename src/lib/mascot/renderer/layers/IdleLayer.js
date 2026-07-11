// =========================================================
// MASCOT ENGINE v2.7
// Module: IdleLayer
// ---------------------------------------------------------
// Movimiento natural cuando la mascota está en reposo.
// =========================================================

import { animationClock } from "@/lib/mascot/core/AnimationClock";
import { MascotEmotion } from "../../MascotEmotion";

export class IdleLayer {
  apply(renderState = {}, mascotState = {}) {
    const time = animationClock.getTime();

    let swaySpeed = 0.8;
    let swayAmount = 2;

    let floatSpeed = 0.6;
    let floatAmount = 1.5;

    switch (mascotState.emotion) {
      case MascotEmotion.SLEEPY:
        swaySpeed = 0.25;
        swayAmount = 4;
        floatSpeed = 0.25;
        floatAmount = 2;
        break;

      case MascotEmotion.TIRED:
        swaySpeed = 0.4;
        swayAmount = 3;
        floatSpeed = 0.4;
        floatAmount = 1.8;
        break;

      case MascotEmotion.HAPPY:
        swaySpeed = 1.2;
        swayAmount = 2.5;
        floatSpeed = 1;
        floatAmount = 2;
        break;

      case MascotEmotion.EXCITED:
        swaySpeed = 2;
        swayAmount = 3;
        floatSpeed = 2;
        floatAmount = 2.5;
        break;

      case MascotEmotion.CELEBRATING:
        swaySpeed = 3;
        swayAmount = 5;
        floatSpeed = 3;
        floatAmount = 4;
        break;

      default:
        break;
    }

    const sway =
      Math.sin(time * swaySpeed) *
      swayAmount;

    const floatY =
      Math.sin(time * floatSpeed) *
      floatAmount;

    const global = {
      ...(renderState.transform?.global ?? {}),
    };

    global.rotation =
      (global.rotation ?? 0) + sway;

    global.translateY =
      (global.translateY ?? 0) + floatY;

    return {
      ...renderState,

      transform: {
        ...(renderState.transform ?? {}),

        global,

        parts: {
          ...(renderState.transform?.parts ?? {}),
        },
      },
    };
  }
}
// =========================================================
// MASCOT ENGINE v2.7
// Module: BreathingLayer
// ---------------------------------------------------------
// Aplica la respiración natural del personaje.
// =========================================================

import { animationClock } from "@/lib/mascot/core/AnimationClock";
import { MascotEmotion } from "../../MascotEmotion";

export class BreathingLayer {
  apply(renderState = {}, mascotState = {}) {
    const time = animationClock.getTime();

    let amplitude = 0.015;
    let speed = 2;

    switch (mascotState.emotion) {
      case MascotEmotion.SLEEPY:
        amplitude = 0.025;
        speed = 1;
        break;

      case MascotEmotion.TIRED:
        amplitude = 0.02;
        speed = 1.2;
        break;

      case MascotEmotion.EXCITED:
        amplitude = 0.02;
        speed = 4;
        break;

      case MascotEmotion.RUNNING:
        amplitude = 0.025;
        speed = 5;
        break;

      case MascotEmotion.HAPPY:
        amplitude = 0.018;
        speed = 2.8;
        break;

      default:
        break;
    }

    const breath = Math.sin(time * speed) * amplitude;

    const global = {
      ...(renderState.transform?.global ?? {}),
    };

    global.scale = (global.scale ?? 1) + breath;

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
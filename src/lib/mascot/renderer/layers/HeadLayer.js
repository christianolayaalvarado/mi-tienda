// =========================================================
// MASCOT ENGINE v2.6
// Module: HeadLayer
// ---------------------------------------------------------
// Controla la cabeza de la mascota.
//
// • Cursor
// • Emoción
// • Movimiento natural
// =========================================================

import { animationClock } from "../../core/AnimationClock";
import { MascotEmotion } from "../../MascotEmotion";

export class HeadLayer {
  apply(renderState = {}, mascotState = {}) {
    const time = animationClock.getTime();

    const head = {
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

    // =====================================================
    // Mirar al cursor
    // =====================================================

    if (mascotState.lookingAtCursor) {
      const cursor = mascotState.cursor ?? {};

      head.rotation = Math.max(
        -12,
        Math.min(12, (cursor.x ?? 0) * 0.015)
      );

      head.translateX = Math.max(
        -2,
        Math.min(2, (cursor.x ?? 0) * 0.004)
      );

      head.translateY = Math.max(
        -2,
        Math.min(2, (cursor.y ?? 0) * 0.004)
      );
    }

    // =====================================================
    // Emociones
    // =====================================================

    switch (mascotState.emotion) {
      case MascotEmotion.CURIOUS:
        head.rotation -= 10;
        head.translateY -= 1;
        break;

      case MascotEmotion.THINKING:
        head.rotation += 8;
        break;

      case MascotEmotion.CONFUSED:
        head.rotation += Math.sin(time * 4) * 10;
        break;

      case MascotEmotion.HAPPY:
        head.translateY += Math.sin(time * 6) * 1.5;
        break;

      case MascotEmotion.EXCITED:
        head.translateY += Math.sin(time * 10) * 3;
        head.scale = 1.03;
        break;

      case MascotEmotion.CELEBRATING:
        head.rotation += Math.sin(time * 10) * 8;
        head.translateY += Math.sin(time * 10) * 2;
        head.scale = 1.05;
        break;

      case MascotEmotion.PROUD:
        head.translateY -= 2;
        head.scale = 1.02;
        break;

      case MascotEmotion.LOVE:
        head.scale = 1.05;
        break;

      case MascotEmotion.SLEEPY:
        head.rotation += 5;
        head.translateY += 2;
        break;

      case MascotEmotion.TIRED:
        head.rotation += 4;
        head.translateY += 2;
        break;

      case MascotEmotion.SAD:
        head.rotation += 6;
        head.translateY += 3;
        break;

      case MascotEmotion.ANGRY:
        head.rotation += Math.sin(time * 12) * 2;
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

          head,
        },
      },
    };
  }
}
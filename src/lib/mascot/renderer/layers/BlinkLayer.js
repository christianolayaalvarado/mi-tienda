// =========================================================
// MASCOT ENGINE v2.7
// Module: BlinkLayer
// ---------------------------------------------------------
// Genera el parpadeo natural de la mascota.
// No modifica MascotState.
// Solo produce información para RenderState.
// =========================================================

import { animationClock } from "@/lib/mascot/core/AnimationClock";
import { random } from "@/lib/mascot/utils/random";

const MIN_BLINK_INTERVAL = 2.5;
const MAX_BLINK_INTERVAL = 5.0;

const BLINK_DURATION = 0.12;

export class BlinkLayer {
  apply(renderState = {}, mascotState = {}) {
    const time = animationClock.getTime();

    // Crear estado interno si aún no existe
    mascotState.animation ??= {};

    mascotState.animation.blink ??= {
      value: 0,
      isBlinking: false,
      blinkStartTime: 0,
      nextBlinkTime: 0,
    };

    const blink = mascotState.animation.blink;

    // Programar primer parpadeo
    if (blink.nextBlinkTime === 0) {
      blink.nextBlinkTime =
        time +
        random.range(
          MIN_BLINK_INTERVAL,
          MAX_BLINK_INTERVAL
        );
    }

    // Iniciar parpadeo
    if (!blink.isBlinking && time >= blink.nextBlinkTime) {
      blink.isBlinking = true;
      blink.blinkStartTime = time;
    }

    // Animación
    if (blink.isBlinking) {
      const progress =
        (time - blink.blinkStartTime) /
        BLINK_DURATION;

      if (progress >= 1) {
        blink.isBlinking = false;
        blink.value = 0;

        blink.nextBlinkTime =
          time +
          random.range(
            MIN_BLINK_INTERVAL,
            MAX_BLINK_INTERVAL
          );
      } else {
        blink.value =
          progress < 0.5
            ? progress * 2
            : (1 - progress) * 2;
      }
    }

    return {
      ...renderState,

      animation: {
        ...(renderState.animation ?? {}),

        blink: blink.value,
      },
    };
  }
}
// =========================================================
// MASCOT ENGINE v2
// Module: BlinkLayer
// Responsibility:
// Generates natural blinking using the shared animation
// clock and the mascot's own animation state.
// =========================================================

import { animationClock } from "@/lib/mascot/core/AnimationClock";
import { random } from "@/lib/mascot/utils/random";

const MIN_BLINK_INTERVAL = 2.5;
const MAX_BLINK_INTERVAL = 5.0;

const BLINK_DURATION = 0.12;

export class BlinkLayer {
  apply(renderState, mascotState) {
    const time = animationClock.getTime();

    // Ensure animation state exists
    if (!mascotState.animation?.blink) {
      return renderState;
    }

    const blink = mascotState.animation.blink;

    // Schedule first blink
    if (blink.nextBlinkTime === 0) {
      blink.nextBlinkTime =
        time + random.range(MIN_BLINK_INTERVAL, MAX_BLINK_INTERVAL);
    }

    // Start blinking
    if (!blink.isBlinking && time >= blink.nextBlinkTime) {
      blink.isBlinking = true;
      blink.blinkStartTime = time;
    }

    // Blink animation
    if (blink.isBlinking) {
      const progress = (time - blink.blinkStartTime) / BLINK_DURATION;

      if (progress >= 1) {
        blink.isBlinking = false;
        blink.value = 0;

        blink.nextBlinkTime =
          time + random.range(MIN_BLINK_INTERVAL, MAX_BLINK_INTERVAL);
      } else {
        // 0 → 1 → 0
        blink.value =
          progress < 0.5
            ? progress * 2
            : (1 - progress) * 2;
      }
    }

    return {
      ...renderState,

      animation: {
        ...renderState.animation,

        blink: blink.value,
      },
    };
  }
}
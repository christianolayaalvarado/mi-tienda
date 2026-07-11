// =========================================================
// MASCOT ENGINE v2.7
// Module: EmotionLayer
// ---------------------------------------------------------
// Convierte la emoción actual en transformaciones visuales.
// =========================================================

import { MascotEmotion } from "../../MascotEmotion";

export class EmotionLayer {
  apply(renderState = {}, mascotState = {}) {
    const emotion = mascotState.emotion;

    const global = {
      translateX: 0,
      translateY: 0,
      rotation: 0,
      scale: 1,
      scaleX: 1,
      scaleY: 1,
      ...(renderState.transform?.global ?? {}),
    };

    const filters = {
      brightness: 1,
      saturation: 1,
      blur: 0,
      hue: 0,
      ...(renderState.filters ?? {}),
    };

    switch (emotion) {
      case MascotEmotion.IDLE:
        break;

      case MascotEmotion.HAPPY:
        global.scale += 0.03;
        filters.saturation += 0.15;
        filters.brightness += 0.05;
        break;

      case MascotEmotion.EXCITED:
        global.scale += 0.06;
        filters.saturation += 0.30;
        filters.brightness += 0.10;
        break;

      case MascotEmotion.CELEBRATING:
        global.scale += 0.08;
        global.rotation += 3;
        filters.saturation += 0.35;
        filters.brightness += 0.15;
        break;

      case MascotEmotion.PROUD:
        global.scale += 0.04;
        filters.brightness += 0.08;
        break;

      case MascotEmotion.LOVE:
        global.scale += 0.05;
        filters.saturation += 0.20;
        filters.brightness += 0.05;
        break;

      case MascotEmotion.CURIOUS:
        global.rotation -= 5;
        break;

      case MascotEmotion.LOOKING:
        global.rotation -= 3;
        break;

      case MascotEmotion.THINKING:
        global.rotation += 4;
        break;

      case MascotEmotion.CONFUSED:
        global.rotation += 8;
        filters.blur += 0.25;
        break;

      case MascotEmotion.SURPRISED:
        global.scale += 0.05;
        break;

      case MascotEmotion.SLEEPY:
        global.scale -= 0.03;
        filters.brightness -= 0.10;
        filters.saturation -= 0.15;
        break;

      case MascotEmotion.TIRED:
        global.scale -= 0.02;
        filters.brightness -= 0.08;
        break;

      case MascotEmotion.WAITING:
        break;

      case MascotEmotion.SAD:
        global.scale -= 0.05;
        filters.saturation -= 0.25;
        filters.brightness -= 0.12;
        break;

      case MascotEmotion.ANGRY:
        global.rotation += 2;
        filters.saturation += 0.10;
        filters.hue += 8;
        break;

      case MascotEmotion.SCARED:
        global.scale -= 0.04;
        global.rotation += 5;
        break;

      case MascotEmotion.WALKING:
        break;

      case MascotEmotion.RUNNING:
        global.scale += 0.02;
        break;

      case MascotEmotion.JUMPING:
        global.translateY -= 8;
        break;

      case MascotEmotion.DANCING:
        global.rotation += 10;
        break;

      case MascotEmotion.GREETING:
        global.rotation -= 4;
        break;

      case MascotEmotion.WAVING:
        global.rotation -= 8;
        break;

      case MascotEmotion.SHY:
        global.scale -= 0.02;
        global.rotation += 3;
        break;

      default:
        break;
    }

    return {
      ...renderState,

      transform: {
        ...(renderState.transform ?? {}),
        global,

        parts: {
          ...(renderState.transform?.parts ?? {}),
        },
      },

      filters,
    };
  }
}
// =========================================================
// MASCOT ENGINE v2.5
// Module: EmotionLayer
// ---------------------------------------------------------
// Convierte la emoción actual en transformaciones visuales.
//
// No decide emociones.
// No modifica el estado.
// Solamente interpreta MascotState.emotion y modifica
// el RenderState.
// =========================================================

import { MascotEmotion } from "../../MascotEmotion";

export class EmotionLayer {
  /**
   * Aplica transformaciones visuales según la emoción.
   *
   * @param {Object} renderState
   * @param {Object} mascotState
   * @returns {Object}
   */
  apply(renderState, mascotState) {
    const emotion = mascotState.emotion;

    const global = {
      ...renderState.transform.global,
    };

    const filters = {
      ...renderState.filters,
    };

    switch (emotion) {
      // ===================================================
      // Estado normal
      // ===================================================

      case MascotEmotion.IDLE:
        break;

      // ===================================================
      // Feliz
      // ===================================================

      case MascotEmotion.HAPPY:
        global.scale += 0.03;
        filters.saturation += 0.15;
        filters.brightness += 0.05;
        break;

      // ===================================================
      // Muy feliz
      // ===================================================

      case MascotEmotion.EXCITED:
        global.scale += 0.06;
        filters.saturation += 0.30;
        filters.brightness += 0.10;
        break;

      // ===================================================
      // Celebrando
      // ===================================================

      case MascotEmotion.CELEBRATING:
        global.scale += 0.08;
        global.rotation += 3;
        filters.saturation += 0.35;
        filters.brightness += 0.15;
        break;

      // ===================================================
      // Orgulloso
      // ===================================================

      case MascotEmotion.PROUD:
        global.scale += 0.04;
        break;

      // ===================================================
      // Amor
      // ===================================================

      case MascotEmotion.LOVE:
        global.scale += 0.05;
        filters.saturation += 0.20;
        break;

      // ===================================================
      // Curioso
      // ===================================================

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
        break;

      case MascotEmotion.SURPRISED:
        global.scale += 0.05;
        break;

      // ===================================================
      // Descanso
      // ===================================================

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

      // ===================================================
      // Triste
      // ===================================================

      case MascotEmotion.SAD:
        global.scale -= 0.05;
        filters.saturation -= 0.25;
        filters.brightness -= 0.12;
        break;

      // ===================================================
      // Molesto
      // ===================================================

      case MascotEmotion.ANGRY:
        global.rotation += 2;
        filters.saturation += 0.10;
        break;

      // ===================================================
      // Asustado
      // ===================================================

      case MascotEmotion.SCARED:
        global.scale -= 0.04;
        global.rotation += 5;
        break;

      // ===================================================
      // Movimiento
      // ===================================================

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

      // ===================================================
      // Sociales
      // ===================================================

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
        ...renderState.transform,

        global,
      },

      filters,
    };
  }
}
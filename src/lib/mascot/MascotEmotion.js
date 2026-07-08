/**
 * ==========================================================
 * MASCOT ENGINE v2.3
 * Module: MascotEmotion
 * ----------------------------------------------------------
 * Catálogo oficial de emociones del Character Engine.
 *
 * Este archivo únicamente define emociones y utilidades.
 * No contiene lógica de comportamiento.
 * ==========================================================
 */

export const MascotEmotion = Object.freeze({
  // ======================================================
  // Estado base
  // ======================================================

  IDLE: "idle",

  // ======================================================
  // Emociones positivas
  // ======================================================

  HAPPY: "happy",
  EXCITED: "excited",
  PROUD: "proud",
  CELEBRATING: "celebrating",
  LOVE: "love",

  // ======================================================
  // Sociales
  // ======================================================

  GREETING: "greeting",
  WAVING: "waving",
  SHY: "shy",

  // ======================================================
  // Curiosidad
  // ======================================================

  CURIOUS: "curious",
  THINKING: "thinking",
  LOOKING: "looking",
  SURPRISED: "surprised",
  CONFUSED: "confused",

  // ======================================================
  // Movimiento
  // ======================================================

  WALKING: "walking",
  RUNNING: "running",
  JUMPING: "jumping",
  DANCING: "dancing",

  // ======================================================
  // Descanso
  // ======================================================

  WAITING: "waiting",
  SLEEPY: "sleepy",
  TIRED: "tired",

  // ======================================================
  // Negativas
  // ======================================================

  SAD: "sad",
  ANGRY: "angry",
  SCARED: "scared",
});

export const DEFAULT_EMOTION = MascotEmotion.IDLE;

export const EMOTION_LIST = Object.freeze(
  Object.values(MascotEmotion)
);

/**
 * Comprueba si una emoción es válida.
 *
 * @param {string} emotion
 * @returns {boolean}
 */
export function isValidEmotion(emotion) {
  return EMOTION_LIST.includes(emotion);
}

/**
 * Emociones positivas.
 */
export const POSITIVE_EMOTIONS = Object.freeze([
  MascotEmotion.HAPPY,
  MascotEmotion.EXCITED,
  MascotEmotion.PROUD,
  MascotEmotion.CELEBRATING,
  MascotEmotion.LOVE,
]);

/**
 * Emociones negativas.
 */
export const NEGATIVE_EMOTIONS = Object.freeze([
  MascotEmotion.SAD,
  MascotEmotion.ANGRY,
  MascotEmotion.SCARED,
]);

/**
 * Emociones de movimiento.
 */
export const MOVEMENT_EMOTIONS = Object.freeze([
  MascotEmotion.WALKING,
  MascotEmotion.RUNNING,
  MascotEmotion.JUMPING,
  MascotEmotion.DANCING,
]);

/**
 * Emociones de descanso.
 */
export const REST_EMOTIONS = Object.freeze([
  MascotEmotion.IDLE,
  MascotEmotion.WAITING,
  MascotEmotion.SLEEPY,
  MascotEmotion.TIRED,
]);

/**
 * Emociones sociales.
 */
export const SOCIAL_EMOTIONS = Object.freeze([
  MascotEmotion.GREETING,
  MascotEmotion.WAVING,
  MascotEmotion.SHY,
]);

/**
 * Emociones de curiosidad.
 */
export const CURIOSITY_EMOTIONS = Object.freeze([
  MascotEmotion.CURIOUS,
  MascotEmotion.LOOKING,
  MascotEmotion.THINKING,
  MascotEmotion.SURPRISED,
  MascotEmotion.CONFUSED,
]);

/**
 * Devuelve una emoción aleatoria.
 *
 * @returns {string}
 */
export function randomEmotion() {
  return EMOTION_LIST[
    Math.floor(Math.random() * EMOTION_LIST.length)
  ];
}
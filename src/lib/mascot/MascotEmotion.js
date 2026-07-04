/**
 * ==========================================================
 * Mascot Engine v1.0
 * Emotion System
 * ----------------------------------------------------------
 * Define todas las emociones posibles de una mascota.
 * Este archivo NO contiene lógica.
 * Solamente describe los estados emocionales.
 * ==========================================================
 */

export const MascotEmotion = Object.freeze({

  IDLE: "idle",

  HAPPY: "happy",

  EXCITED: "excited",

  CURIOUS: "curious",

  SURPRISED: "surprised",

  THINKING: "thinking",

  SLEEPY: "sleepy",

  TIRED: "tired",

  SAD: "sad",

  PROUD: "proud",

  CELEBRATING: "celebrating",

  SHY: "shy",

  CONFUSED: "confused",

  LOOKING: "looking",

  WALKING: "walking",

  RUNNING: "running",

  JUMPING: "jumping",

  GREETING: "greeting",

  WAVING: "waving",

  DANCING: "dancing",

  LOVE: "love",

  ANGRY: "angry",

  SCARED: "scared",

  WAITING: "waiting"

});

export const DEFAULT_EMOTION = MascotEmotion.IDLE;

export const EMOTION_LIST = Object.freeze(
  Object.values(MascotEmotion)
);

export function isValidEmotion(emotion) {
  return EMOTION_LIST.includes(emotion);
}
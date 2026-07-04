import { MascotEmotion } from "./MascotEmotion";

/**
 * ==========================================================
 * Mascot Engine v1.0
 * State Machine
 * ----------------------------------------------------------
 * Define qué transiciones de emociones son válidas.
 * No modifica el estado.
 * No contiene lógica de animación.
 * Solo responde si un cambio está permitido.
 * ==========================================================
 */

const TRANSITIONS = Object.freeze({

  [MascotEmotion.IDLE]: [
    MascotEmotion.HAPPY,
    MascotEmotion.CURIOUS,
    MascotEmotion.THINKING,
    MascotEmotion.LOOKING,
    MascotEmotion.GREETING,
    MascotEmotion.WAITING,
    MascotEmotion.SLEEPY,
    MascotEmotion.SAD,
    MascotEmotion.EXCITED,
  ],

  [MascotEmotion.HAPPY]: [
    MascotEmotion.CELEBRATING,
    MascotEmotion.PROUD,
    MascotEmotion.IDLE,
    MascotEmotion.EXCITED,
  ],

  [MascotEmotion.EXCITED]: [
    MascotEmotion.CELEBRATING,
    MascotEmotion.HAPPY,
    MascotEmotion.IDLE,
  ],

  [MascotEmotion.CELEBRATING]: [
    MascotEmotion.PROUD,
    MascotEmotion.HAPPY,
    MascotEmotion.IDLE,
  ],

  [MascotEmotion.PROUD]: [
    MascotEmotion.IDLE,
    MascotEmotion.HAPPY,
  ],

  [MascotEmotion.CURIOUS]: [
    MascotEmotion.LOOKING,
    MascotEmotion.THINKING,
    MascotEmotion.IDLE,
  ],

  [MascotEmotion.LOOKING]: [
    MascotEmotion.CURIOUS,
    MascotEmotion.IDLE,
  ],

  [MascotEmotion.THINKING]: [
    MascotEmotion.CURIOUS,
    MascotEmotion.IDLE,
  ],

  [MascotEmotion.SLEEPY]: [
    MascotEmotion.TIRED,
    MascotEmotion.IDLE,
  ],

  [MascotEmotion.TIRED]: [
    MascotEmotion.SLEEPY,
    MascotEmotion.IDLE,
  ],

  [MascotEmotion.SAD]: [
    MascotEmotion.IDLE,
    MascotEmotion.HAPPY,
  ],

  [MascotEmotion.GREETING]: [
    MascotEmotion.WAVING,
    MascotEmotion.HAPPY,
    MascotEmotion.IDLE,
  ],

  [MascotEmotion.WAVING]: [
    MascotEmotion.HAPPY,
    MascotEmotion.IDLE,
  ],

  [MascotEmotion.DANCING]: [
    MascotEmotion.CELEBRATING,
    MascotEmotion.HAPPY,
    MascotEmotion.IDLE,
  ],

  [MascotEmotion.LOVE]: [
    MascotEmotion.HAPPY,
    MascotEmotion.IDLE,
  ],

  [MascotEmotion.ANGRY]: [
    MascotEmotion.IDLE,
  ],

  [MascotEmotion.SCARED]: [
    MascotEmotion.IDLE,
  ],

  [MascotEmotion.WAITING]: [
    MascotEmotion.IDLE,
    MascotEmotion.CURIOUS,
  ],

  [MascotEmotion.WALKING]: [
    MascotEmotion.RUNNING,
    MascotEmotion.IDLE,
  ],

  [MascotEmotion.RUNNING]: [
    MascotEmotion.JUMPING,
    MascotEmotion.IDLE,
  ],

  [MascotEmotion.JUMPING]: [
    MascotEmotion.IDLE,
    MascotEmotion.HAPPY,
  ],

});

export function canTransition(from, to) {
  if (from === to) {
    return true;
  }

  const allowed = TRANSITIONS[from];

  if (!allowed) {
    return false;
  }

  return allowed.includes(to);
}

export function getAvailableTransitions(from) {
  return TRANSITIONS[from] || [];
}

export { TRANSITIONS };
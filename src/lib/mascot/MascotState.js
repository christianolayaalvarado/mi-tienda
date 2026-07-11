import { DEFAULT_EMOTION } from "./MascotEmotion";

/**
 * ==========================================================
 * MASCOT ENGINE v2.7
 * Module: MascotState
 * ==========================================================
 */

export function createMascotState() {
  const now = Date.now();

  return {
    // Estado general
    emotion: DEFAULT_EMOTION,
    direction: "front",

    visible: true,
    enabled: true,

    // Transformación
    position: {
      x: 0,
      y: 0,
    },

    velocity: {
      x: 0,
      y: 0,
    },

    acceleration: {
      x: 0,
      y: 0,
    },

    scale: 1,
    rotation: 0,
    opacity: 1,

    // Cursor
    cursor: {
      x: 0,
      y: 0,
    },

    lookingAtCursor: false,

    // Física
    physics: {
      grounded: true,
      jumping: false,
      falling: false,

      gravity: 0,
      friction: 0.9,
    },

    // Animaciones
    animation: {
      current: "idle",
      previous: null,

      playing: false,

      startedAt: now,

      progress: 0,

      blink: {
        value: 0,
        isBlinking: false,
        blinkStartTime: 0,
        nextBlinkTime: 0,
      },
    },

    // Eventos
    currentEvent: null,
    lastEvent: null,

    // Tiempo
    idleTime: 0,
    lastInteraction: now,

    createdAt: now,
    updatedAt: now,

    // Render
    dirty: true,
    needsRender: true,
    frame: 0,
  };
}
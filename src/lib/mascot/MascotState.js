import { DEFAULT_EMOTION } from "./MascotEmotion";

/**
 * ==========================================================
 * Mascot Engine v1.0
 * Mascot State
 * ----------------------------------------------------------
 * Estado interno de una mascota.
 * No contiene lógica de comportamiento.
 * Solamente almacena información.
 * ==========================================================
 */

export function createMascotState() {
  return {
    // Estado general
    emotion: DEFAULT_EMOTION,
    direction: "front",

    // Movimiento
    position: {
      x: 0,
      y: 0,
    },

    velocity: {
      x: 0,
      y: 0,
    },

    scale: 1,
    rotation: 0,

    // Animaciones naturales
    blinking: true,
    breathing: true,

    // Interacción
    lookingAtCursor: false,
    cursor: {
      x: 0,
      y: 0,
    },

    // Temporizadores
    idleTime: 0,
    lastInteraction: Date.now(),

    // Eventos
    currentEvent: null,

    // Control interno
    visible: true,
    enabled: true,
  };
}
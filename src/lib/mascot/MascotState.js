import { DEFAULT_EMOTION } from "./MascotEmotion";

/**
 * ==========================================================
 * MASCOT ENGINE v2.4
 * Module: MascotState
 * ----------------------------------------------------------
 * Estado interno completo de la mascota.
 *
 * Este archivo únicamente almacena datos.
 * No contiene lógica.
 * ==========================================================
 */

export function createMascotState() {
  return {
    // ======================================================
    // Estado general
    // ======================================================

    emotion: DEFAULT_EMOTION,

    direction: "front",

    visible: true,

    enabled: true,

    // ======================================================
    // Transformación global
    // ======================================================

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

    // ======================================================
    // Cursor
    // ======================================================

    cursor: {
      x: 0,
      y: 0,
    },

    lookingAtCursor: false,

    // ======================================================
    // Ojos
    // ======================================================

    eyes: {
      offsetX: 0,
      offsetY: 0,

      blinking: false,

      blinkProgress: 0,

      lastBlink: Date.now(),

      nextBlink: 3000,
    },

    // ======================================================
    // Respiración
    // ======================================================

    breathing: {
      enabled: true,

      phase: 0,

      strength: 0.015,
    },

    // ======================================================
    // Movimiento Idle
    // ======================================================

    idle: {
      enabled: true,

      phase: 0,

      offsetX: 0,

      offsetY: 0,
    },

    // ======================================================
    // Física
    // ======================================================

    physics: {
      grounded: true,

      jumping: false,

      falling: false,

      gravity: 0,

      friction: 0.9,
    },

    // ======================================================
    // Animaciones
    // ======================================================

    animation: {
      current: "idle",

      previous: null,

      playing: false,

      startedAt: Date.now(),

      progress: 0,
    },

    // ======================================================
    // Eventos
    // ======================================================

    currentEvent: null,

    lastEvent: null,

    // ======================================================
    // Temporizadores
    // ======================================================

    idleTime: 0,

    lastInteraction: Date.now(),

    createdAt: Date.now(),

    updatedAt: Date.now(),

    // ======================================================
    // Estado interno
    // ======================================================

    dirty: true,

    needsRender: true,

    frame: 0,
  };
}
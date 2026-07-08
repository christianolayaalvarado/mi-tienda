import {
  MascotEmotion,
  DEFAULT_EMOTION,
  isValidEmotion,
} from "./MascotEmotion";

import mascotEvents, {
  MascotEventTypes,
} from "./MascotEvents";

/**
 * ==========================================================
 * MASCOT ENGINE v2.4
 * Module: MascotBrain
 * ----------------------------------------------------------
 * Cerebro principal de la mascota.
 *
 * Responsabilidades:
 *
 * • Decidir la emoción actual
 * • Gestionar el tiempo de inactividad
 * • Reaccionar a eventos
 * • Cambiar de dirección
 * • Preparar la IA futura
 * ==========================================================
 */

export default class MascotBrain {
  constructor(state) {
    this.state = state;

    this.eventUnsubscribers = [];

    this.registerEvents();
  }

  // =====================================================
  // Eventos
  // =====================================================

  registerEvents() {
    this.eventUnsubscribers.push(
      mascotEvents.on(
        MascotEventTypes.USER_INTERACTION,
        () => this.onUserInteraction()
      )
    );

    this.eventUnsubscribers.push(
      mascotEvents.on(
        MascotEventTypes.CURSOR_MOVE,
        (cursor) => this.onCursorMove(cursor)
      )
    );

    this.eventUnsubscribers.push(
      mascotEvents.on(
        MascotEventTypes.ORDER_PAID,
        () => this.setEmotion(MascotEmotion.CELEBRATING)
      )
    );

    this.eventUnsubscribers.push(
      mascotEvents.on(
        MascotEventTypes.PRODUCT_CREATED,
        () => this.setEmotion(MascotEmotion.HAPPY)
      )
    );

    this.eventUnsubscribers.push(
      mascotEvents.on(
        MascotEventTypes.ACHIEVEMENT_UNLOCKED,
        () => this.setEmotion(MascotEmotion.PROUD)
      )
    );
  }

  destroy() {
    this.eventUnsubscribers.forEach((unsubscribe) => unsubscribe());

    this.eventUnsubscribers = [];
  }

  // =====================================================
  // Emociones
  // =====================================================

  setEmotion(emotion) {
    if (!isValidEmotion(emotion)) return;

    if (this.state.emotion === emotion) return;

    this.state.emotion = emotion;

    mascotEvents.emit(
      MascotEventTypes.EMOTION_CHANGED,
      emotion
    );
  }

  resetEmotion() {
    this.setEmotion(DEFAULT_EMOTION);
  }

  getEmotion() {
    return this.state.emotion;
  }

  // =====================================================
  // Interacción
  // =====================================================

  interact() {
    this.state.lastInteraction = Date.now();
    this.state.idleTime = 0;
  }

  onUserInteraction() {
    this.interact();

    this.setEmotion(MascotEmotion.HAPPY);
  }

  onCursorMove(cursor = {}) {
    this.state.cursor.x = cursor.x ?? 0;
    this.state.cursor.y = cursor.y ?? 0;

    this.state.lookingAtCursor = true;

    if (this.state.emotion === MascotEmotion.IDLE) {
      this.setEmotion(MascotEmotion.LOOKING);
    }
  }

  // =====================================================
  // IA
  // =====================================================

  update(deltaTime = 0) {
    this.state.idleTime += deltaTime;

    // ---------------------------------
    // 5 segundos
    // ---------------------------------

    if (
      this.state.idleTime > 5 &&
      this.state.emotion === MascotEmotion.HAPPY
    ) {
      this.setEmotion(MascotEmotion.IDLE);
    }

    // ---------------------------------
    // 10 segundos
    // ---------------------------------

    if (
      this.state.idleTime > 10 &&
      this.state.emotion === MascotEmotion.IDLE
    ) {
      this.setEmotion(MascotEmotion.LOOKING);
    }

    // ---------------------------------
    // 20 segundos
    // ---------------------------------

    if (
      this.state.idleTime > 20 &&
      this.state.emotion === MascotEmotion.LOOKING
    ) {
      this.setEmotion(MascotEmotion.THINKING);
    }

    // ---------------------------------
    // 35 segundos
    // ---------------------------------

    if (
      this.state.idleTime > 35 &&
      this.state.emotion === MascotEmotion.THINKING
    ) {
      this.setEmotion(MascotEmotion.SLEEPY);
    }

    // ---------------------------------
    // Dirección automática
    // ---------------------------------

    const vx = this.state.velocity.x;

    if (vx > 2) {
      this.state.direction = "right";
    } else if (vx < -2) {
      this.state.direction = "left";
    } else {
      this.state.direction = "front";
    }
  }
}
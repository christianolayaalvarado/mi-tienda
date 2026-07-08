/**
 * ==========================================================
 * MASCOT ENGINE v2.3
 * Module: MascotEvents
 * ----------------------------------------------------------
 * Bus de eventos oficial del Character Engine.
 *
 * Basado en Observer.
 *
 * Permite que cualquier módulo del motor publique eventos
 * sin conocer quién los escucha.
 * ==========================================================
 */

import Observer from "./core/Observer";

/**
 * Eventos oficiales del Character Engine.
 */
export const MascotEventTypes = Object.freeze({
  // ======================================================
  // Usuario
  // ======================================================

  USER_INTERACTION: "USER_INTERACTION",
  USER_IDLE: "USER_IDLE",

  CURSOR_MOVE: "CURSOR_MOVE",
  CLICK: "CLICK",

  // ======================================================
  // Marketplace
  // ======================================================

  STORE_CREATED: "STORE_CREATED",

  PRODUCT_CREATED: "PRODUCT_CREATED",
  PRODUCT_UPDATED: "PRODUCT_UPDATED",
  PRODUCT_DELETED: "PRODUCT_DELETED",

  ORDER_CREATED: "ORDER_CREATED",
  ORDER_PAID: "ORDER_PAID",
  ORDER_CANCELLED: "ORDER_CANCELLED",
  ORDER_COMPLETED: "ORDER_COMPLETED",

  REVIEW_RECEIVED: "REVIEW_RECEIVED",

  CHAT_MESSAGE: "CHAT_MESSAGE",

  ACHIEVEMENT_UNLOCKED: "ACHIEVEMENT_UNLOCKED",

  // ======================================================
  // Mascota
  // ======================================================

  EMOTION_CHANGED: "EMOTION_CHANGED",
  STATE_CHANGED: "STATE_CHANGED",

  ANIMATION_STARTED: "ANIMATION_STARTED",
  ANIMATION_FINISHED: "ANIMATION_FINISHED",

  // ======================================================
  // Motor
  // ======================================================

  ENGINE_INITIALIZED: "ENGINE_INITIALIZED",
  ENGINE_RESET: "ENGINE_RESET",
  ENGINE_DESTROYED: "ENGINE_DESTROYED",
});

class MascotEvents {
  constructor() {
    /**
     * Map<string, Observer>
     */
    this.channels = new Map();
  }

  /**
   * Obtiene (o crea) el canal correspondiente.
   *
   * @param {string} eventName
   * @returns {Observer}
   */
  getChannel(eventName) {
    if (!this.channels.has(eventName)) {
      this.channels.set(eventName, new Observer());
    }

    return this.channels.get(eventName);
  }

  /**
   * Registrar listener.
   *
   * @param {string} eventName
   * @param {Function} callback
   * @returns {Function}
   */
  on(eventName, callback) {
    return this.getChannel(eventName).subscribe(callback);
  }

  /**
   * Eliminar listener.
   *
   * @param {string} eventName
   * @param {Function} callback
   */
  off(eventName, callback) {
    const channel = this.channels.get(eventName);

    if (!channel) return;

    channel.unsubscribe(callback);

    if (channel.size() === 0) {
      this.channels.delete(eventName);
    }
  }

  /**
   * Emitir evento.
   *
   * @param {string} eventName
   * @param {*} payload
   */
  emit(eventName, payload = null) {
    const channel = this.channels.get(eventName);

    if (!channel) return;

    channel.notify(payload);
  }

  /**
   * Eliminar todos los eventos.
   */
  clear() {
    this.channels.clear();
  }

  /**
   * Número de listeners.
   *
   * @param {string} eventName
   * @returns {number}
   */
  listenerCount(eventName) {
    return this.channels.get(eventName)?.size() ?? 0;
  }

  /**
   * Eventos registrados.
   *
   * @returns {string[]}
   */
  getRegisteredEvents() {
    return [...this.channels.keys()];
  }

  /**
   * ¿Existe el evento?
   *
   * @param {string} eventName
   * @returns {boolean}
   */
  hasEvent(eventName) {
    return this.channels.has(eventName);
  }

  /**
   * Número total de canales registrados.
   *
   * @returns {number}
   */
  eventCount() {
    return this.channels.size;
  }
}

const mascotEvents = new MascotEvents();

export default mascotEvents;
/**
 * =========================================================
 * MASCOT ENGINE v2.3
 * Module: Observer
 * ---------------------------------------------------------
 * Sistema de publicación/suscripción reutilizable.
 *
 * Puede utilizarse por cualquier módulo del Character Engine.
 * =========================================================
 */

export default class Observer {
  constructor() {
    this.listeners = new Set();
  }

  /**
   * Registra un listener.
   *
   * @param {Function} callback
   * @returns {Function} unsubscribe
   */
  subscribe(callback) {
    if (typeof callback !== "function") {
      return () => { };
    }

    this.listeners.add(callback);

    return () => {
      this.unsubscribe(callback);
    };
  }

  /**
   * Elimina un listener.
   *
   * @param {Function} callback
   */
  unsubscribe(callback) {
    this.listeners.delete(callback);
  }

  /**
   * Notifica a todos los listeners.
   *
   * @param {*} payload
   */
  notify(payload = null) {
    for (const callback of this.listeners) {
      try {
        callback(payload);
      } catch (error) {
        console.error("[Observer]", error);
      }
    }
  }

  /**
   * Elimina todos los listeners.
   */
  clear() {
    this.listeners.clear();
  }

  /**
   * Devuelve el número de listeners.
   *
   * @returns {number}
   */
  size() {
    return this.listeners.size;
  }

  /**
   * Indica si existen listeners registrados.
   *
   * @returns {boolean}
   */
  hasListeners() {
    return this.listeners.size > 0;
  }
}
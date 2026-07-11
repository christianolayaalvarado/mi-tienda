/**
 * =========================================================
 * MASCOT ENGINE v2.7
 * Module: Observer
 * ---------------------------------------------------------
 * Sistema Publish / Subscribe reutilizable.
 * =========================================================
 */

export default class Observer {
  constructor() {
    this.listeners = new Set();
  }

  subscribe(callback) {
    if (typeof callback !== "function") {
      return () => { };
    }

    this.listeners.add(callback);

    return () => this.unsubscribe(callback);
  }

  unsubscribe(callback) {
    this.listeners.delete(callback);
  }

  notify(payload = null) {
    if (this.listeners.size === 0) return;

    [...this.listeners].forEach((callback) => {
      try {
        callback(payload);
      } catch (error) {
        console.error("[Observer]", error);
      }
    });
  }

  clear() {
    this.listeners.clear();
  }

  size() {
    return this.listeners.size;
  }

  hasListeners() {
    return this.listeners.size > 0;
  }

  once(callback) {
    const unsubscribe = this.subscribe((payload) => {
      unsubscribe();
      callback(payload);
    });

    return unsubscribe;
  }
}
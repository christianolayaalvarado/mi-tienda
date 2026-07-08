/**
 * ==========================================================
 * MASCOT ENGINE v2.3
 * Module: MascotLoop
 * ----------------------------------------------------------
 * Game Loop principal del Character Engine.
 *
 * Responsabilidades:
 *
 * • Ejecutar requestAnimationFrame
 * • Calcular deltaTime
 * • Actualizar el MascotEngine
 * • Notificar nuevos frames mediante Observer
 * • Permitir iniciar, pausar y detener el motor
 * ==========================================================
 */

import mascotEngine from "../MascotEngine";
import Observer from "./Observer";

class MascotLoop {
  constructor() {
    this.running = false;
    this.paused = false;

    this.frameId = null;
    this.lastTime = 0;

    this.boundLoop = this.loop.bind(this);

    // Sistema de eventos
    this.observer = new Observer();
  }

  /**
   * Inicia el loop.
   */
  start() {
    if (this.running) return;

    if (!mascotEngine.isInitialized()) {
      mascotEngine.initialize();
    }

    this.running = true;
    this.paused = false;

    this.lastTime = performance.now();

    this.frameId = requestAnimationFrame(this.boundLoop);

    console.log("[MascotLoop] Started");
  }

  /**
   * Loop principal.
   */
  loop(now) {
    if (!this.running) return;

    if (this.paused) {
      this.lastTime = now;
      this.frameId = requestAnimationFrame(this.boundLoop);
      return;
    }

    const deltaTime = (now - this.lastTime) / 1000;

    this.lastTime = now;

    mascotEngine.update(deltaTime);

    // Notificar un nuevo frame
    this.observer.notify(mascotEngine.getRenderState());

    this.frameId = requestAnimationFrame(this.boundLoop);
  }

  /**
   * Suscribirse a los nuevos frames.
   */
  subscribe(callback) {
    return this.observer.subscribe(callback);
  }

  /**
   * Cancelar suscripción.
   */
  unsubscribe(callback) {
    this.observer.unsubscribe(callback);
  }

  /**
   * Eliminar todos los listeners.
   */
  clearSubscribers() {
    this.observer.clear();
  }

  /**
   * Número de listeners.
   */
  getSubscriberCount() {
    return this.observer.size();
  }

  /**
   * Pausar.
   */
  pause() {
    this.paused = true;
  }

  /**
   * Reanudar.
   */
  resume() {
    this.paused = false;
    this.lastTime = performance.now();
  }

  /**
   * Detener completamente el loop.
   */
  stop() {
    this.running = false;
    this.paused = false;

    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
    }

    this.frameId = null;
  }

  /**
   * Estado del loop.
   */
  isRunning() {
    return this.running;
  }

  isPaused() {
    return this.paused;
  }
}

const mascotLoop = new MascotLoop();

export default mascotLoop;
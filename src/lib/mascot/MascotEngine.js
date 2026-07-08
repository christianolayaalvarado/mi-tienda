import MascotBrain from "./MascotBrain";
import { createMascotState } from "./MascotState";
import mascotEvents from "./MascotEvents";
import { RenderPipeline } from "./renderer/RenderPipeline";

/**
 * ==========================================================
 * Mascot Engine v2.0
 * ----------------------------------------------------------
 * Core del sistema de la mascota.
 *
 * Responsabilidades:
 *
 * • Crear el estado
 * • Crear el cerebro
 * • Crear el Render Pipeline
 * • Actualizar toda la lógica
 * • Generar el Render State
 * • Gestionar el ciclo de vida
 *
 * React nunca debería conocer MascotBrain ni RenderPipeline.
 * Solo debe comunicarse con MascotEngine.
 * ==========================================================
 */

class MascotEngine {
  constructor() {
    this.initialized = false;

    this.state = null;

    this.brain = null;

    this.pipeline = null;

    this.renderState = null;

    this.lastUpdate = 0;
  }

  /**
   * Inicializa el motor.
   * Solo puede ejecutarse una vez.
   */
  initialize() {
    if (this.initialized) return;

    this.state = createMascotState();

    this.brain = new MascotBrain(this.state);

    this.pipeline = new RenderPipeline();

    this.renderState = this.pipeline.render(this.state);

    this.lastUpdate = performance.now();

    this.initialized = true;

    console.log("[MascotEngine] Initialized");
  }

  /**
   * Actualiza todo el motor.
   * Debe ejecutarse una vez por frame.
   *
   * @param {number|null} deltaTime
   */
  update(deltaTime = null) {
    if (!this.initialized) return;

    // Si no se proporciona deltaTime,
    // se calcula automáticamente.
    if (deltaTime === null) {
      const now = performance.now();

      deltaTime = (now - this.lastUpdate) / 1000;

      this.lastUpdate = now;
    }

    // Actualizar IA
    this.brain.update(deltaTime);

    // Actualizar Render Pipeline
    this.renderState = this.pipeline.render(this.state);
  }

  /**
   * Reinicia completamente el motor.
   */
  reset() {
    this.state = createMascotState();

    this.brain = new MascotBrain(this.state);

    this.pipeline = new RenderPipeline();

    this.renderState = this.pipeline.render(this.state);

    this.lastUpdate = performance.now();
  }

  /**
   * Libera recursos.
   */
  destroy() {
    mascotEvents.clear();

    this.initialized = false;

    this.state = null;

    this.brain = null;

    this.pipeline = null;

    this.renderState = null;

    this.lastUpdate = 0;
  }

  /**
   * Devuelve el estado interno.
   */
  getState() {
    return this.state;
  }

  /**
   * Devuelve el cerebro.
   */
  getBrain() {
    return this.brain;
  }

  /**
   * Devuelve el último estado de render.
   */
  getRenderState() {
    return this.renderState;
  }

  /**
   * Devuelve el Render Pipeline.
   * Útil para depuración y futuras extensiones.
   */
  getPipeline() {
    return this.pipeline;
  }

  /**
   * Indica si el motor está inicializado.
   */
  isInitialized() {
    return this.initialized;
  }

  /**
   * Emite un evento del Marketplace.
   *
   * @param {string} eventName
   * @param {*} payload
   */
  emit(eventName, payload = null) {
    mascotEvents.emit(eventName, payload);
  }
}

const mascotEngine = new MascotEngine();

export default mascotEngine;
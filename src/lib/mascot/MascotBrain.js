import { MascotEmotion, DEFAULT_EMOTION } from "./MascotEmotion";

/**
 * ==========================================================
 * Mascot Engine v1.0
 * Mascot Brain
 * ----------------------------------------------------------
 * Responsable de decidir qué emoción debe tener la mascota.
 * No dibuja nada.
 * No modifica el DOM.
 * Solo actualiza el estado.
 * ==========================================================
 */

export default class MascotBrain {
  constructor(state) {
    this.state = state;
  }

  /**
   * Cambia la emoción actual.
   */
  setEmotion(emotion) {
    if (!Object.values(MascotEmotion).includes(emotion)) {
      return;
    }

    this.state.emotion = emotion;
  }

  /**
   * Reinicia la emoción.
   */
  resetEmotion() {
    this.state.emotion = DEFAULT_EMOTION;
  }

  /**
   * Devuelve la emoción actual.
   */
  getEmotion() {
    return this.state.emotion;
  }

  /**
   * La mascota ha recibido interacción.
   */
  interact() {
    this.state.lastInteraction = Date.now();
    this.state.idleTime = 0;
  }

  /**
   * Actualización periódica.
   * Aquí irá creciendo el comportamiento del personaje.
   */
  update(deltaTime = 0) {
    this.state.idleTime += deltaTime;

    // Por ahora el cerebro no toma decisiones.
    // Las añadiremos poco a poco.
  }
}
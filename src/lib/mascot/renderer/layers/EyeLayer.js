// =========================================================
// MASCOT ENGINE v2.2
// Module: EyeLayer
// ---------------------------------------------------------
// Aplica el movimiento de los ojos siguiendo el cursor.
// No dibuja nada.
// Solamente modifica renderState.transform.parts.eyes.
// =========================================================

export class EyeLayer {
  constructor() {
    this.maxOffset = 4;
    this.smoothing = 0.18;

    this.currentX = 0;
    this.currentY = 0;
  }

  /**
   * Aplica el movimiento de los ojos.
   *
   * @param {Object} renderState
   * @param {Object} mascotState
   * @returns {Object}
   */
  apply(renderState, mascotState) {
    if (!renderState.transform) {
      return renderState;
    }

    const cursor = mascotState.cursor ?? {
      x: 0,
      y: 0,
    };

    const viewportWidth =
      typeof window !== "undefined"
        ? window.innerWidth
        : 1;

    const viewportHeight =
      typeof window !== "undefined"
        ? window.innerHeight
        : 1;

    // Cursor normalizado (-1 → 1)

    const normalizedX =
      (cursor.x / viewportWidth) * 2 - 1;

    const normalizedY =
      (cursor.y / viewportHeight) * 2 - 1;

    const targetX = normalizedX * this.maxOffset;
    const targetY = normalizedY * this.maxOffset;

    // Movimiento suavizado

    this.currentX +=
      (targetX - this.currentX) *
      this.smoothing;

    this.currentY +=
      (targetY - this.currentY) *
      this.smoothing;

    return {
      ...renderState,

      transform: {
        ...renderState.transform,

        parts: {
          ...renderState.transform.parts,

          eyes: {
            translateX: this.currentX,
            translateY: this.currentY,
          },
        },
      },
    };
  }

  /**
   * Reinicia el estado interno.
   */
  reset() {
    this.currentX = 0;
    this.currentY = 0;
  }

  /**
   * Permite cambiar la intensidad del seguimiento.
   */
  setMaxOffset(value) {
    this.maxOffset = value;
  }

  /**
   * Permite cambiar el suavizado.
   */
  setSmoothing(value) {
    this.smoothing = value;
  }
}
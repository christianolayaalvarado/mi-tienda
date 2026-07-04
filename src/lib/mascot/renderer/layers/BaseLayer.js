// =========================================================
// MASCOT ENGINE
// Module: BaseLayer
// Responsibility:
// Creates the initial render state used by all render
// layers. Every subsequent layer extends or modifies
// this state.
// =========================================================

export class BaseLayer {
  /**
   * Creates the base render state.
   *
   * @param {Object} renderState
   * @param {Object} mascotState
   * @returns {Object}
   */
  apply(renderState = {}, mascotState = {}) {
    return {
      ...renderState,

      // =====================================================
      // Position
      // =====================================================

      position: {
        x: 0,
        y: 0,
      },

      // =====================================================
      // Transformations
      // =====================================================

      transform: {
        global: {
          translateX: 0,
          translateY: 0,
          scale: 1,
          rotation: 0,
        },

        parts: {
          body: {},
          head: {},
          eyes: {},
          ears: {},
          tail: {},
          accessory: {},
        },
      },

      // =====================================================
      // Visual
      // =====================================================

      opacity: 1,

      filters: {
        brightness: 1,
        saturation: 1,
        blur: 0,
        hue: 0,
      },

      // =====================================================
      // Orientation
      // =====================================================

      view: mascotState.direction || "front",

      // =====================================================
      // Animation metadata
      // =====================================================

      animation: {},
    };
  }
}
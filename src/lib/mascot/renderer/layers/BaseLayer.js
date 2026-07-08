// =========================================================
// MASCOT ENGINE v2.7
// Module: BaseLayer
// ---------------------------------------------------------
// Inicializa el RenderState completo utilizado por todas
// las capas del Render Pipeline.
// =========================================================

export class BaseLayer {
  apply(renderState = {}, mascotState = {}) {
    return {
      ...renderState,

      // =====================================================
      // Posición
      // =====================================================

      position: {
        x: 0,
        y: 0,
      },

      // =====================================================
      // Transformaciones
      // =====================================================

      transform: {
        global: {
          translateX: 0,
          translateY: 0,

          rotation: 0,

          scale: 1,
          scaleX: 1,
          scaleY: 1,

          skewX: 0,
          skewY: 0,

          pivotX: 0,
          pivotY: 0,
        },

        parts: {
          body: {
            translateX: 0,
            translateY: 0,
            rotation: 0,
            scale: 1,
            scaleX: 1,
            scaleY: 1,
          },

          head: {
            translateX: 0,
            translateY: 0,
            rotation: 0,
            scale: 1,
            scaleX: 1,
            scaleY: 1,
          },

          leftEar: {
            translateX: 0,
            translateY: 0,
            rotation: 0,
            scale: 1,
          },

          rightEar: {
            translateX: 0,
            translateY: 0,
            rotation: 0,
            scale: 1,
          },

          leftArm: {
            translateX: 0,
            translateY: 0,
            rotation: 0,
            scale: 1,
          },

          rightArm: {
            translateX: 0,
            translateY: 0,
            rotation: 0,
            scale: 1,
          },

          leftLeg: {
            translateX: 0,
            translateY: 0,
            rotation: 0,
            scale: 1,
          },

          rightLeg: {
            translateX: 0,
            translateY: 0,
            rotation: 0,
            scale: 1,
          },

          eyes: {
            translateX: 0,
            translateY: 0,
            rotation: 0,
            scale: 1,

            blink: 1,
            pupilX: 0,
            pupilY: 0,
          },

          tail: {
            translateX: 0,
            translateY: 0,
            rotation: 0,
            scale: 1,
          },

          shadow: {
            translateX: 0,
            translateY: 0,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
            opacity: 1,
          },

          accessory: {
            translateX: 0,
            translateY: 0,
            rotation: 0,
            scale: 1,
          },
        },
      },

      // =====================================================
      // Apariencia
      // =====================================================

      opacity: mascotState.visible === false ? 0 : 1,

      visible: mascotState.visible !== false,

      zIndex: 0,

      // =====================================================
      // Filtros
      // =====================================================

      filters: {
        brightness: 1,
        saturation: 1,
        contrast: 1,
        blur: 0,
        hue: 0,
        grayscale: 0,
      },

      // =====================================================
      // CSS generado por el pipeline
      // =====================================================

      transformCSS: "",

      filterCSS: "",

      // =====================================================
      // Orientación
      // =====================================================

      view: mascotState.direction ?? "front",

      // =====================================================
      // Información de animación
      // =====================================================

      animation: {
        current: mascotState.animation?.current ?? "idle",
        progress: mascotState.animation?.progress ?? 0,
        playing: mascotState.animation?.playing ?? false,
      },
    };
  }
}
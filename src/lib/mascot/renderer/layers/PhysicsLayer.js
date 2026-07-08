// =========================================================
// MASCOT ENGINE v2.6
// Module: PhysicsLayer
// ---------------------------------------------------------
// Aplica las transformaciones físicas del personaje.
//
// No modifica MascotState.
// Solo interpreta los datos físicos para generar el
// RenderState.
//
// Controla:
//
// • Posición
// • Velocidad
// • Inercia
// • Gravedad
// • Salto
// • Rebote
// =========================================================

export class PhysicsLayer {
  apply(renderState, mascotState) {
    const global = {
      ...(renderState.transform?.global ?? {}),
    };

    const physics = mascotState.physics ?? {};

    const position = mascotState.position ?? {};

    const velocity = mascotState.velocity ?? {};

    global.translateX += position.x ?? 0;
    global.translateY += position.y ?? 0;

    // Inclinación por movimiento horizontal
    global.rotation += (velocity.x ?? 0) * 0.8;

    // Compresión al caer
    if (physics.falling) {
      global.scaleX = 1.04;
      global.scaleY = 0.96;
    }

    // Estiramiento al saltar
    if (physics.jumping) {
      global.scaleX = 0.97;
      global.scaleY = 1.05;
    }

    // Compresión al aterrizar
    if (physics.grounded && Math.abs(velocity.y ?? 0) > 2) {
      global.scaleX = 1.05;
      global.scaleY = 0.95;
    }

    return {
      ...renderState,

      transform: {
        ...(renderState.transform ?? {}),

        global: {
          translateX: global.translateX ?? 0,
          translateY: global.translateY ?? 0,

          rotation: global.rotation ?? 0,

          scale: global.scale ?? 1,

          scaleX: global.scaleX ?? 1,
          scaleY: global.scaleY ?? 1,
        },

        parts: {
          ...(renderState.transform?.parts ?? {}),
        },
      },
    };
  }
}
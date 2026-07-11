// =========================================================
// MASCOT ENGINE v2.7
// Module: PhysicsLayer
// ---------------------------------------------------------
// Interpreta el estado físico del personaje y aplica
// transformaciones globales al RenderState.
// =========================================================

export class PhysicsLayer {
  apply(renderState = {}, mascotState = {}) {
    const transform = renderState.transform ?? {};

    const global = {
      translateX: 0,
      translateY: 0,
      rotation: 0,
      scale: 1,
      scaleX: 1,
      scaleY: 1,
      ...(transform.global ?? {}),
    };

    const physics = mascotState.physics ?? {};
    const position = mascotState.position ?? {};
    const velocity = mascotState.velocity ?? {};

    // =====================================================
    // Posición
    // =====================================================

    global.translateX += position.x ?? 0;
    global.translateY += position.y ?? 0;

    // =====================================================
    // Inclinación horizontal
    // =====================================================

    const vx = velocity.x ?? 0;
    const vy = velocity.y ?? 0;

    global.rotation += Math.max(
      -12,
      Math.min(12, vx * 0.8)
    );

    // =====================================================
    // Compresión y estiramiento
    // =====================================================

    if (physics.jumping) {
      global.scaleX *= 0.97;
      global.scaleY *= 1.05;
    }

    if (physics.falling) {
      global.scaleX *= 1.04;
      global.scaleY *= 0.96;
    }

    if (physics.grounded && Math.abs(vy) > 2) {
      global.scaleX *= 1.05;
      global.scaleY *= 0.95;
    }

    // =====================================================
    // Rebote
    // =====================================================

    if (physics.bouncing) {
      const bounce =
        Math.sin((physics.bounceTime ?? 0) * 18) * 2;

      global.translateY -= bounce;
    }

    // =====================================================
    // Inercia
    // =====================================================

    if (physics.inertia) {
      global.translateX += vx * 0.15;
    }

    return {
      ...renderState,

      transform: {
        ...transform,

        global,

        parts: {
          ...(transform.parts ?? {}),
        },
      },
    };
  }
}
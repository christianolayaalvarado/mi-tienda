// =========================================================
// MASCOT ENGINE v2
// Module: AnimationClock
// Responsibility:
// Provides a shared animation time source for the mascot
// engine. All animation layers should use this clock.
// =========================================================

class AnimationClock {
  constructor() {
    this.startTime = performance.now();
  }

  /**
   * Returns the elapsed time in seconds.
   */
  getTime() {
    return (performance.now() - this.startTime) / 1000;
  }

  /**
   * Resets the clock.
   */
  reset() {
    this.startTime = performance.now();
  }
}

export const animationClock = new AnimationClock();
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
    this.lastTime = this.startTime;

    this.deltaTime = 0;

    this.paused = false;
    this.pauseTime = null;
  }

  /**
   * Returns the elapsed time in seconds.
   */
  getTime() {
    if (this.paused) {
      return (this.pauseTime - this.startTime) / 1000;
    }

    return (performance.now() - this.startTime) / 1000;
  }

  /**
   * Updates the internal clock.
   * Should be called once per frame.
   *
   * @returns {number} Delta time in seconds.
   */
  update() {
    if (this.paused) {
      this.deltaTime = 0;
      return this.deltaTime;
    }

    const now = performance.now();

    this.deltaTime = (now - this.lastTime) / 1000;

    this.lastTime = now;

    return this.deltaTime;
  }

  /**
   * Returns the last computed delta time.
   */
  getDeltaTime() {
    return this.deltaTime;
  }

  /**
   * Pauses the animation clock.
   */
  pause() {
    if (this.paused) return;

    this.paused = true;
    this.pauseTime = performance.now();
  }

  /**
   * Resumes the animation clock.
   */
  resume() {
    if (!this.paused) return;

    const now = performance.now();
    const pausedDuration = now - this.pauseTime;

    this.startTime += pausedDuration;
    this.lastTime = now;

    this.pauseTime = null;
    this.paused = false;
  }

  /**
   * Resets the clock.
   */
  reset() {
    this.startTime = performance.now();
    this.lastTime = this.startTime;

    this.deltaTime = 0;

    this.paused = false;
    this.pauseTime = null;
  }

  /**
   * Returns whether the clock is currently paused.
   */
  isPaused() {
    return this.paused;
  }
}

export const animationClock = new AnimationClock();
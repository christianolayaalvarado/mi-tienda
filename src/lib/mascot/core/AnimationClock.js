// =========================================================
// MASCOT ENGINE v2.7
// Module: AnimationClock
// ---------------------------------------------------------
// Reloj global utilizado por todo el Mascot Engine.
// =========================================================

class AnimationClock {
  constructor() {
    this.reset();
  }

  getTime() {
    if (this.paused) {
      return (this.pauseTime - this.startTime) / 1000;
    }

    return (performance.now() - this.startTime) / 1000;
  }

  update() {
    if (this.paused) {
      this.deltaTime = 0;
      return 0;
    }

    const now = performance.now();

    this.deltaTime = Math.min(
      (now - this.lastTime) / 1000,
      0.05
    );

    this.lastTime = now;

    this.frame++;

    this.fps =
      this.deltaTime > 0
        ? Math.round(1 / this.deltaTime)
        : 0;

    return this.deltaTime;
  }

  getDeltaTime() {
    return this.deltaTime;
  }

  getFPS() {
    return this.fps;
  }

  getFrame() {
    return this.frame;
  }

  pause() {
    if (this.paused) return;

    this.paused = true;
    this.pauseTime = performance.now();
  }

  resume() {
    if (!this.paused) return;

    const now = performance.now();
    const pausedDuration = now - this.pauseTime;

    this.startTime += pausedDuration;
    this.lastTime = now;

    this.pauseTime = null;
    this.paused = false;
  }

  reset() {
    const now = performance.now();

    this.startTime = now;
    this.lastTime = now;

    this.deltaTime = 0;

    this.frame = 0;
    this.fps = 0;

    this.paused = false;
    this.pauseTime = 0;
  }

  isPaused() {
    return this.paused;
  }
}

export const animationClock = new AnimationClock();
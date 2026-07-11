/**
 * ==========================================================
 * MASCOT ENGINE v2.7
 * Module: MascotLoop
 * ----------------------------------------------------------
 * Game Loop principal del Mascot Engine.
 * ==========================================================
 */

import mascotEngine from "../MascotEngine";
import { animationClock } from "./AnimationClock";
import Observer from "./Observer";

class MascotLoop {
  constructor() {
    this.running = false;
    this.paused = false;

    this.frameId = null;

    this.boundLoop = this.loop.bind(this);

    this.observer = new Observer();
  }

  start() {
    if (this.running) return;

    if (!mascotEngine.isInitialized()) {
      mascotEngine.initialize();
    }

    animationClock.reset();

    this.running = true;
    this.paused = false;

    this.frameId = requestAnimationFrame(this.boundLoop);
  }

  loop() {
    if (!this.running) return;

    if (this.paused) {
      this.frameId = requestAnimationFrame(this.boundLoop);
      return;
    }

    const deltaTime = animationClock.update();

    mascotEngine.update(deltaTime);

    this.observer.notify(
      mascotEngine.getRenderState()
    );

    this.frameId = requestAnimationFrame(this.boundLoop);
  }

  subscribe(callback) {
    return this.observer.subscribe(callback);
  }

  unsubscribe(callback) {
    this.observer.unsubscribe(callback);
  }

  clearSubscribers() {
    this.observer.clear();
  }

  getSubscriberCount() {
    return this.observer.size();
  }

  pause() {
    if (this.paused) return;

    this.paused = true;
    animationClock.pause();
  }

  resume() {
    if (!this.paused) return;

    this.paused = false;
    animationClock.resume();
  }

  stop() {
    this.running = false;
    this.paused = false;

    animationClock.reset();

    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
    }

    this.frameId = null;
  }

  isRunning() {
    return this.running;
  }

  isPaused() {
    return this.paused;
  }
}

const mascotLoop = new MascotLoop();

export default mascotLoop;
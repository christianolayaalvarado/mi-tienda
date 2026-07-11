import MascotBrain from "./MascotBrain";
import { createMascotState } from "./MascotState";
import mascotEvents from "./MascotEvents";
import { RenderPipeline } from "./renderer/RenderPipeline";
import { animationClock } from "./core/AnimationClock";

class MascotEngine {
  constructor() {
    this.initialized = false;

    this.state = null;
    this.brain = null;
    this.pipeline = null;

    this.renderState = null;
  }

  initialize() {
    if (this.initialized) return;

    animationClock.reset();

    this.state = createMascotState();

    this.brain = new MascotBrain(this.state);

    this.pipeline = new RenderPipeline();

    this.renderState = this.pipeline.render(this.state);

    this.initialized = true;
  }

  update(deltaTime = animationClock.getDeltaTime()) {
    if (!this.initialized) return;

    this.brain.update(deltaTime);

    this.renderState =
      this.pipeline.render(this.state);
  }

  reset() {
    animationClock.reset();

    this.state = createMascotState();

    this.brain = new MascotBrain(this.state);

    this.pipeline = new RenderPipeline();

    this.renderState =
      this.pipeline.render(this.state);
  }

  destroy() {
    mascotEvents.clear();

    animationClock.reset();

    this.initialized = false;

    this.state = null;
    this.brain = null;
    this.pipeline = null;
    this.renderState = null;
  }

  getState() {
    return this.state;
  }

  getBrain() {
    return this.brain;
  }

  getPipeline() {
    return this.pipeline;
  }

  getRenderState() {
    return this.renderState;
  }

  isInitialized() {
    return this.initialized;
  }

  emit(eventName, payload = null) {
    mascotEvents.emit(eventName, payload);
  }
}

const mascotEngine = new MascotEngine();

export default mascotEngine;
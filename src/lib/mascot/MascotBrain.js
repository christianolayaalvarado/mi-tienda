import {
  MascotEmotion,
  DEFAULT_EMOTION,
  isValidEmotion,
} from "./MascotEmotion";

import mascotEvents, {
  MascotEventTypes,
} from "./MascotEvents";

export default class MascotBrain {
  constructor(state) {
    this.state = state;
    this.eventUnsubscribers = [];

    this.registerEvents();
  }

  registerEvents() {
    this.eventUnsubscribers.push(
      mascotEvents.on(
        MascotEventTypes.USER_INTERACTION,
        () => this.onUserInteraction()
      )
    );

    this.eventUnsubscribers.push(
      mascotEvents.on(
        MascotEventTypes.ORDER_PAID,
        () => this.setEmotion(MascotEmotion.CELEBRATING)
      )
    );

    this.eventUnsubscribers.push(
      mascotEvents.on(
        MascotEventTypes.PRODUCT_CREATED,
        () => this.setEmotion(MascotEmotion.HAPPY)
      )
    );

    this.eventUnsubscribers.push(
      mascotEvents.on(
        MascotEventTypes.ACHIEVEMENT_UNLOCKED,
        () => this.setEmotion(MascotEmotion.PROUD)
      )
    );
  }

  destroy() {
    this.eventUnsubscribers.forEach((fn) => fn());
    this.eventUnsubscribers = [];
  }

  setEmotion(emotion) {
    if (!isValidEmotion(emotion)) return;

    if (emotion === this.state.emotion) return;

    this.state.emotion = emotion;

    mascotEvents.emit(
      MascotEventTypes.EMOTION_CHANGED,
      emotion
    );
  }

  resetEmotion() {
    this.setEmotion(DEFAULT_EMOTION);
  }

  getEmotion() {
    return this.state.emotion;
  }

  interact() {
    this.state.lastInteraction = Date.now();
    this.state.idleTime = 0;

    this.state.lookingAtCursor = true;
  }

  onUserInteraction() {
    this.interact();

    this.setEmotion(MascotEmotion.HAPPY);
  }

  update(deltaTime = 0) {
    this.state.idleTime += deltaTime;

    if (
      this.state.idleTime > 5 &&
      this.state.emotion === MascotEmotion.HAPPY
    ) {
      this.setEmotion(MascotEmotion.IDLE);
    }

    if (
      this.state.idleTime > 10 &&
      this.state.emotion === MascotEmotion.IDLE
    ) {
      this.setEmotion(MascotEmotion.LOOKING);
    }

    if (
      this.state.idleTime > 20 &&
      this.state.emotion === MascotEmotion.LOOKING
    ) {
      this.setEmotion(MascotEmotion.THINKING);
    }

    if (
      this.state.idleTime > 35 &&
      this.state.emotion === MascotEmotion.THINKING
    ) {
      this.setEmotion(MascotEmotion.SLEEPY);
    }

    if (
      this.state.idleTime > 60 &&
      this.state.emotion === MascotEmotion.SLEEPY
    ) {
      this.setEmotion(MascotEmotion.TIRED);
    }

    const vx = this.state.velocity?.x ?? 0;

    if (vx > 2) {
      this.state.direction = "right";
    } else if (vx < -2) {
      this.state.direction = "left";
    } else {
      this.state.direction = "front";
    }

    this.state.lookingAtCursor = false;
  }
}
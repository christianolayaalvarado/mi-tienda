// =========================================================
// MASCOT ENGINE v2.6
// Module: RenderPipeline
// =========================================================

import { BaseLayer } from "./layers/BaseLayer";

import { EmotionLayer } from "./layers/EmotionLayer";

import { BreathingLayer } from "./layers/BreathingLayer";
import { IdleLayer } from "./layers/IdleLayer";
import { BlinkLayer } from "./layers/BlinkLayer";

import { EyeLayer } from "./layers/EyeLayer";

import { BodyLayer } from "./layers/BodyLayer";
import { HeadLayer } from "./layers/HeadLayer";
import { EarLayer } from "./layers/EarLayer";
import { TailLayer } from "./layers/TailLayer";
import { ArmLayer } from "./layers/ArmLayer";
import { LegLayer } from "./layers/LegLayer";

import { PhysicsLayer } from "./layers/PhysicsLayer";

export class RenderPipeline {
  constructor() {
    this.layers = [];

    this.registerDefaultLayers();
  }

  registerDefaultLayers() {
    this.layers = [
      // Base
      new BaseLayer(),

      // Estado emocional
      new EmotionLayer(),

      // Movimiento natural
      new BreathingLayer(),
      new IdleLayer(),

      // Física
      new PhysicsLayer(),

      // Partes del personaje
      new BodyLayer(),
      new HeadLayer(),
      new EarLayer(),
      new TailLayer(),
      new ArmLayer(),
      new LegLayer(),

      // Cara
      new BlinkLayer(),
      new EyeLayer(),
    ];
  }

  render(mascotState) {
    let renderState = {};

    for (const layer of this.layers) {
      if (typeof layer.apply !== "function") continue;

      renderState = layer.apply(renderState, mascotState);
    }

    const global = renderState.transform?.global ?? {};

    renderState.transformCSS = `
      translate(${global.translateX ?? 0}px, ${global.translateY ?? 0}px)
      rotate(${global.rotation ?? 0}deg)
      scale(${global.scale ?? 1})
    `
      .replace(/\s+/g, " ")
      .trim();

    const filters = renderState.filters ?? {};

    renderState.filterCSS = `
      brightness(${filters.brightness ?? 1})
      saturate(${filters.saturation ?? 1})
      blur(${filters.blur ?? 0}px)
      hue-rotate(${filters.hue ?? 0}deg)
    `
      .replace(/\s+/g, " ")
      .trim();

    return renderState;
  }

  addLayer(layer) {
    if (!layer) return;

    const exists = this.layers.some(
      (registered) => registered.constructor === layer.constructor
    );

    if (exists) return;

    this.layers.push(layer);
  }

  insertLayer(index, layer) {
    if (!layer) return;

    const exists = this.layers.some(
      (registered) => registered.constructor === layer.constructor
    );

    if (exists) return;

    this.layers.splice(index, 0, layer);
  }

  removeLayer(layerClass) {
    this.layers = this.layers.filter(
      (layer) => !(layer instanceof layerClass)
    );
  }

  getLayer(layerClass) {
    return (
      this.layers.find(
        (layer) => layer instanceof layerClass
      ) ?? null
    );
  }

  reset() {
    this.layers = [];

    this.registerDefaultLayers();
  }

  clearLayers() {
    this.layers = [];
  }

  getLayers() {
    return [...this.layers];
  }

  size() {
    return this.layers.length;
  }
}
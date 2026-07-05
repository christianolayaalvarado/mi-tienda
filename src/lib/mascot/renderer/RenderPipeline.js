// =========================================================
// MASCOT ENGINE
// Module: RenderPipeline
// Responsibility:
// Executes all render layers sequentially and produces
// the final render state.
// =========================================================

import { BaseLayer } from "./layers/BaseLayer";
import { BreathingLayer } from "./layers/BreathingLayer";

export class RenderPipeline {
  constructor() {
    this.layers = [];

    this.registerDefaultLayers();
  }

  /**
   * Registers the default render layers.
   */
  registerDefaultLayers() {
    this.layers.push(new BaseLayer());
    this.layers.push(new BreathingLayer());
  }

  /**
   * Executes every registered layer.
   *
   * @param {Object} mascotState
   * @returns {Object}
   */
  process(mascotState) {
    let renderState = {};

    for (const layer of this.layers) {
      renderState = layer.apply(renderState, mascotState);
    }

    return renderState;
  }

  /**
   * Registers a new render layer.
   *
   * @param {Object} layer
   */
  addLayer(layer) {
    this.layers.push(layer);
  }

  /**
   * Removes all registered layers.
   */
  clearLayers() {
    this.layers = [];
  }

  /**
   * Returns the registered layers.
   */
  getLayers() {
    return [...this.layers];
  }
}
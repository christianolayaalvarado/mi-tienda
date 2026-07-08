// =========================================================
// MASCOT ENGINE v2
// Module: Random Utility
// Responsibility:
// Centralizes all random behavior used by the mascot.
// This avoids using Math.random() throughout the engine
// and makes natural behaviors consistent and configurable.
// =========================================================

class RandomEngine {
  /**
   * Returns a float between 0 and 1.
   *
   * @returns {number}
   */
  nextFloat() {
    return Math.random();
  }

  /**
   * Returns a float between min and max.
   *
   * @param {number} min
   * @param {number} max
   * @returns {number}
   */
  range(min, max) {
    return min + this.nextFloat() * (max - min);
  }

  /**
   * Returns an integer between min and max (inclusive).
   *
   * @param {number} min
   * @param {number} max
   * @returns {number}
   */
  nextInt(min, max) {
    return Math.floor(this.range(min, max + 1));
  }

  /**
   * Returns true with the given probability.
   *
   * Example:
   * random.chance(0.25) // 25%
   *
   * @param {number} probability
   * @returns {boolean}
   */
  chance(probability = 0.5) {
    return this.nextFloat() < probability;
  }

  /**
   * Returns a random element from an array.
   *
   * @param {Array} array
   * @returns {*}
   */
  pick(array = []) {
    if (!array.length) return null;

    return array[this.nextInt(0, array.length - 1)];
  }

  /**
   * Returns either -1 or 1.
   *
   * Useful for choosing a random direction.
   *
   * @returns {number}
   */
  sign() {
    return this.chance(0.5) ? 1 : -1;
  }
}

export const random = new RandomEngine();
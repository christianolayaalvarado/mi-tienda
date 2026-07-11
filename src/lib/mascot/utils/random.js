// =========================================================
// MASCOT ENGINE v2.7
// Module: Random Utility
// =========================================================

class RandomEngine {
  nextFloat() {
    return Math.random();
  }

  range(min, max) {
    return min + this.nextFloat() * (max - min);
  }

  nextInt(min, max) {
    return Math.floor(this.range(min, max + 1));
  }

  chance(probability = 0.5) {
    return this.nextFloat() < probability;
  }

  pick(array = []) {
    if (!Array.isArray(array) || array.length === 0) {
      return null;
    }

    return array[this.nextInt(0, array.length - 1)];
  }

  sign() {
    return this.chance() ? 1 : -1;
  }

  clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  lerp(start, end, t) {
    return start + (end - start) * t;
  }

  seed() {
    // reservado para futura implementación
  }
}

export const random = new RandomEngine();
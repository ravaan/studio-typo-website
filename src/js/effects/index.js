/**
 * Creative Effects - Export all project cover effects
 */

import { ParallaxCard } from "./ParallaxCard.js";
import { FlowField } from "./FlowField.js";
import { ParticleImage } from "./ParticleImage.js";
import { PixelSort } from "./PixelSort.js";
import { WaterRipple } from "./WaterRipple.js";

// Re-export all classes
export { ParallaxCard, FlowField, ParticleImage, PixelSort, WaterRipple };

// Effect map for easy instantiation
export const EFFECTS = {
  parallax: ParallaxCard,
  flowfield: FlowField,
  particles: ParticleImage,
  pixelsort: PixelSort,
  ripple: WaterRipple,
};

/**
 * Initialize an effect on a container
 */
export function initEffect(container, effectType, options = {}) {
  const EffectClass = EFFECTS[effectType];
  if (!EffectClass) {
    console.warn(`Unknown effect type: ${effectType}`);
    return null;
  }
  return new EffectClass(container, options);
}

/**
 * Initialize all effects on the page
 * Uses IntersectionObserver for lazy initialization
 */
export function initAllEffects() {
  const containers = document.querySelectorAll(
    ".effect-container[data-effect]",
  );
  const instances = [];
  const initialized = new WeakSet();

  const initContainer = (container) => {
    if (initialized.has(container)) return;

    const rect = container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const effectType = container.dataset.effect;
    const options = {};

    // Parse options from data attributes
    if (container.dataset.image) {
      options.image = container.dataset.image;
    }
    if (container.dataset.colors) {
      try {
        options.colors = JSON.parse(container.dataset.colors);
      } catch {
        // Ignore parse errors
      }
    }

    const instance = initEffect(container, effectType, options);
    if (instance) {
      instances.push(instance);
      initialized.add(container);
    }
  };

  // Use IntersectionObserver for lazy initialization
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          initContainer(entry.target);
        }
      });
    },
    { threshold: 0.1 },
  );

  containers.forEach((container) => {
    observer.observe(container);
  });

  return instances;
}

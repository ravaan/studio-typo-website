/**
 * ASCII Experiments v2
 * Grand, modern ASCII art experiments
 */

import { ImageReveal } from "./ImageReveal.js";
import { FluidSim } from "./FluidSim.js";
import { Creatures } from "./Creatures.js";
import { Landscape } from "./Landscape.js";
import { SoundViz } from "./SoundViz.js";
import { Cinema } from "./Cinema.js";
import { Excavation } from "./Excavation.js";
import { Constellations } from "./Constellations.js";
import { PhysicsType } from "./PhysicsType.js";

// Re-export all classes
export {
  ImageReveal,
  FluidSim,
  Creatures,
  Landscape,
  SoundViz,
  Cinema,
  Excavation,
  Constellations,
  PhysicsType,
};

// Effect registry for string-based instantiation
export const EXPERIMENTS = {
  "image-reveal": ImageReveal,
  fluid: FluidSim,
  creatures: Creatures,
  landscape: Landscape,
  sound: SoundViz,
  cinema: Cinema,
  excavation: Excavation,
  constellations: Constellations,
  "physics-type": PhysicsType,
};

/**
 * Initialize an experiment by name
 * @param {string} name - Experiment name
 * @param {HTMLElement} container - Container element
 * @param {Object} options - Experiment options
 * @returns {Object} Experiment instance
 */
export function initExperiment(name, container, options = {}) {
  const ExperimentClass = EXPERIMENTS[name];
  if (!ExperimentClass) {
    console.warn(`Unknown experiment: ${name}`);
    return null;
  }
  return new ExperimentClass(container, options);
}

/**
 * Initialize all experiments on the page
 * Looks for elements with data-experiment attribute
 */
export function initAllExperiments() {
  const containers = document.querySelectorAll("[data-experiment]");
  const instances = [];

  containers.forEach((container) => {
    const name = container.dataset.experiment;
    const instance = initExperiment(name, container);
    if (instance) {
      instances.push(instance);
    }
  });

  return instances;
}

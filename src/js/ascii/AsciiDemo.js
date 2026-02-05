/**
 * AsciiDemo - Initialize ASCII art demos in the Work section
 */

import { initAsciiArt } from "./index.js";

// Sample ASCII art for each demo
const ASCII_ARTS = {
  // Basic effects
  "matrix-art": `
┌─────────────────┐
│  ╔═══════════╗  │
│  ║  PROJECT  ║  │
│  ║   ALPHA   ║  │
│  ╚═══════════╝  │
│    ◆ ◆ ◆ ◆      │
└─────────────────┘`,

  "typewriter-art": `
   .---.
  /     \\
 | () () |
  \\  ^  /
   |||||
   |||||
  HELLO!`,

  "glitch-art": `
╭──────────────╮
│ GLITCH MODE  │
│ ░░░░░░░░░░░░ │
│ ▓▓▓▓▓▓▓▓▓▓▓▓ │
│ ████████████ │
╰──────────────╯`,

  "wave-art": `
    ~  ~  ~  ~
  ~   ~~~~   ~
 ~  ~~~~~~~~  ~
~  ~~~~~~~~~~  ~
~~~~~~~~~~~~~~~~
 ~~~~~~~~~~~~~~
   ~~~~~~~~~~
     ~~~~~~`,

  "particle-art": `
    *  *  *
  *   **   *
 *  * ** *  *
*  *  **  *  *
 *  * ** *  *
  *   **   *
    *  *  *`,

  // Advanced effects
  "chromatic-art": `
╔══════════════════════╗
║  ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄  ║
║  █ CHROMATIC SPLIT █  ║
║  ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀  ║
║   ╭───────────────╮   ║
║   │  RGB LAYERS   │   ║
║   ╰───────────────╯   ║
╚══════════════════════╝`,

  "magnetic-art": `
    ◇───────◇
   /         \\
  │  MAGNET   │
  │  CURSOR   │
  │   ◈ ◈ ◈   │
   \\         /
    ◇───────◇`,

  "holographic-art": `
╭────────────────────╮
│  ░▒▓ HOLOGRAM ▓▒░  │
│                    │
│   ╔════════════╗   │
│   ║  SCANNING  ║   │
│   ║   ▓▓▓▓▓▓   ║   │
│   ╚════════════╝   │
│                    │
╰────────────────────╯`,

  "liquid-art": `
   ╭─────────────╮
  /  ▓▓▓▓▓▓▓▓▓▓  \\
 │  ░▒▓ LIQUID ▓▒░ │
 │    ▓▓▓▓▓▓▓▓    │
 │   ░░░░░░░░░░   │
  \\  ▒▒▒▒▒▒▒▒▒▒  /
   ╰─────────────╯`,

  "perspective-art": `
╔════════════════════════╗
║                        ║
║    ╭────────────────╮  ║
║   /  3D PERSPECTIVE  \\ ║
║  │    ◆  ◆  ◆  ◆    │ ║
║  │    ◆  ◆  ◆  ◆    │ ║
║   \\                 /  ║
║    ╰────────────────╯  ║
║                        ║
╚════════════════════════╝`,
};

export class AsciiDemo {
  constructor() {
    this.instances = [];
    this.initialized = false;
  }

  /**
   * Initialize all ASCII art demos
   */
  init() {
    if (this.initialized) return;

    const containers = document.querySelectorAll(
      ".ascii-container[data-effect]",
    );

    containers.forEach((container) => {
      const effect = container.dataset.effect;
      const artKey = container.dataset.ascii;
      const asciiString = ASCII_ARTS[artKey];

      if (asciiString) {
        const instance = initAsciiArt(container, asciiString.trim(), effect);
        if (instance) {
          this.instances.push(instance);
        }
      }
    });

    this.initialized = true;
  }

  /**
   * Dispose all instances
   */
  dispose() {
    this.instances.forEach((instance) => instance.dispose?.());
    this.instances = [];
    this.initialized = false;
  }
}

// Singleton instance
let demoInstance = null;

export function initAsciiDemo() {
  if (!demoInstance) {
    demoInstance = new AsciiDemo();
  }
  demoInstance.init();
  return demoInstance;
}

export function disposeAsciiDemo() {
  if (demoInstance) {
    demoInstance.dispose();
    demoInstance = null;
  }
}

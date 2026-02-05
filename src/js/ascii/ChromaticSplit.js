/**
 * ChromaticSplit - RGB channel separation effect
 * Creates a cinematic "broken LCD" aesthetic with separated color layers
 */

import { AsciiArt } from "./AsciiArt.js";

export class ChromaticSplit extends AsciiArt {
  constructor(container, asciiString, options = {}) {
    super(container, asciiString, options);

    this.splitAmount = 0;
    this.targetSplit = 0;
    this.maxSplit = options.maxSplit || 8;
    this.easing = options.easing || 0.08;

    // Noise for subtle jitter
    this.noiseAmount = 0;
    this.noiseTime = 0;

    // Create RGB layers
    this.layers = {
      red: null,
      green: null,
      blue: null,
    };

    this.initChromatic();
  }

  initChromatic() {
    this.container.classList.add("ascii-chromatic");

    // Create wrapper for layers
    const wrapper = document.createElement("div");
    wrapper.className = "chromatic-wrapper";

    // Create three color layers
    const colors = {
      red: { color: "#ff0000", blend: "screen", offsetX: -1, offsetY: 0 },
      green: { color: "#00ff00", blend: "screen", offsetX: 0, offsetY: 0 },
      blue: { color: "#0000ff", blend: "screen", offsetX: 1, offsetY: 0 },
    };

    Object.entries(colors).forEach(([name, config]) => {
      const layer = document.createElement("pre");
      layer.className = `chromatic-layer chromatic-${name}`;
      layer.textContent = this.asciiString;
      layer.style.cssText = `
        position: absolute;
        inset: 0;
        margin: 0;
        color: ${config.color};
        mix-blend-mode: ${config.blend};
        pointer-events: none;
        transition: transform 0.1s ease-out;
      `;
      wrapper.appendChild(layer);
      this.layers[name] = { element: layer, config };
    });

    // Style wrapper
    wrapper.style.cssText = `
      position: relative;
      background: #000;
      padding: 1rem;
      border-radius: 4px;
      overflow: hidden;
    `;

    this.container.appendChild(wrapper);
    this.wrapper = wrapper;

    // Event listeners
    this.onMouseEnter = () => {
      this.targetSplit = this.maxSplit;
      this.noiseAmount = 2;
    };

    this.onMouseLeave = () => {
      this.targetSplit = 0;
      this.noiseAmount = 0;
    };

    this.onMouseMove = (e) => {
      if (this.targetSplit > 0) {
        const rect = this.wrapper.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;

        // Direction-based split
        this.layers.red.config.offsetX = -1 - x * 2;
        this.layers.red.config.offsetY = y * 0.5;
        this.layers.blue.config.offsetX = 1 + x * 2;
        this.layers.blue.config.offsetY = -y * 0.5;
      }
    };

    this.wrapper.addEventListener("mouseenter", this.onMouseEnter);
    this.wrapper.addEventListener("mouseleave", this.onMouseLeave);
    this.wrapper.addEventListener("mousemove", this.onMouseMove);

    // Start animation loop
    this.animate();
  }

  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());

    // Smooth interpolation
    this.splitAmount += (this.targetSplit - this.splitAmount) * this.easing;

    // Update time for noise
    this.noiseTime += 0.1;

    // Apply transforms to each layer
    Object.values(this.layers).forEach(({ element, config }) => {
      const noiseX = this.noiseAmount * (Math.random() - 0.5);
      const noiseY = this.noiseAmount * (Math.random() - 0.5);

      const x = config.offsetX * this.splitAmount + noiseX;
      const y = config.offsetY * this.splitAmount + noiseY;

      element.style.transform = `translate(${x}px, ${y}px)`;
    });

    // Subtle flicker on green channel (the base)
    if (this.splitAmount > 0.1) {
      const flicker = 0.95 + Math.random() * 0.1;
      this.layers.green.element.style.opacity = flicker;
    } else {
      this.layers.green.element.style.opacity = 1;
    }
  }

  dispose() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.wrapper?.removeEventListener("mouseenter", this.onMouseEnter);
    this.wrapper?.removeEventListener("mouseleave", this.onMouseLeave);
    this.wrapper?.removeEventListener("mousemove", this.onMouseMove);
    this.container.innerHTML = "";
  }
}

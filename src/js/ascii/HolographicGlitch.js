/**
 * HolographicGlitch - Sci-fi hologram projector effect
 * Combines scan lines, color shifts, noise bands, and flicker
 */

import { AsciiArt } from "./AsciiArt.js";

export class HolographicGlitch extends AsciiArt {
  constructor(container, asciiString, options = {}) {
    super(container, asciiString, options);

    this.glitchIntensity = 1;
    this.targetIntensity = 1;
    this.colorPhase = 0;
    this.scanLineOffset = 0;

    // Glitch parameters
    this.sliceCount = options.sliceCount || 8;
    this.flickerRate = options.flickerRate || 0.05;
    this.colorSpeed = options.colorSpeed || 0.02;

    this.slices = [];
    this.initHolographic();
  }

  initHolographic() {
    this.container.classList.add("ascii-holographic");

    // Create wrapper with holographic styling
    const wrapper = document.createElement("div");
    wrapper.className = "holographic-wrapper";
    wrapper.style.cssText = `
      position: relative;
      padding: 1rem;
      background: rgba(0, 0, 0, 0.9);
      border-radius: 4px;
      overflow: hidden;
    `;

    // Create main content container
    const content = document.createElement("div");
    content.className = "holographic-content";
    content.style.cssText = `
      position: relative;
      font-family: monospace;
      white-space: pre;
      line-height: 1.2;
    `;

    // Split ASCII into horizontal slices for glitch effect
    const lines = this.asciiString.split("\n");
    const linesPerSlice = Math.ceil(lines.length / this.sliceCount);

    for (let i = 0; i < this.sliceCount; i++) {
      const startLine = i * linesPerSlice;
      const endLine = Math.min(startLine + linesPerSlice, lines.length);
      const sliceLines = lines.slice(startLine, endLine);

      if (sliceLines.length === 0) continue;

      const slice = document.createElement("div");
      slice.className = "holographic-slice";
      slice.textContent = sliceLines.join("\n");
      slice.style.cssText = `
        position: relative;
        color: cyan;
        text-shadow: 0 0 5px cyan, 0 0 10px rgba(0, 255, 255, 0.5);
        transition: transform 0.05s ease-out, opacity 0.05s ease-out;
      `;

      this.slices.push({
        element: slice,
        offsetX: 0,
        targetOffsetX: 0,
        glitchTimer: Math.random() * 100,
      });

      content.appendChild(slice);
    }

    // Scan lines overlay
    const scanLines = document.createElement("div");
    scanLines.className = "holographic-scanlines";
    scanLines.style.cssText = `
      position: absolute;
      inset: 0;
      background: repeating-linear-gradient(
        0deg,
        rgba(0, 0, 0, 0.1) 0px,
        rgba(0, 0, 0, 0.1) 1px,
        transparent 1px,
        transparent 2px
      );
      pointer-events: none;
      z-index: 2;
    `;

    // Noise band overlay
    const noiseBand = document.createElement("div");
    noiseBand.className = "holographic-noise";
    noiseBand.style.cssText = `
      position: absolute;
      left: 0;
      right: 0;
      height: 3px;
      background: rgba(255, 255, 255, 0.1);
      pointer-events: none;
      z-index: 3;
      opacity: 0;
    `;
    this.noiseBand = noiseBand;

    // Flicker overlay
    const flicker = document.createElement("div");
    flicker.className = "holographic-flicker";
    flicker.style.cssText = `
      position: absolute;
      inset: 0;
      background: transparent;
      pointer-events: none;
      z-index: 4;
    `;
    this.flickerOverlay = flicker;

    wrapper.appendChild(content);
    wrapper.appendChild(scanLines);
    wrapper.appendChild(noiseBand);
    wrapper.appendChild(flicker);

    this.container.appendChild(wrapper);
    this.wrapper = wrapper;
    this.content = content;

    // Event listeners - stabilize on hover
    this.onMouseEnter = () => {
      this.targetIntensity = 0;
    };

    this.onMouseLeave = () => {
      this.targetIntensity = 1;
    };

    this.wrapper.addEventListener("mouseenter", this.onMouseEnter);
    this.wrapper.addEventListener("mouseleave", this.onMouseLeave);

    // Start animation
    this.animate();
  }

  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());

    // Smooth intensity transition
    this.glitchIntensity += (this.targetIntensity - this.glitchIntensity) * 0.1;

    // Update color phase for color cycling
    this.colorPhase += this.colorSpeed;

    // Calculate current colors (cyan <-> magenta shift)
    const hue1 = 180 + Math.sin(this.colorPhase) * 30; // Cyan range
    const hue2 = 300 + Math.sin(this.colorPhase + Math.PI) * 30; // Magenta range

    // Update each slice
    this.slices.forEach((slice, i) => {
      slice.glitchTimer += 1;

      // Random glitch triggering
      if (
        Math.random() < this.flickerRate * this.glitchIntensity &&
        this.glitchIntensity > 0.1
      ) {
        // Trigger horizontal displacement
        slice.targetOffsetX = (Math.random() - 0.5) * 20 * this.glitchIntensity;

        // Occasionally add more dramatic offset
        if (Math.random() < 0.1) {
          slice.targetOffsetX *= 3;
        }
      } else {
        // Return to center
        slice.targetOffsetX = 0;
      }

      // Smooth offset interpolation
      slice.offsetX += (slice.targetOffsetX - slice.offsetX) * 0.3;

      // Apply transform
      slice.element.style.transform = `translateX(${slice.offsetX}px)`;

      // Color shifting based on position and phase
      const slicePhase = this.colorPhase + i * 0.2;
      const color = `hsl(${hue1 + Math.sin(slicePhase) * 20}, 100%, 60%)`;
      slice.element.style.color = color;
      slice.element.style.textShadow = `
        0 0 5px ${color},
        0 0 10px hsla(${hue2}, 100%, 50%, 0.5),
        ${slice.offsetX * 0.5}px 0 0 hsla(${hue2}, 100%, 50%, 0.3)
      `;

      // Random opacity flicker
      if (Math.random() < this.flickerRate * this.glitchIntensity * 0.5) {
        slice.element.style.opacity = 0.7 + Math.random() * 0.3;
      } else {
        slice.element.style.opacity = 1;
      }
    });

    // Update noise band position
    if (Math.random() < 0.1 * this.glitchIntensity) {
      this.noiseBand.style.top = `${Math.random() * 100}%`;
      this.noiseBand.style.opacity = 0.3 * this.glitchIntensity;
      this.noiseBand.style.height = `${2 + Math.random() * 4}px`;
    } else {
      this.noiseBand.style.opacity = 0;
    }

    // Overall brightness flicker
    if (Math.random() < this.flickerRate * this.glitchIntensity * 0.3) {
      const brightness = 0.8 + Math.random() * 0.4;
      this.flickerOverlay.style.background = `rgba(255, 255, 255, ${(brightness - 1) * 0.1})`;
    } else {
      this.flickerOverlay.style.background = "transparent";
    }
  }

  dispose() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.wrapper?.removeEventListener("mouseenter", this.onMouseEnter);
    this.wrapper?.removeEventListener("mouseleave", this.onMouseLeave);
    this.container.innerHTML = "";
  }
}

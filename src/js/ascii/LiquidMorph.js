/**
 * LiquidMorph - Liquid metal effect using simplex noise
 * ASCII art appears to melt, ripple, and flow like T-1000
 */

import { AsciiArt } from "./AsciiArt.js";
import { noise2D, seed } from "./noise.js";

// Liquid-like characters for morphing
const LIQUID_CHARS = ["░", "▒", "▓", "█", "▄", "▀", "▐", "▌"];

export class LiquidMorph extends AsciiArt {
  constructor(container, asciiString, options = {}) {
    super(container, asciiString, options);

    this.amplitude = options.amplitude || 15;
    this.targetAmplitude = this.amplitude;
    this.currentAmplitude = this.amplitude;
    this.frequency = options.frequency || 0.08;
    this.speed = options.speed || 0.015;
    this.morphChars = options.morphChars !== false;

    this.time = 0;
    this.chars = [];

    // Seed noise for consistency
    seed(42);

    this.initLiquid();
  }

  initLiquid() {
    this.container.classList.add("ascii-liquid");

    // Create wrapper
    const wrapper = document.createElement("div");
    wrapper.className = "liquid-wrapper";
    wrapper.style.cssText = `
      position: relative;
      padding: 1rem;
      background: var(--bg-secondary);
      border-radius: 4px;
      overflow: hidden;
      font-family: monospace;
    `;

    // Create character grid
    const grid = document.createElement("div");
    grid.className = "liquid-grid";
    grid.style.cssText = `
      position: relative;
      white-space: pre;
      line-height: 1.2;
    `;

    // Parse ASCII into character spans
    const lines = this.asciiString.split("\n");

    lines.forEach((line, row) => {
      const lineDiv = document.createElement("div");
      lineDiv.className = "liquid-line";
      lineDiv.style.cssText = "position: relative; height: 1.2em;";

      [...line].forEach((char, col) => {
        const span = document.createElement("span");
        span.className = "liquid-char";
        span.style.cssText = `
          display: inline-block;
          width: 1ch;
          will-change: transform;
          transition: color 0.3s ease;
        `;
        span.textContent = char;

        // Store character data (only animate non-spaces)
        if (char !== " ") {
          this.chars.push({
            element: span,
            originalChar: char,
            row,
            col,
            x: 0,
            y: 0,
          });
        }

        lineDiv.appendChild(span);
      });

      grid.appendChild(lineDiv);
    });

    // Reflection effect (subtle)
    const reflection = document.createElement("div");
    reflection.className = "liquid-reflection";
    reflection.style.cssText = `
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 30%;
      background: linear-gradient(to bottom, transparent, rgba(128, 128, 255, 0.05));
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.5s ease;
    `;
    this.reflection = reflection;

    wrapper.appendChild(grid);
    wrapper.appendChild(reflection);
    this.container.appendChild(wrapper);
    this.wrapper = wrapper;
    this.grid = grid;

    // Event listeners - solidify on hover
    this.onMouseEnter = () => {
      this.targetAmplitude = 0;
      this.reflection.style.opacity = 1;
    };

    this.onMouseLeave = () => {
      this.targetAmplitude = this.amplitude;
      this.reflection.style.opacity = 0;
    };

    this.wrapper.addEventListener("mouseenter", this.onMouseEnter);
    this.wrapper.addEventListener("mouseleave", this.onMouseLeave);

    // Start animation
    this.animate();
  }

  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());

    // Update time
    this.time += this.speed;

    // Smooth amplitude transition
    this.currentAmplitude +=
      (this.targetAmplitude - this.currentAmplitude) * 0.05;

    // Update each character
    this.chars.forEach((char) => {
      // Sample noise at character position + time
      const noiseX = noise2D(
        char.col * this.frequency,
        char.row * this.frequency + this.time,
      );
      const noiseY = noise2D(
        char.col * this.frequency + 100,
        char.row * this.frequency + this.time,
      );

      // Apply as displacement with sine wave modulation
      const waveModX = Math.sin(this.time * 2 + char.row * 0.3);
      const waveModY = Math.cos(this.time * 2 + char.col * 0.3);

      char.x = noiseX * this.currentAmplitude * (0.5 + waveModX * 0.5);
      char.y = noiseY * this.currentAmplitude * (0.5 + waveModY * 0.5);

      // Apply transform
      char.element.style.transform = `translate(${char.x}px, ${char.y}px)`;

      // Morph characters when amplitude is high
      if (this.morphChars && this.currentAmplitude > 5) {
        const morphProgress = Math.min(
          this.currentAmplitude / this.amplitude,
          1,
        );
        const noiseVal = Math.abs(noiseX + noiseY);

        // Occasionally replace with liquid character
        if (noiseVal > 0.8 && Math.random() < morphProgress * 0.3) {
          const liquidIndex = Math.floor(
            ((noiseVal - 0.8) / 0.2) * LIQUID_CHARS.length,
          );
          char.element.textContent =
            LIQUID_CHARS[Math.min(liquidIndex, LIQUID_CHARS.length - 1)];
        } else {
          char.element.textContent = char.originalChar;
        }
      } else {
        char.element.textContent = char.originalChar;
      }

      // Color based on displacement (metallic sheen)
      const displacement = Math.sqrt(char.x * char.x + char.y * char.y);
      const normalizedDisp = Math.min(displacement / this.amplitude, 1);

      if (normalizedDisp > 0.1) {
        const hue = 220 + normalizedDisp * 40; // Blue to purple
        const lightness = 60 + normalizedDisp * 20;
        char.element.style.color = `hsl(${hue}, 30%, ${lightness}%)`;
      } else {
        char.element.style.color = "";
      }
    });
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

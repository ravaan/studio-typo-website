/**
 * ASCII Image Reveal
 * Image covered by ASCII (brightness-matched), dissolves on interaction
 */

import { loadImage, sampleCanvas } from "../utils/brightness.js";
import { brightnessToChar } from "../utils/ascii-density.js";

export class ImageReveal {
  constructor(container, options = {}) {
    this.container = container;
    this.cols = options.cols || 60;
    this.rows = options.rows || 30;
    this.imageSrc =
      options.imageSrc || "https://picsum.photos/600/400?random=1";
    this.revealMode = options.revealMode || "scatter"; // scatter, fade, glitch

    this.cells = [];
    this.revealed = [];
    this.isHovering = false;
    this.animationFrame = null;
    this.imageCanvas = null;

    this.init();
  }

  async init() {
    // Create wrapper
    this.wrapper = document.createElement("div");
    this.wrapper.className = "image-reveal-wrapper";
    this.wrapper.style.cssText = `
      position: relative;
      font-family: var(--font-mono, monospace);
      font-size: 10px;
      line-height: 1;
      background: var(--bg-primary, #000);
      overflow: hidden;
    `;
    this.container.appendChild(this.wrapper);

    // Create image layer (hidden underneath)
    this.imageEl = document.createElement("img");
    this.imageEl.className = "image-reveal-image";
    this.imageEl.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;
    this.imageEl.crossOrigin = "anonymous";
    this.wrapper.appendChild(this.imageEl);

    // Create ASCII grid layer
    this.asciiLayer = document.createElement("div");
    this.asciiLayer.className = "image-reveal-ascii";
    this.asciiLayer.style.cssText = `
      position: relative;
      display: grid;
      grid-template-columns: repeat(${this.cols}, 1ch);
      gap: 0;
      z-index: 1;
    `;
    this.wrapper.appendChild(this.asciiLayer);

    // Load image and sample brightness
    try {
      this.imageCanvas = await loadImage(this.imageSrc);
      this.imageEl.src = this.imageSrc;
      this.brightnessGrid = sampleCanvas(
        this.imageCanvas,
        this.cols,
        this.rows,
      );
      this.createGrid();
    } catch (err) {
      console.error("Failed to load image:", err);
      this.createFallbackGrid();
    }

    // Event listeners
    this.wrapper.addEventListener("mouseenter", () => this.onHover());
    this.wrapper.addEventListener("mouseleave", () => this.onLeave());
    this.wrapper.addEventListener("mousemove", (e) => this.onMouseMove(e));
  }

  createGrid() {
    this.cells = [];
    this.revealed = [];

    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const brightness = this.brightnessGrid[y][x];
        const char = brightnessToChar(brightness, "full");

        const cell = document.createElement("span");
        cell.className = "image-reveal-cell";
        cell.textContent = char;
        cell.dataset.x = x;
        cell.dataset.y = y;
        cell.dataset.brightness = brightness;
        cell.style.cssText = `
          display: inline-block;
          width: 1ch;
          text-align: center;
          color: var(--text-primary, #fff);
          transition: opacity 0.3s ease, transform 0.5s ease;
        `;

        this.asciiLayer.appendChild(cell);
        this.cells.push(cell);
        this.revealed.push(false);
      }
    }
  }

  createFallbackGrid() {
    // Create random pattern if image fails
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const cell = document.createElement("span");
        cell.className = "image-reveal-cell";
        cell.textContent = brightnessToChar(Math.random() * 255, "simple");
        cell.style.cssText = `
          display: inline-block;
          width: 1ch;
          text-align: center;
          color: var(--text-primary, #fff);
        `;
        this.asciiLayer.appendChild(cell);
        this.cells.push(cell);
        this.revealed.push(false);
      }
    }
  }

  onHover() {
    this.isHovering = true;
    this.startRevealAnimation();
  }

  onLeave() {
    this.isHovering = false;
    this.startHideAnimation();
  }

  onMouseMove(e) {
    if (!this.isHovering) return;

    const rect = this.wrapper.getBoundingClientRect();
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * this.cols);
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * this.rows);

    // Reveal cells near cursor
    const radius = 5;
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const cx = x + dx;
        const cy = y + dy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (
          cx >= 0 &&
          cx < this.cols &&
          cy >= 0 &&
          cy < this.rows &&
          dist <= radius
        ) {
          const idx = cy * this.cols + cx;
          if (!this.revealed[idx]) {
            this.revealCell(idx, dist / radius);
          }
        }
      }
    }
  }

  revealCell(idx, delay = 0) {
    this.revealed[idx] = true;
    const cell = this.cells[idx];

    if (this.revealMode === "scatter") {
      // Scatter animation
      const angle = Math.random() * Math.PI * 2;
      const distance = 50 + Math.random() * 100;
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance;

      setTimeout(() => {
        cell.style.transform = `translate(${tx}px, ${ty}px) rotate(${Math.random() * 360}deg)`;
        cell.style.opacity = "0";
      }, delay * 100);
    } else if (this.revealMode === "fade") {
      // Simple fade
      setTimeout(() => {
        cell.style.opacity = "0";
      }, delay * 50);
    } else if (this.revealMode === "glitch") {
      // Glitch effect
      const glitchChars = "!@#$%^&*░▒▓";
      let glitchCount = 0;
      const glitchInterval = setInterval(() => {
        cell.textContent =
          glitchChars[Math.floor(Math.random() * glitchChars.length)];
        glitchCount++;
        if (glitchCount > 5) {
          clearInterval(glitchInterval);
          cell.style.opacity = "0";
        }
      }, 50);
    }
  }

  startRevealAnimation() {
    // Show image underneath
    this.imageEl.style.opacity = "1";
  }

  startHideAnimation() {
    // Hide image
    this.imageEl.style.opacity = "0";

    // Reset cells
    this.cells.forEach((cell, idx) => {
      if (this.revealed[idx]) {
        cell.style.transform = "translate(0, 0) rotate(0deg)";
        cell.style.opacity = "1";

        // Restore original character
        if (this.brightnessGrid) {
          const y = Math.floor(idx / this.cols);
          const x = idx % this.cols;
          cell.textContent = brightnessToChar(
            this.brightnessGrid[y][x],
            "full",
          );
        }

        this.revealed[idx] = false;
      }
    });
  }

  /**
   * Change the image source
   */
  async setImage(src) {
    this.imageSrc = src;
    try {
      this.imageCanvas = await loadImage(src);
      this.imageEl.src = src;
      this.brightnessGrid = sampleCanvas(
        this.imageCanvas,
        this.cols,
        this.rows,
      );

      // Update grid characters
      this.cells.forEach((cell, idx) => {
        const y = Math.floor(idx / this.cols);
        const x = idx % this.cols;
        cell.textContent = brightnessToChar(this.brightnessGrid[y][x], "full");
      });
    } catch (err) {
      console.error("Failed to load image:", err);
    }
  }

  dispose() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    this.wrapper.remove();
  }
}

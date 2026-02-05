/**
 * Layered ASCII Excavation
 * Multiple ASCII layers - dig to reveal what's beneath
 */

import { loadImage, sampleCanvas } from "../utils/brightness.js";
import { brightnessToChar } from "../utils/ascii-density.js";

export class Excavation {
  constructor(container, options = {}) {
    this.container = container;
    this.cols = options.cols || 60;
    this.rows = options.rows || 25;
    this.layerCount = options.layers || 4;
    this.brushSize = options.brushSize || 3;

    this.layers = [];
    this.revealed = [];
    this.particles = [];
    this.animationFrame = null;
    this.isDigging = false;

    this.imageSources = [
      "https://picsum.photos/400/300?random=10",
      "https://picsum.photos/400/300?random=20",
      "https://picsum.photos/400/300?random=30",
      "https://picsum.photos/400/300?random=40",
    ];

    this.init();
  }

  async init() {
    this.wrapper = document.createElement("div");
    this.wrapper.className = "excavation-wrapper";
    this.wrapper.style.cssText = `
      font-family: var(--font-mono, monospace);
      font-size: 10px;
      line-height: 1;
      background: var(--bg-primary, #000);
      padding: 10px;
      position: relative;
      cursor: crosshair;
      user-select: none;
    `;
    this.container.appendChild(this.wrapper);

    this.display = document.createElement("pre");
    this.display.className = "excavation-display";
    this.display.style.cssText = `
      margin: 0;
      color: var(--text-primary, #fff);
      white-space: pre;
    `;
    this.wrapper.appendChild(this.display);

    this.particleLayer = document.createElement("div");
    this.particleLayer.className = "excavation-particles";
    this.particleLayer.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      overflow: hidden;
    `;
    this.wrapper.appendChild(this.particleLayer);

    this.controls = document.createElement("div");
    this.controls.style.cssText = `
      margin-top: 10px;
      display: flex;
      gap: 10px;
      justify-content: center;
    `;
    this.wrapper.appendChild(this.controls);

    this.createButton("[ RESET ]", () => this.reset());
    this.createButton("[ REVEAL ALL ]", () => this.revealAll());

    this.wrapper.addEventListener("mousedown", () => (this.isDigging = true));
    this.wrapper.addEventListener("mouseup", () => (this.isDigging = false));
    this.wrapper.addEventListener("mouseleave", () => (this.isDigging = false));
    this.wrapper.addEventListener("mousemove", (e) => this.onMouseMove(e));

    await this.loadLayers();
    this.render();
    this.animateParticles();
  }

  createButton(text, onClick) {
    const btn = document.createElement("button");
    btn.textContent = text;
    btn.style.cssText = `
      background: transparent;
      border: 1px solid var(--border-primary, #333);
      color: var(--text-primary, #fff);
      font-family: var(--font-mono, monospace);
      font-size: 11px;
      padding: 5px 10px;
      cursor: pointer;
    `;
    btn.addEventListener("click", onClick);
    this.controls.appendChild(btn);
    return btn;
  }

  async loadLayers() {
    this.layers = [];
    this.revealed = [];

    for (let i = 0; i < this.layerCount; i++) {
      try {
        const canvas = await loadImage(
          this.imageSources[i % this.imageSources.length],
        );
        const brightness = sampleCanvas(canvas, this.cols, this.rows);
        const asciiLayer = brightness.map((row) =>
          row.map((b) => brightnessToChar(b, "full")),
        );
        this.layers.push(asciiLayer);
      } catch (err) {
        const layer = [];
        for (let y = 0; y < this.rows; y++) {
          const row = [];
          for (let x = 0; x < this.cols; x++) {
            const patterns = ["#", "@", "%", "&"];
            row.push(patterns[i % patterns.length]);
          }
          layer.push(row);
        }
        this.layers.push(layer);
      }
    }

    for (let y = 0; y < this.rows; y++) {
      const row = [];
      for (let x = 0; x < this.cols; x++) {
        row.push(0);
      }
      this.revealed.push(row);
    }
  }

  onMouseMove(e) {
    if (!this.isDigging) return;

    const rect = this.display.getBoundingClientRect();
    const charWidth = rect.width / this.cols;
    const charHeight = rect.height / this.rows;
    const x = Math.floor((e.clientX - rect.left) / charWidth);
    const y = Math.floor((e.clientY - rect.top) / charHeight);

    this.dig(x, y);
  }

  dig(cx, cy) {
    for (let dy = -this.brushSize; dy <= this.brushSize; dy++) {
      for (let dx = -this.brushSize; dx <= this.brushSize; dx++) {
        const x = cx + dx;
        const y = cy + dy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (
          x >= 0 &&
          x < this.cols &&
          y >= 0 &&
          y < this.rows &&
          dist <= this.brushSize
        ) {
          if (this.revealed[y][x] < this.layerCount - 1) {
            const prevLayer = this.revealed[y][x];
            this.revealed[y][x]++;
            this.spawnParticle(x, y, this.layers[prevLayer][y][x]);
          }
        }
      }
    }
    this.render();
  }

  spawnParticle(x, y, char) {
    const rect = this.display.getBoundingClientRect();
    const charWidth = rect.width / this.cols;
    const charHeight = rect.height / this.rows;

    const particle = document.createElement("span");
    particle.textContent = char;
    particle.style.cssText = `
      position: absolute;
      left: ${x * charWidth}px;
      top: ${y * charHeight}px;
      color: var(--text-primary, #fff);
      font-family: var(--font-mono, monospace);
      font-size: 10px;
      pointer-events: none;
      transition: all 0.5s ease-out;
    `;
    this.particleLayer.appendChild(particle);

    const angle = Math.random() * Math.PI * 2;
    const distance = 20 + Math.random() * 30;
    const tx = Math.cos(angle) * distance;
    const ty = Math.sin(angle) * distance - 20;

    requestAnimationFrame(() => {
      particle.style.transform = `translate(${tx}px, ${ty}px) rotate(${Math.random() * 360}deg)`;
      particle.style.opacity = "0";
    });

    setTimeout(() => particle.remove(), 500);
  }

  render() {
    let output = "";
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const layerIdx = this.revealed[y][x];
        output += this.layers[layerIdx][y][x];
      }
      output += "\n";
    }
    this.display.textContent = output;
  }

  animateParticles() {
    this.animationFrame = requestAnimationFrame(() => this.animateParticles());
  }

  revealAll() {
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        this.revealed[y][x] = this.layerCount - 1;
      }
    }
    this.render();
  }

  async reset() {
    await this.loadLayers();
    this.render();
  }

  dispose() {
    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
    this.wrapper.remove();
  }
}

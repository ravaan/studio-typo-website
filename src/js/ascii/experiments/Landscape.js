/**
 * ASCII Topographic Landscape
 * Parallax terrain using FBM noise rendered as ASCII
 */

import { noise2D, fbm } from "../noise.js";

export class Landscape {
  constructor(container, options = {}) {
    this.container = container;
    this.cols = options.cols || 80;
    this.rows = options.rows || 25;
    this.layers = options.layers || 4;
    this.scale = options.scale || 0.03;

    this.offsetX = 0;
    this.offsetY = 0;
    this.targetOffsetX = 0;
    this.targetOffsetY = 0;
    this.animationFrame = null;
    this.time = 0;

    // Terrain characters by elevation
    this.terrainChars = {
      deepWater: "~",
      water: "≈",
      shore: ".",
      plains: ",",
      grass: '"',
      hills: "n",
      mountains: "^",
      peaks: "▲",
      snow: "█",
    };

    this.init();
  }

  init() {
    // Create wrapper
    this.wrapper = document.createElement("div");
    this.wrapper.className = "landscape-wrapper";
    this.wrapper.style.cssText = `
      font-family: var(--font-mono, monospace);
      font-size: 12px;
      line-height: 1.1;
      background: linear-gradient(to bottom, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
      padding: 10px;
      cursor: grab;
      user-select: none;
      overflow: hidden;
    `;
    this.container.appendChild(this.wrapper);

    // Create layers
    this.layerElements = [];
    for (let i = 0; i < this.layers; i++) {
      const layer = document.createElement("pre");
      layer.className = `landscape-layer layer-${i}`;
      const depth = i / (this.layers - 1);
      const opacity = 0.3 + depth * 0.7;
      layer.style.cssText = `
        position: ${i === 0 ? "relative" : "absolute"};
        top: 0;
        left: 0;
        margin: 0;
        color: var(--text-primary, #fff);
        opacity: ${opacity};
        white-space: pre;
        pointer-events: none;
      `;
      this.wrapper.appendChild(layer);
      this.layerElements.push(layer);
    }

    // Event listeners
    this.wrapper.addEventListener("mousedown", (e) => this.onMouseDown(e));
    this.wrapper.addEventListener("mousemove", (e) => this.onMouseMove(e));
    this.wrapper.addEventListener("mouseup", () => this.onMouseUp());
    this.wrapper.addEventListener("mouseleave", () => this.onMouseUp());
    this.wrapper.addEventListener("wheel", (e) => this.onWheel(e));

    this.isDragging = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;

    // Start animation
    this.animate();
  }

  onMouseDown(e) {
    this.isDragging = true;
    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;
    this.wrapper.style.cursor = "grabbing";
  }

  onMouseMove(e) {
    if (!this.isDragging) return;

    const dx = e.clientX - this.lastMouseX;
    const dy = e.clientY - this.lastMouseY;

    this.targetOffsetX -= dx * 0.1;
    this.targetOffsetY -= dy * 0.1;

    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;
  }

  onMouseUp() {
    this.isDragging = false;
    this.wrapper.style.cursor = "grab";
  }

  onWheel(e) {
    e.preventDefault();
    this.targetOffsetX += e.deltaX * 0.05;
    this.targetOffsetY += e.deltaY * 0.05;
  }

  animate() {
    this.time += 0.01;

    // Smooth camera movement
    this.offsetX += (this.targetOffsetX - this.offsetX) * 0.1;
    this.offsetY += (this.targetOffsetY - this.offsetY) * 0.1;

    // Auto-scroll slowly
    this.targetOffsetX += 0.02;

    // Render all layers
    this.render();

    this.animationFrame = requestAnimationFrame(() => this.animate());
  }

  render() {
    for (let layerIdx = 0; layerIdx < this.layers; layerIdx++) {
      const depth = layerIdx / (this.layers - 1);
      const parallaxFactor = 0.3 + depth * 0.7;
      const layerOffsetX = this.offsetX * parallaxFactor;
      const layerOffsetY = this.offsetY * parallaxFactor * 0.5;

      let output = "";

      for (let y = 0; y < this.rows; y++) {
        for (let x = 0; x < this.cols; x++) {
          const worldX = x + layerOffsetX;
          const worldY = y + layerOffsetY;

          // Generate terrain using FBM
          const elevation = this.getElevation(worldX, worldY, layerIdx);

          // Get character and color based on elevation
          const char = this.getTerrainChar(elevation, y);
          output += char;
        }
        output += "\n";
      }

      this.layerElements[layerIdx].textContent = output;
    }
  }

  getElevation(x, y, layer) {
    const nx = x * this.scale;
    const ny = y * this.scale;

    // Use FBM for more natural terrain
    let elevation = fbm(nx, ny + layer * 100, 4, 0.5, 2.0);

    // Add some variation based on layer
    elevation += noise2D(nx * 2 + layer * 50, ny * 2) * 0.3;

    // Add subtle animation to water
    if (elevation < 0.3) {
      elevation += Math.sin(this.time * 2 + x * 0.5) * 0.02;
    }

    return (elevation + 1) / 2; // Normalize to 0-1
  }

  getTerrainChar(elevation, row) {
    // Adjust elevation based on vertical position (higher = more mountains)
    const verticalBias = 1 - (row / this.rows) * 0.3;
    const adjustedElevation = elevation * verticalBias;

    if (adjustedElevation < 0.25) return this.terrainChars.deepWater;
    if (adjustedElevation < 0.35) return this.terrainChars.water;
    if (adjustedElevation < 0.4) return this.terrainChars.shore;
    if (adjustedElevation < 0.5) return this.terrainChars.plains;
    if (adjustedElevation < 0.6) return this.terrainChars.grass;
    if (adjustedElevation < 0.7) return this.terrainChars.hills;
    if (adjustedElevation < 0.85) return this.terrainChars.mountains;
    if (adjustedElevation < 0.95) return this.terrainChars.peaks;
    return this.terrainChars.snow;
  }

  /**
   * Reset camera position
   */
  resetCamera() {
    this.targetOffsetX = 0;
    this.targetOffsetY = 0;
  }

  dispose() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    this.wrapper.remove();
  }
}

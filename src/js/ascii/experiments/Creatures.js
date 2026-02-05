/**
 * Generative ASCII Creatures
 * Boids flocking simulation rendered as ASCII characters
 */

import { Flock } from "../utils/boids.js";

export class Creatures {
  constructor(container, options = {}) {
    this.container = container;
    this.cols = options.cols || 80;
    this.rows = options.rows || 30;
    this.boidCount = options.boidCount || 50;
    this.trailLength = options.trailLength || 3;

    this.grid = [];
    this.trails = [];
    this.animationFrame = null;
    this.mousePos = null;
    this.mouseMode = "predator"; // 'predator' or 'attractor'

    this.init();
  }

  init() {
    // Create wrapper
    this.wrapper = document.createElement("div");
    this.wrapper.className = "creatures-wrapper";
    this.wrapper.style.cssText = `
      font-family: var(--font-mono, monospace);
      font-size: 12px;
      line-height: 1.2;
      background: var(--bg-primary, #000);
      padding: 10px;
      cursor: none;
      user-select: none;
      overflow: hidden;
    `;
    this.container.appendChild(this.wrapper);

    // Create pre element for ASCII output
    this.pre = document.createElement("pre");
    this.pre.className = "creatures-display";
    this.pre.style.cssText = `
      margin: 0;
      color: var(--text-primary, #fff);
      white-space: pre;
    `;
    this.wrapper.appendChild(this.pre);

    // Calculate pixel dimensions
    this.charWidth = 8;
    this.charHeight = 14;
    this.width = this.cols * this.charWidth;
    this.height = this.rows * this.charHeight;

    // Initialize flock
    this.flock = new Flock(this.boidCount, this.width, this.height, {
      maxSpeed: 3,
      maxForce: 0.08,
      perceptionRadius: 40,
      separationRadius: 20,
      maxTrailLength: this.trailLength,
    });

    // Initialize empty grid
    this.clearGrid();

    // Event listeners
    this.wrapper.addEventListener("mousemove", (e) => this.onMouseMove(e));
    this.wrapper.addEventListener("mouseleave", () => this.onMouseLeave());
    this.wrapper.addEventListener("click", () => this.toggleMode());

    // Start animation
    this.animate();
  }

  clearGrid() {
    this.grid = [];
    for (let y = 0; y < this.rows; y++) {
      const row = [];
      for (let x = 0; x < this.cols; x++) {
        row.push({ char: " ", age: 0 });
      }
      this.grid.push(row);
    }
  }

  onMouseMove(e) {
    const rect = this.wrapper.getBoundingClientRect();
    this.mousePos = {
      x: ((e.clientX - rect.left) / rect.width) * this.width,
      y: ((e.clientY - rect.top) / rect.height) * this.height,
    };
  }

  onMouseLeave() {
    this.mousePos = null;
  }

  toggleMode() {
    this.mouseMode = this.mouseMode === "predator" ? "attractor" : "predator";
  }

  animate() {
    // Age existing trails
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        if (this.grid[y][x].age > 0) {
          this.grid[y][x].age--;
          if (this.grid[y][x].age === 0) {
            this.grid[y][x].char = " ";
          }
        }
      }
    }

    // Update flock
    const predator = this.mouseMode === "predator" ? this.mousePos : null;
    const attractor = this.mouseMode === "attractor" ? this.mousePos : null;
    this.flock.update(predator, attractor);

    // Render boids to grid
    for (const boid of this.flock.getBoids()) {
      const x = Math.floor(boid.x / this.charWidth);
      const y = Math.floor(boid.y / this.charHeight);

      if (x >= 0 && x < this.cols && y >= 0 && y < this.rows) {
        // Leave trail at previous position
        const prevX = Math.floor((boid.x - boid.vx * 2) / this.charWidth);
        const prevY = Math.floor((boid.y - boid.vy * 2) / this.charHeight);
        if (
          prevX >= 0 &&
          prevX < this.cols &&
          prevY >= 0 &&
          prevY < this.rows
        ) {
          this.grid[prevY][prevX] = { char: ".", age: this.trailLength };
        }

        // Draw boid
        this.grid[y][x] = { char: boid.getDirectionChar(), age: -1 };
      }
    }

    // Render grid to text
    this.render();

    this.animationFrame = requestAnimationFrame(() => this.animate());
  }

  render() {
    let output = "";

    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const cell = this.grid[y][x];
        output += cell.char;
      }
      output += "\n";
    }

    // Add cursor indicator
    if (this.mousePos) {
      const cx = Math.floor(this.mousePos.x / this.charWidth);
      const cy = Math.floor(this.mousePos.y / this.charHeight);
      if (cx >= 0 && cx < this.cols && cy >= 0 && cy < this.rows) {
        const idx = cy * (this.cols + 1) + cx;
        const cursorChar = this.mouseMode === "predator" ? "█" : "◉";
        output =
          output.substring(0, idx) + cursorChar + output.substring(idx + 1);
      }
    }

    this.pre.textContent = output;
  }

  /**
   * Add more boids
   */
  addBoids(count) {
    for (let i = 0; i < count; i++) {
      const x = Math.random() * this.width;
      const y = Math.random() * this.height;
      this.flock.boids.push(new this.flock.boids[0].constructor(x, y));
    }
  }

  /**
   * Reset the simulation
   */
  reset() {
    this.flock = new Flock(this.boidCount, this.width, this.height);
    this.clearGrid();
  }

  dispose() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    this.wrapper.remove();
  }
}

/**
 * ASCII Fluid Simulation
 * Navier-Stokes fluid dynamics rendered as ASCII characters
 */

import { FluidSolver } from "../utils/fluid-solver.js";
import { BLOCK_RAMP } from "../utils/ascii-density.js";

export class FluidSim {
  constructor(container, options = {}) {
    this.container = container;
    this.size = options.size || 64;
    this.cols = options.cols || 60;
    this.rows = options.rows || 30;

    this.solver = new FluidSolver(
      this.size,
      options.diffusion,
      options.viscosity,
    );
    this.cells = [];
    this.animationFrame = null;
    this.lastMouse = { x: 0, y: 0 };
    this.isMouseDown = false;

    this.init();
  }

  init() {
    // Create wrapper
    this.wrapper = document.createElement("div");
    this.wrapper.className = "fluid-sim-wrapper";
    this.wrapper.style.cssText = `
      font-family: var(--font-mono, monospace);
      font-size: 12px;
      line-height: 1;
      background: var(--bg-primary, #000);
      padding: 10px;
      cursor: crosshair;
      user-select: none;
    `;
    this.container.appendChild(this.wrapper);

    // Create grid
    this.grid = document.createElement("div");
    this.grid.className = "fluid-sim-grid";
    this.grid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(${this.cols}, 1ch);
      gap: 0;
    `;
    this.wrapper.appendChild(this.grid);

    // Create cells
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const cell = document.createElement("span");
        cell.className = "fluid-cell";
        cell.textContent = " ";
        cell.style.cssText = `
          display: inline-block;
          width: 1ch;
          text-align: center;
          color: var(--text-primary, #fff);
          transition: color 0.1s ease;
        `;
        this.grid.appendChild(cell);
        this.cells.push(cell);
      }
    }

    // Event listeners
    this.wrapper.addEventListener("mousedown", (e) => this.onMouseDown(e));
    this.wrapper.addEventListener("mouseup", () => this.onMouseUp());
    this.wrapper.addEventListener("mouseleave", () => this.onMouseUp());
    this.wrapper.addEventListener("mousemove", (e) => this.onMouseMove(e));
    this.wrapper.addEventListener("touchstart", (e) => this.onTouchStart(e));
    this.wrapper.addEventListener("touchmove", (e) => this.onTouchMove(e));
    this.wrapper.addEventListener("touchend", () => this.onMouseUp());

    // Start animation
    this.animate();
  }

  getGridPosition(e) {
    const rect = this.wrapper.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * this.size;
    const y = ((e.clientY - rect.top) / rect.height) * this.size;
    return { x, y };
  }

  onMouseDown(e) {
    this.isMouseDown = true;
    const pos = this.getGridPosition(e);
    this.lastMouse = pos;
    this.addFluid(pos.x, pos.y, 0, 0);
  }

  onMouseUp() {
    this.isMouseDown = false;
  }

  onMouseMove(e) {
    const pos = this.getGridPosition(e);

    if (this.isMouseDown) {
      const vx = (pos.x - this.lastMouse.x) * 2;
      const vy = (pos.y - this.lastMouse.y) * 2;
      this.addFluid(pos.x, pos.y, vx, vy);
    }

    this.lastMouse = pos;
  }

  onTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    this.isMouseDown = true;
    const pos = this.getGridPosition(touch);
    this.lastMouse = pos;
    this.addFluid(pos.x, pos.y, 0, 0);
  }

  onTouchMove(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const pos = this.getGridPosition(touch);

    const vx = (pos.x - this.lastMouse.x) * 2;
    const vy = (pos.y - this.lastMouse.y) * 2;
    this.addFluid(pos.x, pos.y, vx, vy);

    this.lastMouse = pos;
  }

  addFluid(x, y, vx, vy) {
    // Add density and velocity in a small radius
    const radius = 2;
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= radius) {
          const amount = (1 - dist / radius) * 100;
          this.solver.addDensity(x + dx, y + dy, amount);
          this.solver.addVelocity(x + dx, y + dy, vx, vy);
        }
      }
    }
  }

  animate() {
    // Step the simulation
    this.solver.step();

    // Render to ASCII
    this.render();

    this.animationFrame = requestAnimationFrame(() => this.animate());
  }

  render() {
    const density = this.solver.getDensity();
    const scaleX = this.size / this.cols;
    const scaleY = this.size / this.rows;

    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const idx = y * this.cols + x;

        // Sample density from solver
        const sx = Math.floor(x * scaleX);
        const sy = Math.floor(y * scaleY);
        const solverIdx = sx + sy * this.size;
        const d = Math.min(density[solverIdx] || 0, 255);

        // Map density to character
        const charIdx = Math.floor((d / 255) * (BLOCK_RAMP.length - 1));
        const char = BLOCK_RAMP[charIdx] || " ";

        this.cells[idx].textContent = char;

        // Color based on velocity
        if (d > 10) {
          const vel = this.solver.getVelocityAt(sx, sy);
          const speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y);
          const hue = (speed * 10) % 360;
          const lightness = 50 + (d / 255) * 30;
          this.cells[idx].style.color =
            `hsl(${200 + hue * 0.5}, 80%, ${lightness}%)`;
        } else {
          this.cells[idx].style.color = "var(--text-secondary, #666)";
        }
      }
    }
  }

  /**
   * Clear the fluid
   */
  clear() {
    this.solver.clear();
  }

  dispose() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    this.wrapper.remove();
  }
}

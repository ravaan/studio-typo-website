/**
 * Physics-Driven ASCII Typography
 * Text with Verlet physics simulation
 */

import { VerletSystem, createTextParticles } from "../utils/verlet.js";

export class PhysicsType {
  constructor(container, options = {}) {
    this.container = container;
    this.cols = options.cols || 60;
    this.rows = options.rows || 20;
    this.text = options.text || "SHAKE ME";
    this.charWidth = 10;
    this.charHeight = 14;

    this.system = null;
    this.particles = [];
    this.animationFrame = null;
    this.lastMouseX = 0;
    this.lastMouseY = 0;
    this.shakeThreshold = 10;
    this.isRebuilding = false;

    this.init();
  }

  init() {
    this.wrapper = document.createElement("div");
    this.wrapper.className = "physics-type-wrapper";
    this.wrapper.style.cssText = `
      font-family: var(--font-mono, monospace);
      font-size: 12px;
      line-height: 1.2;
      background: var(--bg-primary, #000);
      padding: 20px;
      position: relative;
      cursor: grab;
      user-select: none;
      overflow: hidden;
    `;
    this.container.appendChild(this.wrapper);

    this.display = document.createElement("pre");
    this.display.className = "physics-type-display";
    this.display.style.cssText = `
      margin: 0;
      color: var(--text-primary, #fff);
      white-space: pre;
      min-height: ${this.rows * this.charHeight}px;
    `;
    this.wrapper.appendChild(this.display);

    this.controls = document.createElement("div");
    this.controls.style.cssText = `
      margin-top: 10px;
      display: flex;
      gap: 10px;
      justify-content: center;
    `;
    this.wrapper.appendChild(this.controls);

    this.createButton("[ SHAKE ]", () => this.shake());
    this.createButton("[ DROP ]", () => this.drop());
    this.createButton("[ RESET ]", () => this.reset());

    // Event listeners
    this.wrapper.addEventListener("mousemove", (e) => this.onMouseMove(e));
    this.wrapper.addEventListener("mousedown", () => {
      this.wrapper.style.cursor = "grabbing";
    });
    this.wrapper.addEventListener("mouseup", () => {
      this.wrapper.style.cursor = "grab";
    });

    // Initialize physics
    this.initPhysics();
    this.animate();
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

  initPhysics() {
    const width = this.cols * this.charWidth;
    const height = this.rows * this.charHeight;

    this.system = new VerletSystem({
      gravity: 0.3,
      friction: 0.98,
      bounce: 0.6,
      iterations: 2,
    });

    this.system.setBounds(0, 0, width, height);

    // Calculate starting position to center text
    const textWidth = this.text.length * this.charWidth;
    const startX = (width - textWidth) / 2;
    const startY = height / 3;

    // Create particles for each character
    this.particles = createTextParticles(
      this.text,
      startX,
      startY,
      this.charWidth,
      this.charHeight,
      this.system,
    );
  }

  onMouseMove(e) {
    const rect = this.wrapper.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Detect shake motion
    const dx = x - this.lastMouseX;
    const dy = y - this.lastMouseY;
    const speed = Math.sqrt(dx * dx + dy * dy);

    if (speed > this.shakeThreshold) {
      // Apply force based on mouse movement
      this.system.applyRadialForce(x, y, 100, speed * 0.5);
    }

    this.lastMouseX = x;
    this.lastMouseY = y;
  }

  shake() {
    // Apply random forces to all particles
    for (const p of this.particles) {
      const fx = (Math.random() - 0.5) * 30;
      const fy = (Math.random() - 0.5) * 30 - 10;
      p.applyForce(fx, fy);
    }
  }

  drop() {
    // Unpin all particles and let them fall
    for (const p of this.particles) {
      p.pinned = false;
    }
  }

  reset() {
    // Rebuild text at original positions
    this.isRebuilding = true;

    // Apply spring forces toward original positions
    for (const p of this.particles) {
      if (p.originalX !== undefined && p.originalY !== undefined) {
        const dx = p.originalX - p.x;
        const dy = p.originalY - p.y;
        p.applyForce(dx * 0.1, dy * 0.1);
      }
    }

    // After a delay, stop rebuilding
    setTimeout(() => {
      this.isRebuilding = false;
    }, 2000);
  }

  animate() {
    // Apply rebuild forces if active
    if (this.isRebuilding) {
      for (const p of this.particles) {
        if (p.originalX !== undefined && p.originalY !== undefined) {
          const dx = p.originalX - p.x;
          const dy = p.originalY - p.y;
          p.applyForce(dx * 0.05, dy * 0.05);
        }
      }
    }

    // Step physics
    this.system.step();

    // Render
    this.render();

    this.animationFrame = requestAnimationFrame(() => this.animate());
  }

  render() {
    // Create grid
    const grid = [];
    for (let y = 0; y < this.rows; y++) {
      grid.push(new Array(this.cols).fill(" "));
    }

    // Place particles on grid
    for (const p of this.particles) {
      const x = Math.floor(p.x / this.charWidth);
      const y = Math.floor(p.y / this.charHeight);

      if (x >= 0 && x < this.cols && y >= 0 && y < this.rows) {
        grid[y][x] = p.char;
      }
    }

    // Convert to string with floor indicator
    let output = "";
    for (let y = 0; y < this.rows; y++) {
      if (y === this.rows - 1) {
        // Floor line
        output += "─".repeat(this.cols) + "\n";
      } else {
        output += grid[y].join("") + "\n";
      }
    }

    this.display.textContent = output;
  }

  /**
   * Change the text
   */
  setText(text) {
    this.text = text;
    this.system.clear();
    this.initPhysics();
  }

  dispose() {
    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
    this.wrapper.remove();
  }
}

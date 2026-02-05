/**
 * FlowField - Generative art with particles following noise-based currents
 * Gallery-style meditative visualization
 */

import { noise2D, seed } from "../ascii/noise.js";

export class FlowField {
  constructor(container, options = {}) {
    this.container = container;

    // Configuration
    this.particleCount = options.particleCount || 1000;
    this.noiseScale = options.noiseScale || 0.003;
    this.speed = options.speed || 2;
    this.fadeAmount = options.fadeAmount || 0.03;
    this.lineWidth = options.lineWidth || 1;
    this.colors = options.colors || [
      "#8080ff",
      "#80ffff",
      "#ff80ff",
      "#ffffff",
    ];
    this.cursorInfluence = options.cursorInfluence || 150;

    this.canvas = null;
    this.ctx = null;
    this.particles = [];
    this.width = 0;
    this.height = 0;
    this.time = 0;
    this.mouseX = -1000;
    this.mouseY = -1000;
    this.isHovering = false;
    this.animationId = null;

    // Seed for consistent patterns
    seed(Math.random() * 1000);

    this.init();
  }

  init() {
    this.container.classList.add("flowfield-container");

    // Create canvas
    this.canvas = document.createElement("canvas");
    this.canvas.className = "flowfield-canvas";
    this.ctx = this.canvas.getContext("2d");

    this.container.appendChild(this.canvas);

    // Set size
    this.resize();

    // Create particles
    this.createParticles();

    // Event listeners
    this.onResize = this.resize.bind(this);
    this.onMouseMove = this.handleMouseMove.bind(this);
    this.onMouseEnter = () => (this.isHovering = true);
    this.onMouseLeave = () => {
      this.isHovering = false;
      this.mouseX = -1000;
      this.mouseY = -1000;
    };

    window.addEventListener("resize", this.onResize);
    this.container.addEventListener("mousemove", this.onMouseMove);
    this.container.addEventListener("mouseenter", this.onMouseEnter);
    this.container.addEventListener("mouseleave", this.onMouseLeave);

    // Start animation
    this.animate();
  }

  resize() {
    const rect = this.container.getBoundingClientRect();
    this.width = rect.width || 300;
    this.height = rect.height || 200;

    // Set canvas size with device pixel ratio for sharpness
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.ctx.scale(dpr, dpr);

    // Reset particles
    this.createParticles();
  }

  createParticles() {
    this.particles = [];

    for (let i = 0; i < this.particleCount; i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: 0,
        vy: 0,
        color: this.colors[Math.floor(Math.random() * this.colors.length)],
        life: Math.random(),
      });
    }
  }

  handleMouseMove(e) {
    const rect = this.container.getBoundingClientRect();
    this.mouseX = e.clientX - rect.left;
    this.mouseY = e.clientY - rect.top;
  }

  getFlowAngle(x, y) {
    // Base angle from Perlin noise
    let angle =
      noise2D(x * this.noiseScale, y * this.noiseScale + this.time * 0.0005) *
      Math.PI *
      4;

    // Cursor influence
    if (this.isHovering) {
      const dx = this.mouseX - x;
      const dy = this.mouseY - y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < this.cursorInfluence) {
        const cursorAngle = Math.atan2(dy, dx);
        const influence = 1 - dist / this.cursorInfluence;
        // Blend base angle with cursor angle
        angle = angle * (1 - influence * 0.5) + cursorAngle * influence * 0.5;
      }
    }

    return angle;
  }

  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());

    // Fade effect
    this.ctx.fillStyle = `rgba(15, 17, 20, ${this.fadeAmount})`;
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.time++;

    // Update and draw particles
    this.particles.forEach((p) => {
      // Get flow direction
      const angle = this.getFlowAngle(p.x, p.y);

      // Apply force
      p.vx += Math.cos(angle) * 0.2;
      p.vy += Math.sin(angle) * 0.2;

      // Limit velocity
      const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      if (speed > this.speed) {
        p.vx = (p.vx / speed) * this.speed;
        p.vy = (p.vy / speed) * this.speed;
      }

      // Store previous position
      const prevX = p.x;
      const prevY = p.y;

      // Update position
      p.x += p.vx;
      p.y += p.vy;

      // Draw line
      this.ctx.beginPath();
      this.ctx.moveTo(prevX, prevY);
      this.ctx.lineTo(p.x, p.y);
      this.ctx.strokeStyle = p.color;
      this.ctx.lineWidth = this.lineWidth;
      this.ctx.lineCap = "round";
      this.ctx.globalAlpha = 0.5 + p.life * 0.5;
      this.ctx.stroke();
      this.ctx.globalAlpha = 1;

      // Wrap around edges
      if (p.x < 0) p.x = this.width;
      if (p.x > this.width) p.x = 0;
      if (p.y < 0) p.y = this.height;
      if (p.y > this.height) p.y = 0;

      // Update life
      p.life -= 0.001;
      if (p.life <= 0) {
        // Respawn
        p.x = Math.random() * this.width;
        p.y = Math.random() * this.height;
        p.vx = 0;
        p.vy = 0;
        p.life = 1;
      }
    });
  }

  dispose() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    window.removeEventListener("resize", this.onResize);
    this.container.removeEventListener("mousemove", this.onMouseMove);
    this.container.removeEventListener("mouseenter", this.onMouseEnter);
    this.container.removeEventListener("mouseleave", this.onMouseLeave);
    this.container.innerHTML = "";
  }
}

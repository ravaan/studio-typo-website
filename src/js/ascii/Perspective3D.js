/**
 * Perspective3D - CSS 3D transforms with mouse-controlled rotation
 * Premium, dimensional effect with parallax and shadows
 */

import { AsciiArt } from "./AsciiArt.js";

export class Perspective3D extends AsciiArt {
  constructor(container, asciiString, options = {}) {
    super(container, asciiString, options);

    this.perspective = options.perspective || 800;
    this.maxRotation = options.maxRotation || 20;
    this.depthScale = options.depthScale || 50;

    this.targetRotateX = 0;
    this.targetRotateY = 0;
    this.currentRotateX = 0;
    this.currentRotateY = 0;

    this.isHovering = false;
    this.chars = [];

    this.initPerspective();
  }

  initPerspective() {
    this.container.classList.add("ascii-perspective");

    // Create perspective container
    const wrapper = document.createElement("div");
    wrapper.className = "perspective-wrapper";
    wrapper.style.cssText = `
      position: relative;
      padding: 2rem;
      perspective: ${this.perspective}px;
      perspective-origin: center center;
    `;

    // Create 3D stage
    const stage = document.createElement("div");
    stage.className = "perspective-stage";
    stage.style.cssText = `
      position: relative;
      transform-style: preserve-3d;
      transition: transform 0.1s ease-out;
      font-family: monospace;
      white-space: pre;
      line-height: 1.2;
      background: var(--bg-secondary);
      padding: 1rem;
      border-radius: 4px;
    `;

    // Parse ASCII and create layered characters
    const lines = this.asciiString.split("\n");
    const centerRow = lines.length / 2;
    const centerCol = Math.max(...lines.map((l) => l.length)) / 2;

    lines.forEach((line, row) => {
      const lineDiv = document.createElement("div");
      lineDiv.className = "perspective-line";
      lineDiv.style.cssText = `
        position: relative;
        height: 1.2em;
        transform-style: preserve-3d;
      `;

      [...line].forEach((char, col) => {
        const span = document.createElement("span");
        span.textContent = char;
        span.className = "perspective-char";

        // Apply color if available
        if (this.colors && this.colors[row] && this.colors[row][col]) {
          const color = this.colors[row][col];
          const boost = 1.1;
          const r = Math.min(255, Math.round(color.r * boost));
          const g = Math.min(255, Math.round(color.g * boost));
          const b = Math.min(255, Math.round(color.b * boost));
          span.style.color = `rgb(${r},${g},${b})`;
          span.dataset.originalColor = `rgb(${r},${g},${b})`;
        }

        // Calculate depth based on distance from center
        const distFromCenter = Math.sqrt(
          Math.pow(row - centerRow, 2) + Math.pow(col - centerCol, 2),
        );
        const maxDist = Math.sqrt(
          Math.pow(centerRow, 2) + Math.pow(centerCol, 2),
        );
        const normalizedDist = distFromCenter / maxDist;

        // Characters further from center get more depth
        const depth = normalizedDist * this.depthScale;

        span.style.cssText = `
          display: inline-block;
          width: 1ch;
          transform-style: preserve-3d;
          transform: translateZ(${depth}px);
          transition: transform 0.3s ease, text-shadow 0.3s ease;
        `;

        if (char !== " ") {
          this.chars.push({
            element: span,
            depth,
            row,
            col,
            distFromCenter: normalizedDist,
          });
        }

        lineDiv.appendChild(span);
      });

      stage.appendChild(lineDiv);
    });

    // Ambient shadow layer
    const shadow = document.createElement("div");
    shadow.className = "perspective-shadow";
    shadow.style.cssText = `
      position: absolute;
      inset: 10%;
      background: radial-gradient(ellipse at center, rgba(0,0,0,0.3) 0%, transparent 70%);
      transform: translateZ(-60px) rotateX(90deg);
      filter: blur(10px);
      opacity: 0.5;
      pointer-events: none;
    `;
    stage.appendChild(shadow);
    this.shadow = shadow;

    wrapper.appendChild(stage);
    this.container.appendChild(wrapper);
    this.wrapper = wrapper;
    this.stage = stage;

    // Event listeners
    this.onMouseMove = (e) => {
      const rect = this.wrapper.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;

      this.targetRotateX = -y * this.maxRotation;
      this.targetRotateY = x * this.maxRotation;
    };

    this.onMouseEnter = () => {
      this.isHovering = true;
    };

    this.onMouseLeave = () => {
      this.isHovering = false;
      this.targetRotateX = 0;
      this.targetRotateY = 0;
    };

    this.wrapper.addEventListener("mousemove", this.onMouseMove);
    this.wrapper.addEventListener("mouseenter", this.onMouseEnter);
    this.wrapper.addEventListener("mouseleave", this.onMouseLeave);

    // Start animation
    this.animate();
  }

  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());

    // Smooth rotation interpolation
    this.currentRotateX += (this.targetRotateX - this.currentRotateX) * 0.08;
    this.currentRotateY += (this.targetRotateY - this.currentRotateY) * 0.08;

    // Apply rotation to stage
    this.stage.style.transform = `
      rotateX(${this.currentRotateX}deg)
      rotateY(${this.currentRotateY}deg)
    `;

    // Update shadow based on rotation
    const shadowX = this.currentRotateY * 0.5;
    const shadowY = -this.currentRotateX * 0.5;
    this.shadow.style.transform = `
      translateZ(-60px)
      translateX(${shadowX}px)
      translateY(${shadowY}px)
      rotateX(90deg)
    `;

    // Update character effects
    const rotationMagnitude = Math.sqrt(
      this.currentRotateX * this.currentRotateX +
        this.currentRotateY * this.currentRotateY,
    );
    const normalizedRotation = rotationMagnitude / this.maxRotation;

    this.chars.forEach((char) => {
      // Dynamic text shadow based on rotation (light source simulation)
      const shadowOffsetX = -this.currentRotateY * 0.1 * char.depth * 0.05;
      const shadowOffsetY = this.currentRotateX * 0.1 * char.depth * 0.05;

      // Highlight/shadow based on position relative to rotation
      const highlight =
        char.distFromCenter * normalizedRotation * 0.3 +
        (this.currentRotateY > 0 ? 1 : -1) *
          (char.col > this.chars.length / 2 ? 0.1 : -0.1);

      if (normalizedRotation > 0.1) {
        char.element.style.textShadow = `
          ${shadowOffsetX}px ${shadowOffsetY}px ${2 + char.depth * 0.05}px rgba(0,0,0,0.3),
          0 0 ${highlight * 10}px rgba(128, 128, 255, ${highlight * 0.5})
        `;

        // Subtle color shift based on depth and rotation (only if no original color)
        if (!char.element.dataset.originalColor) {
          const hue = 220 + highlight * 30;
          const lightness = 60 + highlight * 20;
          char.element.style.color = `hsl(${hue}, 20%, ${lightness}%)`;
        }
      } else {
        char.element.style.textShadow = "";
        if (!char.element.dataset.originalColor) {
          char.element.style.color = "";
        }
      }
    });
  }

  dispose() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.wrapper?.removeEventListener("mousemove", this.onMouseMove);
    this.wrapper?.removeEventListener("mouseenter", this.onMouseEnter);
    this.wrapper?.removeEventListener("mouseleave", this.onMouseLeave);
    this.container.innerHTML = "";
  }
}

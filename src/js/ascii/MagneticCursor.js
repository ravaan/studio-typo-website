/**
 * MagneticCursor - Physics-based cursor interaction
 * Characters are attracted to or repelled by cursor position
 */

import { AsciiArt } from "./AsciiArt.js";

export class MagneticCursor extends AsciiArt {
  constructor(container, asciiString, options = {}) {
    super(container, asciiString, options);

    this.strength = options.strength || 50;
    this.radius = options.radius || 100;
    this.repel = options.repel !== false; // Default to repel
    this.damping = options.damping || 0.85;
    this.returnSpeed = options.returnSpeed || 0.1;

    this.chars = [];
    this.mouseX = -1000;
    this.mouseY = -1000;
    this.isHovering = false;

    this.initMagnetic();
  }

  initMagnetic() {
    this.container.classList.add("ascii-magnetic");

    // Create wrapper
    const wrapper = document.createElement("div");
    wrapper.className = "magnetic-wrapper";
    wrapper.style.cssText = `
      position: relative;
      font-family: monospace;
      white-space: pre;
      line-height: 1.2;
      padding: 1rem;
      background: var(--bg-secondary);
      border-radius: 4px;
      overflow: hidden;
    `;

    // Parse ASCII and create individual character spans
    const lines = this.asciiString.split("\n");
    const charHeight = 16; // Approximate line height
    const charWidth = 9.6; // Approximate char width for monospace

    lines.forEach((line, row) => {
      const lineDiv = document.createElement("div");
      lineDiv.style.cssText = "height: 1.2em; position: relative;";

      [...line].forEach((char, col) => {
        if (char === " ") {
          // Preserve spaces but don't animate them
          const space = document.createElement("span");
          space.textContent = " ";
          space.style.display = "inline-block";
          space.style.width = "1ch";
          lineDiv.appendChild(space);
          return;
        }

        const span = document.createElement("span");
        span.textContent = char;
        span.className = "magnetic-char";
        
        // Apply color if available
        let colorStyle = '';
        if (this.colors && this.colors[row] && this.colors[row][col]) {
          const color = this.colors[row][col];
          const boost = 1.1;
          const r = Math.min(255, Math.round(color.r * boost));
          const g = Math.min(255, Math.round(color.g * boost));
          const b = Math.min(255, Math.round(color.b * boost));
          colorStyle = `color: rgb(${r},${g},${b});`;
          span.dataset.originalColor = `rgb(${r},${g},${b})`;
        }
        
        span.style.cssText = `
          display: inline-block;
          width: 1ch;
          transition: color 0.3s ease;
          will-change: transform;
          ${colorStyle}
        `;

        // Store character data
        this.chars.push({
          element: span,
          originalX: col * charWidth,
          originalY: row * charHeight,
          x: 0,
          y: 0,
          vx: 0,
          vy: 0,
        });

        lineDiv.appendChild(span);
      });

      wrapper.appendChild(lineDiv);
    });

    this.container.appendChild(wrapper);
    this.wrapper = wrapper;

    // Event listeners
    this.onMouseMove = (e) => {
      const rect = this.wrapper.getBoundingClientRect();
      this.mouseX = e.clientX - rect.left;
      this.mouseY = e.clientY - rect.top;
    };

    this.onMouseEnter = () => {
      this.isHovering = true;
    };

    this.onMouseLeave = () => {
      this.isHovering = false;
      this.mouseX = -1000;
      this.mouseY = -1000;
    };

    this.wrapper.addEventListener("mousemove", this.onMouseMove);
    this.wrapper.addEventListener("mouseenter", this.onMouseEnter);
    this.wrapper.addEventListener("mouseleave", this.onMouseLeave);

    // Start animation
    this.animate();
  }

  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());

    const charHeight = 16;
    const charWidth = 9.6;

    this.chars.forEach((char) => {
      // Calculate distance from cursor
      const charCenterX = char.originalX + charWidth / 2;
      const charCenterY = char.originalY + charHeight / 2;

      const dx = this.mouseX - charCenterX;
      const dy = this.mouseY - charCenterY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (this.isHovering && dist < this.radius && dist > 0) {
        // Calculate force (inverse square with distance)
        const force = Math.min((this.strength / (dist * dist)) * 100, 20);
        const angle = Math.atan2(dy, dx);

        // Apply force (repel or attract)
        const direction = this.repel ? -1 : 1;
        char.vx += Math.cos(angle) * force * direction;
        char.vy += Math.sin(angle) * force * direction;

        // Highlight nearby characters (only if no original color)
        if (!char.element.dataset.originalColor) {
          const proximity = 1 - dist / this.radius;
          char.element.style.color = `rgba(128, 128, 255, ${0.5 + proximity * 0.5})`;
        }
      } else {
        // Return to original color
        char.element.style.color = char.element.dataset.originalColor || "";
      }

      // Apply damping
      char.vx *= this.damping;
      char.vy *= this.damping;

      // Apply velocity
      char.x += char.vx;
      char.y += char.vy;

      // Return force (spring back to origin)
      char.x += -char.x * this.returnSpeed;
      char.y += -char.y * this.returnSpeed;

      // Clamp displacement
      const maxDisplacement = 30;
      char.x = Math.max(-maxDisplacement, Math.min(maxDisplacement, char.x));
      char.y = Math.max(-maxDisplacement, Math.min(maxDisplacement, char.y));

      // Apply transform
      if (Math.abs(char.x) > 0.1 || Math.abs(char.y) > 0.1) {
        char.element.style.transform = `translate(${char.x}px, ${char.y}px)`;
      } else {
        char.element.style.transform = "";
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

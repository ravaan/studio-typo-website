/**
 * ParticleReform - Characters scatter and reform on hover
 */

import { AsciiArt } from "./AsciiArt.js";

export class ParticleReform extends AsciiArt {
  constructor(container, asciiString) {
    super(container, asciiString);
    this.particles = [];
    this.isFormed = false;
    this.initParticles();
  }

  initParticles() {
    // Set container to relative for absolute positioning
    this.container.style.position = "relative";

    const pre = this.container.querySelector(".ascii-pre");
    if (pre) {
      pre.style.position = "relative";
    }

    // Initialize particle positions
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const element = this.getElement(row, col);
        const char = this.getChar(row, col);

        if (!element || char === " ") continue;

        // Calculate target position (where char should be)
        const charWidth = 9.6; // Approximate monospace char width
        const lineHeight = 14.4; // line-height * font-size
        const targetX = col * charWidth;
        const targetY = row * lineHeight;

        // Random scattered position
        const angle = Math.random() * Math.PI * 2;
        const distance = 100 + Math.random() * 150;
        const scatteredX = targetX + Math.cos(angle) * distance;
        const scatteredY = targetY + Math.sin(angle) * distance;

        const particle = {
          element,
          row,
          col,
          targetX,
          targetY,
          currentX: scatteredX,
          currentY: scatteredY,
          velocityX: 0,
          velocityY: 0,
        };

        this.particles.push(particle);

        // Style for absolute positioning
        element.style.position = "absolute";
        element.style.left = "0";
        element.style.top = "0";
        element.style.transform = `translate(${scatteredX}px, ${scatteredY}px)`;
        element.classList.add("particle");
      }
    }

    // Start physics simulation
    this.startPhysics();
  }

  startPhysics() {
    const animate = () => {
      for (const particle of this.particles) {
        let targetX, targetY;

        if (this.isHovered) {
          // Move towards formed position
          targetX = particle.targetX;
          targetY = particle.targetY;
        } else {
          // Stay scattered or drift
          targetX = particle.currentX + (Math.random() - 0.5) * 2;
          targetY = particle.currentY + (Math.random() - 0.5) * 2;
        }

        // Spring physics
        const springStrength = this.isHovered ? 0.08 : 0.01;
        const damping = 0.85;

        const dx = targetX - particle.currentX;
        const dy = targetY - particle.currentY;

        particle.velocityX += dx * springStrength;
        particle.velocityY += dy * springStrength;
        particle.velocityX *= damping;
        particle.velocityY *= damping;

        particle.currentX += particle.velocityX;
        particle.currentY += particle.velocityY;

        particle.element.style.transform = `translate(${particle.currentX}px, ${particle.currentY}px)`;

        // Add formed class when close to target
        if (this.isHovered) {
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 1) {
            particle.element.classList.add("particle-formed");
          }
        } else {
          particle.element.classList.remove("particle-formed");
        }
      }

      this.animationFrame = requestAnimationFrame(animate);
    };

    this.animationFrame = requestAnimationFrame(animate);
  }

  onHover() {
    this.isFormed = true;
  }

  onLeave() {
    setTimeout(() => {
      if (!this.isHovered) {
        this.isFormed = false;

        // Explode particles
        for (const particle of this.particles) {
          const angle = Math.random() * Math.PI * 2;
          const force = 5 + Math.random() * 10;
          particle.velocityX += Math.cos(angle) * force;
          particle.velocityY += Math.sin(angle) * force;
        }
      }
    }, 100);
  }
}

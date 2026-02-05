/**
 * WaveDistortion - Characters wave like water, calm on hover
 */

import { AsciiArt } from "./AsciiArt.js";

export class WaveDistortion extends AsciiArt {
  constructor(container, asciiString, options = {}) {
    super(container, asciiString, options);
    this.amplitude = 3;
    this.targetAmplitude = 3;
    this.frequency = 0.15;
    this.speed = 0.003;
    this.startTime = performance.now();
    this.initWave();
  }

  initWave() {
    // Mark all characters for wave animation
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const element = this.getElement(row, col);
        if (element) {
          element.classList.add("wave-char");
        }
      }
    }

    this.startWaveAnimation();
  }

  startWaveAnimation() {
    const animate = (currentTime) => {
      const elapsed = currentTime - this.startTime;

      // Smooth amplitude transition
      this.amplitude += (this.targetAmplitude - this.amplitude) * 0.1;

      for (let row = 0; row < this.rows; row++) {
        for (let col = 0; col < this.cols; col++) {
          const element = this.getElement(row, col);
          if (!element) continue;

          const originalChar = this.getChar(row, col);
          if (originalChar === " ") continue;

          // Calculate wave offset
          const phase =
            col * this.frequency +
            row * this.frequency * 0.5 +
            elapsed * this.speed;
          const offsetX = Math.sin(phase) * this.amplitude;
          const offsetY = Math.cos(phase * 0.7) * this.amplitude * 0.5;

          element.style.transform = `translate(${offsetX}px, ${offsetY}px)`;

          // Subtle opacity variation
          const opacityWave = 0.7 + Math.sin(phase * 1.5) * 0.3;
          element.style.opacity = this.amplitude > 0.5 ? opacityWave : 1;
        }
      }

      this.animationFrame = requestAnimationFrame(animate);
    };

    this.animationFrame = requestAnimationFrame(animate);
  }

  onHover() {
    // Calm the waves
    this.targetAmplitude = 0;

    // Add calm class
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        this.getElement(row, col)?.classList.add("wave-calm");
      }
    }
  }

  onLeave() {
    // Bring back the waves
    setTimeout(() => {
      if (!this.isHovered) {
        this.targetAmplitude = 3;

        for (let row = 0; row < this.rows; row++) {
          for (let col = 0; col < this.cols; col++) {
            this.getElement(row, col)?.classList.remove("wave-calm");
          }
        }
      }
    }, 200);
  }
}

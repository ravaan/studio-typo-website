/**
 * ParallaxCard - Premium 3D tilt effect with holographic shine
 * Apple-style polish with depth layers and light reflection
 */

export class ParallaxCard {
  constructor(container, options = {}) {
    this.container = container;
    this.maxRotation = options.maxRotation || 15;
    this.perspective = options.perspective || 1000;
    this.shine = options.shine !== false;
    this.layers = options.layers || [];

    this.card = null;
    this.shineEl = null;
    this.layerEls = [];

    this.currentRotateX = 0;
    this.currentRotateY = 0;
    this.targetRotateX = 0;
    this.targetRotateY = 0;

    this.isHovering = false;
    this.animationId = null;

    this.init();
  }

  init() {
    this.container.classList.add("parallax-container");
    this.container.style.perspective = `${this.perspective}px`;

    // Create card element
    this.card = document.createElement("div");
    this.card.className = "parallax-card";

    // Create layers (if provided) or use default content
    if (this.layers.length > 0) {
      this.layers.forEach((layer, index) => {
        const layerEl = document.createElement("div");
        layerEl.className = "parallax-layer";
        layerEl.style.setProperty("--depth", index);

        if (layer.image) {
          layerEl.style.backgroundImage = `url(${layer.image})`;
          layerEl.style.backgroundSize = "cover";
          layerEl.style.backgroundPosition = "center";
        } else if (layer.content) {
          layerEl.innerHTML = layer.content;
        }

        this.card.appendChild(layerEl);
        this.layerEls.push(layerEl);
      });
    } else {
      // Default demo content
      const bg = document.createElement("div");
      bg.className = "parallax-layer parallax-bg";
      bg.style.setProperty("--depth", 0);

      const content = document.createElement("div");
      content.className = "parallax-layer parallax-content";
      content.style.setProperty("--depth", 2);
      content.innerHTML = `
        <div class="parallax-text">
          <span class="parallax-title">PROJECT</span>
          <span class="parallax-subtitle">Hover to interact</span>
        </div>
      `;

      this.card.appendChild(bg);
      this.card.appendChild(content);
      this.layerEls = [bg, content];
    }

    // Create shine overlay
    if (this.shine) {
      this.shineEl = document.createElement("div");
      this.shineEl.className = "parallax-shine";
      this.card.appendChild(this.shineEl);
    }

    this.container.appendChild(this.card);

    // Event listeners
    this.onMouseMove = this.handleMouseMove.bind(this);
    this.onMouseEnter = this.handleMouseEnter.bind(this);
    this.onMouseLeave = this.handleMouseLeave.bind(this);

    this.container.addEventListener("mousemove", this.onMouseMove);
    this.container.addEventListener("mouseenter", this.onMouseEnter);
    this.container.addEventListener("mouseleave", this.onMouseLeave);

    // Start animation loop
    this.animate();
  }

  handleMouseMove(e) {
    if (!this.isHovering) return;

    const rect = this.container.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    // Calculate rotation (centered at 0.5, 0.5)
    this.targetRotateY = (x - 0.5) * this.maxRotation * 2;
    this.targetRotateX = (0.5 - y) * this.maxRotation * 2;

    // Update shine position
    if (this.shineEl) {
      const shineX = x * 100;
      const shineY = y * 100;
      const angle = Math.atan2(y - 0.5, x - 0.5) * (180 / Math.PI) + 90;
      this.shineEl.style.setProperty("--shine-x", `${shineX}%`);
      this.shineEl.style.setProperty("--shine-y", `${shineY}%`);
      this.shineEl.style.setProperty("--shine-angle", `${angle}deg`);
    }
  }

  handleMouseEnter() {
    this.isHovering = true;
    this.card.classList.add("hovering");
  }

  handleMouseLeave() {
    this.isHovering = false;
    this.targetRotateX = 0;
    this.targetRotateY = 0;
    this.card.classList.remove("hovering");
  }

  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());

    // Smooth interpolation
    const easing = this.isHovering ? 0.1 : 0.05;
    this.currentRotateX += (this.targetRotateX - this.currentRotateX) * easing;
    this.currentRotateY += (this.targetRotateY - this.currentRotateY) * easing;

    // Apply transform
    this.card.style.transform = `
      rotateX(${this.currentRotateX}deg)
      rotateY(${this.currentRotateY}deg)
    `;

    // Parallax layers
    this.layerEls.forEach((layer) => {
      const depth = parseFloat(layer.style.getPropertyValue("--depth")) || 0;
      const translateZ = depth * 20;
      const translateX = this.currentRotateY * depth * 0.5;
      const translateY = -this.currentRotateX * depth * 0.5;

      layer.style.transform = `
        translateZ(${translateZ}px)
        translateX(${translateX}px)
        translateY(${translateY}px)
      `;
    });
  }

  dispose() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.container.removeEventListener("mousemove", this.onMouseMove);
    this.container.removeEventListener("mouseenter", this.onMouseEnter);
    this.container.removeEventListener("mouseleave", this.onMouseLeave);
    this.container.innerHTML = "";
  }
}

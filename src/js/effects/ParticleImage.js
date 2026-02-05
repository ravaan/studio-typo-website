/**
 * ParticleImage - Image explodes into particles and reforms
 * Dramatic cinematic "Thanos snap" effect
 */

export class ParticleImage {
  constructor(container, options = {}) {
    this.container = container;

    // Configuration
    this.imageSrc = options.image || null;
    this.particleGap = options.particleGap || 4;
    this.particleSize = options.particleSize || 3;
    this.disperseStrength = options.disperseStrength || 100;
    this.returnSpeed = options.returnSpeed || 0.05;
    this.friction = options.friction || 0.95;

    this.canvas = null;
    this.ctx = null;
    this.particles = [];
    this.width = 0;
    this.height = 0;
    this.mouseX = 0;
    this.mouseY = 0;
    this.isHovering = false;
    this.isDisposed = false;
    this.animationId = null;
    this.imageLoaded = false;

    this.init();
  }

  async init() {
    this.container.classList.add("particle-image-container");

    // Create canvas
    this.canvas = document.createElement("canvas");
    this.canvas.className = "particle-image-canvas";
    this.ctx = this.canvas.getContext("2d");

    this.container.appendChild(this.canvas);

    // Set size
    this.resize();

    // Load image or create default gradient
    if (this.imageSrc) {
      await this.loadImage(this.imageSrc);
    } else {
      this.createDefaultImage();
    }

    // Event listeners
    this.onResize = this.resize.bind(this);
    this.onMouseMove = this.handleMouseMove.bind(this);
    this.onMouseEnter = () => (this.isHovering = true);
    this.onMouseLeave = () => (this.isHovering = false);

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

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.ctx.scale(dpr, dpr);

    // Recreate particles if image is loaded
    if (this.imageLoaded) {
      this.createParticlesFromImage();
    }
  }

  async loadImage(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        this.sourceImage = img;
        this.imageLoaded = true;
        this.createParticlesFromImage();
        resolve();
      };
      img.onerror = () => {
        this.createDefaultImage();
        resolve();
      };
      img.src = src;
    });
  }

  createDefaultImage() {
    // Create a gradient image as default
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = this.width;
    tempCanvas.height = this.height;
    const tempCtx = tempCanvas.getContext("2d");

    // Create gradient
    const gradient = tempCtx.createLinearGradient(
      0,
      0,
      this.width,
      this.height,
    );
    gradient.addColorStop(0, "#667eea");
    gradient.addColorStop(0.5, "#764ba2");
    gradient.addColorStop(1, "#f093fb");

    tempCtx.fillStyle = gradient;
    tempCtx.fillRect(0, 0, this.width, this.height);

    // Add some shapes
    tempCtx.fillStyle = "rgba(255, 255, 255, 0.1)";
    for (let i = 0; i < 5; i++) {
      const x = Math.random() * this.width;
      const y = Math.random() * this.height;
      const r = 30 + Math.random() * 50;
      tempCtx.beginPath();
      tempCtx.arc(x, y, r, 0, Math.PI * 2);
      tempCtx.fill();
    }

    this.sourceImage = tempCanvas;
    this.imageLoaded = true;
    this.createParticlesFromImage();
  }

  createParticlesFromImage() {
    this.particles = [];

    // Draw source to get pixel data
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = this.width;
    tempCanvas.height = this.height;
    const tempCtx = tempCanvas.getContext("2d");

    if (this.sourceImage instanceof HTMLCanvasElement) {
      tempCtx.drawImage(this.sourceImage, 0, 0, this.width, this.height);
    } else {
      // Scale image to fit
      const scale = Math.max(
        this.width / this.sourceImage.width,
        this.height / this.sourceImage.height,
      );
      const w = this.sourceImage.width * scale;
      const h = this.sourceImage.height * scale;
      const x = (this.width - w) / 2;
      const y = (this.height - h) / 2;
      tempCtx.drawImage(this.sourceImage, x, y, w, h);
    }

    const imageData = tempCtx.getImageData(0, 0, this.width, this.height);
    const data = imageData.data;

    for (let y = 0; y < this.height; y += this.particleGap) {
      for (let x = 0; x < this.width; x += this.particleGap) {
        const i = (y * this.width + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        if (a > 128) {
          this.particles.push({
            x,
            y,
            originX: x,
            originY: y,
            vx: 0,
            vy: 0,
            color: `rgb(${r}, ${g}, ${b})`,
            size: this.particleSize + Math.random(),
          });
        }
      }
    }
  }

  handleMouseMove(e) {
    const rect = this.container.getBoundingClientRect();
    this.mouseX = e.clientX - rect.left;
    this.mouseY = e.clientY - rect.top;
  }

  animate() {
    if (this.isDisposed) return;
    this.animationId = requestAnimationFrame(() => this.animate());

    this.ctx.clearRect(0, 0, this.width, this.height);

    this.particles.forEach((p) => {
      if (this.isHovering) {
        // Calculate distance from mouse
        const dx = p.x - this.mouseX;
        const dy = p.y - this.mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < this.disperseStrength) {
          // Push away from mouse
          const force = (this.disperseStrength - dist) / this.disperseStrength;
          const angle = Math.atan2(dy, dx);
          p.vx += Math.cos(angle) * force * 3;
          p.vy += Math.sin(angle) * force * 3;
        }
      }

      // Return to origin
      const dx = p.originX - p.x;
      const dy = p.originY - p.y;
      p.vx += dx * this.returnSpeed;
      p.vy += dy * this.returnSpeed;

      // Apply friction
      p.vx *= this.friction;
      p.vy *= this.friction;

      // Update position
      p.x += p.vx;
      p.y += p.vy;

      // Draw particle
      this.ctx.fillStyle = p.color;
      this.ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    });
  }

  dispose() {
    this.isDisposed = true;
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

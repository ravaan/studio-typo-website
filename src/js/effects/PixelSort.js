/**
 * PixelSort - Glitch art pixel sorting effect
 * Kim Asendorf-style sorting by brightness/hue
 */

export class PixelSort {
  constructor(container, options = {}) {
    this.container = container;

    // Configuration
    this.imageSrc = options.image || null;
    this.sortMode = options.sortMode || "brightness"; // brightness, hue, saturation
    this.threshold = options.threshold || 50;
    this.direction = options.direction || "vertical"; // vertical, horizontal
    this.animationSpeed = options.animationSpeed || 5;

    this.canvas = null;
    this.ctx = null;
    this.originalImageData = null;
    this.currentImageData = null;
    this.width = 0;
    this.height = 0;
    this.sortProgress = 0;
    this.targetProgress = 0;
    this.isHovering = false;
    this.isDisposed = false;
    this.animationId = null;

    this.init();
  }

  async init() {
    this.container.classList.add("pixelsort-container");

    // Create canvas
    this.canvas = document.createElement("canvas");
    this.canvas.className = "pixelsort-canvas";
    this.ctx = this.canvas.getContext("2d", { willReadFrequently: true });

    this.container.appendChild(this.canvas);

    // Set size
    this.resize();

    // Load image or create default
    if (this.imageSrc) {
      await this.loadImage(this.imageSrc);
    } else {
      this.createDefaultImage();
    }

    // Event listeners
    this.onResize = this.resize.bind(this);
    this.onMouseMove = this.handleMouseMove.bind(this);
    this.onMouseEnter = () => {
      this.isHovering = true;
      this.targetProgress = 1;
    };
    this.onMouseLeave = () => {
      this.isHovering = false;
      this.targetProgress = 0;
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

    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
  }

  async loadImage(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        this.drawImage(img);
        this.originalImageData = this.ctx.getImageData(
          0,
          0,
          this.width,
          this.height,
        );
        resolve();
      };
      img.onerror = () => {
        this.createDefaultImage();
        resolve();
      };
      img.src = src;
    });
  }

  drawImage(img) {
    const scale = Math.max(this.width / img.width, this.height / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    const x = (this.width - w) / 2;
    const y = (this.height - h) / 2;
    this.ctx.drawImage(img, x, y, w, h);
  }

  createDefaultImage() {
    // Create gradient with noise
    const gradient = this.ctx.createLinearGradient(
      0,
      0,
      this.width,
      this.height,
    );
    gradient.addColorStop(0, "#1a1a2e");
    gradient.addColorStop(0.3, "#16213e");
    gradient.addColorStop(0.6, "#0f3460");
    gradient.addColorStop(1, "#e94560");

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Add some noise/texture
    const imageData = this.ctx.getImageData(0, 0, this.width, this.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 30;
      data[i] = Math.min(255, Math.max(0, data[i] + noise));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
    }

    this.ctx.putImageData(imageData, 0, 0);
    this.originalImageData = this.ctx.getImageData(
      0,
      0,
      this.width,
      this.height,
    );
  }

  handleMouseMove(e) {
    const rect = this.container.getBoundingClientRect();
    const y = e.clientY - rect.top;
    // Use mouse Y position to control sort intensity/threshold
    this.threshold = 20 + (y / this.height) * 200;
  }

  getBrightness(r, g, b) {
    return 0.299 * r + 0.587 * g + 0.114 * b;
  }

  getHue(r, g, b) {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;

    if (max !== min) {
      const d = max - min;
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      else if (max === g) h = ((b - r) / d + 2) / 6;
      else h = ((r - g) / d + 4) / 6;
    }

    return h * 255;
  }

  getSortValue(r, g, b) {
    switch (this.sortMode) {
      case "hue":
        return this.getHue(r, g, b);
      case "saturation":
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        return max === 0 ? 0 : ((max - min) / max) * 255;
      default:
        return this.getBrightness(r, g, b);
    }
  }

  sortColumn(imageData, x, progress) {
    const data = imageData.data;
    const column = [];

    // Extract column pixels
    for (let y = 0; y < this.height; y++) {
      const i = (y * this.width + x) * 4;
      column.push({
        r: data[i],
        g: data[i + 1],
        b: data[i + 2],
        a: data[i + 3],
        sortValue: this.getSortValue(data[i], data[i + 1], data[i + 2]),
        originalY: y,
      });
    }

    // Find spans to sort (pixels above threshold)
    let spans = [];
    let spanStart = -1;

    for (let y = 0; y < column.length; y++) {
      const inSpan = column[y].sortValue > this.threshold;

      if (inSpan && spanStart === -1) {
        spanStart = y;
      } else if (!inSpan && spanStart !== -1) {
        spans.push({ start: spanStart, end: y });
        spanStart = -1;
      }
    }

    if (spanStart !== -1) {
      spans.push({ start: spanStart, end: column.length });
    }

    // Sort each span
    spans.forEach((span) => {
      const subArray = column.slice(span.start, span.end);
      subArray.sort((a, b) => a.sortValue - b.sortValue);

      // Interpolate between original and sorted based on progress
      for (let i = 0; i < subArray.length; i++) {
        const targetY = span.start + i;
        const originalPixel = column[targetY];
        const sortedPixel = subArray[i];

        // Lerp between original and sorted
        column[targetY] = {
          r: Math.round(
            originalPixel.r * (1 - progress) + sortedPixel.r * progress,
          ),
          g: Math.round(
            originalPixel.g * (1 - progress) + sortedPixel.g * progress,
          ),
          b: Math.round(
            originalPixel.b * (1 - progress) + sortedPixel.b * progress,
          ),
          a: originalPixel.a,
        };
      }
    });

    // Write back to image data
    for (let y = 0; y < this.height; y++) {
      const i = (y * this.width + x) * 4;
      data[i] = column[y].r;
      data[i + 1] = column[y].g;
      data[i + 2] = column[y].b;
      data[i + 3] = column[y].a;
    }
  }

  animate() {
    if (this.isDisposed) return;
    this.animationId = requestAnimationFrame(() => this.animate());

    if (!this.originalImageData) return;

    // Smooth progress transition
    this.sortProgress += (this.targetProgress - this.sortProgress) * 0.08;

    // Clone original data
    const imageData = new ImageData(
      new Uint8ClampedArray(this.originalImageData.data),
      this.width,
      this.height,
    );

    // Sort columns based on current progress
    if (this.sortProgress > 0.01) {
      for (let x = 0; x < this.width; x++) {
        this.sortColumn(imageData, x, this.sortProgress);
      }
    }

    this.ctx.putImageData(imageData, 0, 0);
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

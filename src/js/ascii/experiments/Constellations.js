/**
 * ASCII Constellations
 * Interactive star map with twinkling stars and constellation drawing
 */

export class Constellations {
  constructor(container, options = {}) {
    this.container = container;
    this.cols = options.cols || 80;
    this.rows = options.rows || 30;
    this.starCount = options.starCount || 100;

    this.stars = [];
    this.connections = [];
    this.selectedStar = null;
    this.hoveredStar = null;
    this.animationFrame = null;
    this.time = 0;

    this.starChars = [".", "·", "*", "✦", "✧", "★", "☆"];
    this.twinkleSpeed = 0.05;

    this.init();
  }

  init() {
    this.wrapper = document.createElement("div");
    this.wrapper.className = "constellations-wrapper";
    this.wrapper.style.cssText = `
      font-family: var(--font-mono, monospace);
      font-size: 12px;
      line-height: 1.2;
      background: linear-gradient(to bottom, #0a0a1a 0%, #1a1a2e 100%);
      padding: 10px;
      position: relative;
      cursor: crosshair;
      user-select: none;
    `;
    this.container.appendChild(this.wrapper);

    // Canvas for connection lines
    this.canvas = document.createElement("canvas");
    this.canvas.className = "constellations-lines";
    this.canvas.style.cssText = `
      position: absolute;
      top: 10px;
      left: 10px;
      pointer-events: none;
    `;
    this.wrapper.appendChild(this.canvas);
    this.ctx = this.canvas.getContext("2d");

    // ASCII display
    this.display = document.createElement("pre");
    this.display.className = "constellations-display";
    this.display.style.cssText = `
      margin: 0;
      color: var(--text-primary, #fff);
      white-space: pre;
      position: relative;
      z-index: 1;
    `;
    this.wrapper.appendChild(this.display);

    // Controls
    this.controls = document.createElement("div");
    this.controls.style.cssText = `
      margin-top: 10px;
      display: flex;
      gap: 10px;
      justify-content: center;
    `;
    this.wrapper.appendChild(this.controls);

    this.createButton("[ CLEAR LINES ]", () => this.clearConnections());
    this.createButton("[ REGENERATE ]", () => this.generateStars());

    // Generate initial stars
    this.generateStars();

    // Event listeners
    this.wrapper.addEventListener("click", (e) => this.onClick(e));
    this.wrapper.addEventListener("mousemove", (e) => this.onMouseMove(e));

    // Resize canvas
    this.resizeCanvas();
    window.addEventListener("resize", () => this.resizeCanvas());

    // Start animation
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

  resizeCanvas() {
    const rect = this.display.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    this.charWidth = rect.width / this.cols;
    this.charHeight = rect.height / this.rows;
  }

  generateStars() {
    this.stars = [];
    this.connections = [];

    // Create stars with varying brightness
    for (let i = 0; i < this.starCount; i++) {
      this.stars.push({
        x: Math.floor(Math.random() * this.cols),
        y: Math.floor(Math.random() * this.rows),
        brightness: Math.random(),
        twinkleOffset: Math.random() * Math.PI * 2,
        size: Math.floor(Math.random() * this.starChars.length),
        layer: Math.floor(Math.random() * 3), // 0 = distant, 2 = close
      });
    }

    // Sort by layer for proper rendering
    this.stars.sort((a, b) => a.layer - b.layer);
  }

  onClick(e) {
    const star = this.getStarAt(e);
    if (star) {
      if (this.selectedStar && this.selectedStar !== star) {
        // Create connection
        this.connections.push({
          from: this.selectedStar,
          to: star,
        });
        this.selectedStar = null;
      } else {
        this.selectedStar = star;
      }
    } else {
      this.selectedStar = null;
    }
  }

  onMouseMove(e) {
    this.hoveredStar = this.getStarAt(e);
  }

  getStarAt(e) {
    const rect = this.display.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / this.charWidth);
    const y = Math.floor((e.clientY - rect.top) / this.charHeight);

    // Find star within tolerance
    const tolerance = 2;
    for (const star of this.stars) {
      if (
        Math.abs(star.x - x) <= tolerance &&
        Math.abs(star.y - y) <= tolerance
      ) {
        return star;
      }
    }
    return null;
  }

  clearConnections() {
    this.connections = [];
    this.selectedStar = null;
  }

  animate() {
    this.time += this.twinkleSpeed;
    this.render();
    this.renderConnections();
    this.animationFrame = requestAnimationFrame(() => this.animate());
  }

  render() {
    // Create empty grid
    const grid = [];
    for (let y = 0; y < this.rows; y++) {
      grid.push(new Array(this.cols).fill(" "));
    }

    // Place stars
    for (const star of this.stars) {
      // Calculate twinkle
      const twinkle = Math.sin(
        this.time * (1 + star.layer * 0.5) + star.twinkleOffset,
      );
      const brightness = star.brightness + twinkle * 0.3;

      // Select character based on brightness and size
      let charIdx = Math.floor(brightness * star.size);
      charIdx = Math.max(0, Math.min(this.starChars.length - 1, charIdx));

      // Highlight if selected or hovered
      let char = this.starChars[charIdx];
      if (star === this.selectedStar) {
        char = "◉";
      } else if (star === this.hoveredStar) {
        char = "○";
      }

      if (
        star.x >= 0 &&
        star.x < this.cols &&
        star.y >= 0 &&
        star.y < this.rows
      ) {
        grid[star.y][star.x] = char;
      }
    }

    // Convert to string
    let output = "";
    for (let y = 0; y < this.rows; y++) {
      output += grid[y].join("") + "\n";
    }

    this.display.textContent = output;
  }

  renderConnections() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.strokeStyle = "rgba(100, 150, 255, 0.6)";
    this.ctx.lineWidth = 1;

    for (const conn of this.connections) {
      const x1 = (conn.from.x + 0.5) * this.charWidth;
      const y1 = (conn.from.y + 0.5) * this.charHeight;
      const x2 = (conn.to.x + 0.5) * this.charWidth;
      const y2 = (conn.to.y + 0.5) * this.charHeight;

      this.ctx.beginPath();
      this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(x2, y2);
      this.ctx.stroke();
    }

    // Draw line from selected star to cursor
    if (
      this.selectedStar &&
      this.hoveredStar &&
      this.hoveredStar !== this.selectedStar
    ) {
      const x1 = (this.selectedStar.x + 0.5) * this.charWidth;
      const y1 = (this.selectedStar.y + 0.5) * this.charHeight;
      const x2 = (this.hoveredStar.x + 0.5) * this.charWidth;
      const y2 = (this.hoveredStar.y + 0.5) * this.charHeight;

      this.ctx.strokeStyle = "rgba(100, 150, 255, 0.3)";
      this.ctx.setLineDash([5, 5]);
      this.ctx.beginPath();
      this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(x2, y2);
      this.ctx.stroke();
      this.ctx.setLineDash([]);
    }
  }

  dispose() {
    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
    window.removeEventListener("resize", this.resizeCanvas);
    this.wrapper.remove();
  }
}

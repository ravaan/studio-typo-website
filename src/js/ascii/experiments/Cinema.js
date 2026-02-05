/**
 * ASCII Cinema
 * Real-time video to ASCII conversion
 */

import { brightnessToChar } from "../utils/ascii-density.js";

export class Cinema {
  constructor(container, options = {}) {
    this.container = container;
    this.cols = options.cols || 80;
    this.rows = options.rows || 30;
    this.fps = options.fps || 15;
    this.ramp = options.ramp || "full";
    this.colored = options.colored ?? true;

    this.canvas = null;
    this.ctx = null;
    this.animationFrame = null;
    this.lastFrameTime = 0;
    this.frameInterval = 1000 / this.fps;
    this.isPlaying = false;
    this.showOriginal = false;
    this.demoTime = 0;

    this.init();
  }

  init() {
    this.wrapper = document.createElement("div");
    this.wrapper.className = "cinema-wrapper";
    this.wrapper.style.cssText = `
      font-family: var(--font-mono, monospace);
      font-size: 8px;
      line-height: 1;
      background: var(--bg-primary, #000);
      padding: 10px;
      position: relative;
    `;
    this.container.appendChild(this.wrapper);

    this.canvas = document.createElement("canvas");
    this.canvas.width = 320;
    this.canvas.height = 240;
    this.ctx = this.canvas.getContext("2d");

    this.display = document.createElement("pre");
    this.display.className = "cinema-display";
    this.display.style.cssText = `
      margin: 0;
      color: var(--text-primary, #fff);
      white-space: pre;
    `;
    this.wrapper.appendChild(this.display);

    this.controls = document.createElement("div");
    this.controls.className = "cinema-controls";
    this.controls.style.cssText = `
      margin-top: 10px;
      display: flex;
      gap: 10px;
      justify-content: center;
    `;
    this.wrapper.appendChild(this.controls);

    this.playBtn = this.createButton("[ PLAY ]", () => this.togglePlay());
    this.colorBtn = this.createButton("[ COLOR ]", () => this.toggleColor());

    this.isPlaying = true;
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

  togglePlay() {
    if (this.isPlaying) {
      this.isPlaying = false;
      this.playBtn.textContent = "[ PLAY ]";
      if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
    } else {
      this.isPlaying = true;
      this.playBtn.textContent = "[ PAUSE ]";
      this.animate();
    }
  }

  toggleColor() {
    this.colored = !this.colored;
    this.colorBtn.textContent = this.colored ? "[ COLOR ]" : "[ B&W ]";
  }

  animate(timestamp = 0) {
    if (!this.isPlaying) return;

    if (timestamp - this.lastFrameTime < this.frameInterval) {
      this.animationFrame = requestAnimationFrame((t) => this.animate(t));
      return;
    }
    this.lastFrameTime = timestamp;

    this.renderDemo();
    this.animationFrame = requestAnimationFrame((t) => this.animate(t));
  }

  renderDemo() {
    this.demoTime += 0.05;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const imageData = this.ctx.createImageData(w, h);
    const data = imageData.data;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        const cx = x - w / 2;
        const cy = y - h / 2;
        const dist = Math.sqrt(cx * cx + cy * cy);
        const angle = Math.atan2(cy, cx);

        const wave1 = Math.sin(dist * 0.05 - this.demoTime * 2);
        const wave2 = Math.sin(angle * 5 + this.demoTime);
        const wave3 = Math.sin(x * 0.03 + y * 0.02 + this.demoTime);
        const value = (wave1 + wave2 + wave3) / 3;
        const brightness = Math.floor((value + 1) * 127.5);

        data[idx] = brightness + Math.sin(this.demoTime) * 50;
        data[idx + 1] = brightness + Math.sin(this.demoTime + 2) * 50;
        data[idx + 2] = brightness + Math.sin(this.demoTime + 4) * 50;
        data[idx + 3] = 255;
      }
    }

    this.ctx.putImageData(imageData, 0, 0);
    this.renderFromCanvas();
  }

  renderFromCanvas() {
    const cellWidth = this.canvas.width / this.cols;
    const cellHeight = this.canvas.height / this.rows;
    let output = "";

    for (let y = 0; y < this.rows; y++) {
      let row = "";
      for (let x = 0; x < this.cols; x++) {
        const px = Math.floor(x * cellWidth + cellWidth / 2);
        const py = Math.floor(y * cellHeight + cellHeight / 2);
        const pixel = this.ctx.getImageData(px, py, 1, 1).data;
        const brightness =
          0.299 * pixel[0] + 0.587 * pixel[1] + 0.114 * pixel[2];
        const char = brightnessToChar(brightness, this.ramp);

        if (this.colored && brightness > 10) {
          row += `<span style="color: rgb(${pixel[0]},${pixel[1]},${pixel[2]})">${char}</span>`;
        } else {
          row += char;
        }
      }
      output += row + "\n";
    }

    if (this.colored) {
      this.display.innerHTML = output;
    } else {
      this.display.textContent = output;
    }
  }

  dispose() {
    this.isPlaying = false;
    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
    this.wrapper.remove();
  }
}

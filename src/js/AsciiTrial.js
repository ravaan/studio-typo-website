/**
 * ASCII Trial Controller
 * Manages image upload, ASCII conversion, and effect application
 */

import { loadImage, sampleCanvas } from "./ascii/utils/brightness.js";
import { brightnessToChar } from "./ascii/utils/ascii-density.js";
import { initAsciiArt } from "./ascii/index.js";

export class AsciiTrial {
  constructor() {
    // DOM elements
    this.uploadZone = document.getElementById("trial-upload");
    this.fileInput = document.getElementById("trial-file-input");
    this.previewImg = document.getElementById("trial-preview-img");
    this.uploadPrompt = document.getElementById("upload-prompt");
    this.previewContainer = document.getElementById("trial-preview");
    this.effectButtons = document.getElementById("trial-effects");
    this.colsInput = document.getElementById("trial-cols");
    this.colsValue = document.getElementById("trial-cols-value");
    this.rampSelect = document.getElementById("trial-ramp");

    // State
    this.imageCanvas = null;
    this.currentEffect = null;
    this.currentEffectName = "matrix";
    this.cols = 80;
    this.ramp = "full";

    this.init();
  }

  init() {
    this.setupUpload();
    this.setupEffectSelector();
    this.setupSettings();
  }

  setupUpload() {
    // Click to upload
    this.uploadZone.addEventListener("click", () => {
      this.fileInput.click();
    });

    // File selected
    this.fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        this.handleFile(file);
      }
    });

    // Drag and drop
    this.uploadZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      this.uploadZone.classList.add("dragover");
    });

    this.uploadZone.addEventListener("dragleave", () => {
      this.uploadZone.classList.remove("dragover");
    });

    this.uploadZone.addEventListener("drop", (e) => {
      e.preventDefault();
      this.uploadZone.classList.remove("dragover");

      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) {
        this.handleFile(file);
      }
    });
  }

  setupEffectSelector() {
    const buttons = this.effectButtons.querySelectorAll("button");

    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        // Update active state
        buttons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        // Apply effect
        this.currentEffectName = btn.dataset.effect;
        if (this.imageCanvas) {
          this.applyEffect();
        }
      });
    });
  }

  setupSettings() {
    // Columns slider
    this.colsInput.addEventListener("input", () => {
      this.cols = parseInt(this.colsInput.value, 10);
      this.colsValue.textContent = this.cols;

      if (this.imageCanvas) {
        this.applyEffect();
      }
    });

    // Ramp selector
    this.rampSelect.addEventListener("change", () => {
      this.ramp = this.rampSelect.value;

      if (this.imageCanvas) {
        this.applyEffect();
      }
    });
  }

  async handleFile(file) {
    try {
      // Create object URL for preview
      const url = URL.createObjectURL(file);

      // Show preview image
      this.previewImg.src = url;
      this.previewImg.classList.remove("hidden");
      this.uploadPrompt.style.display = "none";

      // Load to canvas
      this.imageCanvas = await loadImage(url);

      // Apply effect
      this.applyEffect();

      // Cleanup URL
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to load image:", err);
    }
  }

  generateAscii() {
    if (!this.imageCanvas) return null;

    // Calculate rows based on aspect ratio
    // Characters are roughly 2x taller than wide
    const aspectRatio = this.imageCanvas.height / this.imageCanvas.width;
    const rows = Math.round(this.cols * aspectRatio * 0.5);

    // Sample brightness
    const brightness = sampleCanvas(this.imageCanvas, this.cols, rows);

    // Convert to ASCII string
    let ascii = "";
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const char = brightnessToChar(brightness[y][x], this.ramp);
        ascii += char;
      }
      if (y < rows - 1) {
        ascii += "\n";
      }
    }

    return ascii;
  }

  applyEffect() {
    // Generate ASCII from image
    const ascii = this.generateAscii();
    if (!ascii) return;

    // Clear previous effect
    if (this.currentEffect && this.currentEffect.dispose) {
      this.currentEffect.dispose();
    }
    this.previewContainer.innerHTML = "";

    // Create container for effect
    const container = document.createElement("div");
    container.className = "ascii-art-container";
    this.previewContainer.appendChild(container);

    // Apply the selected effect
    this.currentEffect = initAsciiArt(container, ascii, this.currentEffectName);
  }

  dispose() {
    if (this.currentEffect && this.currentEffect.dispose) {
      this.currentEffect.dispose();
    }
  }
}

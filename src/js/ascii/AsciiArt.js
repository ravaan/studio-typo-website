/**
 * AsciiArt - Base class for ASCII art animations
 */

export class AsciiArt {
  constructor(container, asciiString) {
    this.container = container;
    this.asciiString = asciiString;
    this.lines = asciiString.split("\n");
    this.rows = this.lines.length;
    this.cols = Math.max(...this.lines.map((l) => l.length));
    this.elements = [];
    this.isHovered = false;
    this.animationFrame = null;

    this.init();
  }

  /**
   * Initialize the ASCII art
   */
  init() {
    this.createGrid();
    this.setupEvents();
  }

  /**
   * Create grid of span elements for each character
   */
  createGrid() {
    this.container.innerHTML = "";

    const pre = document.createElement("pre");
    pre.className = "ascii-pre";

    for (let row = 0; row < this.rows; row++) {
      const line = this.lines[row] || "";
      const rowElements = [];

      for (let col = 0; col < this.cols; col++) {
        const char = line[col] || " ";
        const span = document.createElement("span");
        span.className = "ascii-char";
        span.textContent = char;
        span.dataset.row = row;
        span.dataset.col = col;
        span.dataset.char = char;
        pre.appendChild(span);
        rowElements.push(span);
      }

      // Add newline
      pre.appendChild(document.createTextNode("\n"));
      this.elements.push(rowElements);
    }

    this.container.appendChild(pre);
  }

  /**
   * Set up hover events
   */
  setupEvents() {
    this.container.addEventListener("mouseenter", () => {
      this.isHovered = true;
      this.onHover();
    });

    this.container.addEventListener("mouseleave", () => {
      this.isHovered = false;
      this.onLeave();
    });
  }

  /**
   * Get character at position
   */
  getChar(row, col) {
    const line = this.lines[row] || "";
    return line[col] || " ";
  }

  /**
   * Set character display
   */
  setChar(row, col, char) {
    if (this.elements[row] && this.elements[row][col]) {
      this.elements[row][col].textContent = char;
    }
  }

  /**
   * Get element at position
   */
  getElement(row, col) {
    return this.elements[row]?.[col];
  }

  /**
   * Override in subclass - called on hover
   */
  onHover() {}

  /**
   * Override in subclass - called on leave
   */
  onLeave() {}

  /**
   * Clean up
   */
  dispose() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  }
}

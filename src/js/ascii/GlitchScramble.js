/**
 * GlitchScramble - Characters glitch wildly, then stabilize on hover
 */

import { AsciiArt } from "./AsciiArt.js";

const GLITCH_CHARS = "!@#$%^&*()_+-=[]{}|;:',.<>?/~`░▒▓█▄▀■□▪▫";

export class GlitchScramble extends AsciiArt {
  constructor(container, asciiString) {
    super(container, asciiString);
    this.charStates = [];
    this.glitchInterval = null;
    this.initGlitch();
  }

  initGlitch() {
    // Initialize char states and start glitching
    for (let row = 0; row < this.rows; row++) {
      this.charStates[row] = [];
      for (let col = 0; col < this.cols; col++) {
        this.charStates[row][col] = {
          locked: false,
          glitchSpeed: 50 + Math.random() * 100,
          lastGlitch: 0,
        };
      }
    }

    // Start continuous glitching
    this.startGlitching();
  }

  startGlitching() {
    const glitch = () => {
      const now = performance.now();

      for (let row = 0; row < this.rows; row++) {
        for (let col = 0; col < this.cols; col++) {
          const state = this.charStates[row][col];
          const originalChar = this.getChar(row, col);

          if (originalChar === " ") continue;

          if (state.locked) {
            // Occasionally re-glitch even locked chars for effect
            if (!this.isHovered && Math.random() < 0.01) {
              const glitchChar =
                GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
              this.setChar(row, col, glitchChar);
              this.getElement(row, col)?.classList.add("glitch-flash");
              setTimeout(() => {
                this.setChar(row, col, originalChar);
                this.getElement(row, col)?.classList.remove("glitch-flash");
              }, 50);
            }
            continue;
          }

          if (now - state.lastGlitch > state.glitchSpeed) {
            const glitchChar =
              GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
            this.setChar(row, col, glitchChar);
            this.getElement(row, col)?.classList.add("glitching");
            state.lastGlitch = now;
          }
        }
      }

      this.animationFrame = requestAnimationFrame(glitch);
    };

    this.animationFrame = requestAnimationFrame(glitch);
  }

  onHover() {
    // Lock in characters with staggered timing
    const lockOrder = [];

    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        if (this.getChar(row, col) !== " ") {
          lockOrder.push({ row, col });
        }
      }
    }

    // Shuffle for random lock-in order
    for (let i = lockOrder.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [lockOrder[i], lockOrder[j]] = [lockOrder[j], lockOrder[i]];
    }

    // Lock in with stagger
    lockOrder.forEach((pos, index) => {
      setTimeout(
        () => {
          if (!this.isHovered) return;

          const { row, col } = pos;
          const state = this.charStates[row][col];
          const element = this.getElement(row, col);

          state.locked = true;
          this.setChar(row, col, this.getChar(row, col));
          element?.classList.remove("glitching");
          element?.classList.add("locked");
        },
        index * 15 + Math.random() * 30,
      );
    });
  }

  onLeave() {
    // Unlock all after delay
    setTimeout(() => {
      if (!this.isHovered) {
        for (let row = 0; row < this.rows; row++) {
          for (let col = 0; col < this.cols; col++) {
            this.charStates[row][col].locked = false;
            this.getElement(row, col)?.classList.remove("locked");
          }
        }
      }
    }, 300);
  }
}

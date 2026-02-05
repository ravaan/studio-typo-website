/**
 * Trial Page Entry Point
 */

import { AsciiTrial } from "./AsciiTrial.js";

// Initialize trial when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  const trial = new AsciiTrial();
  window.asciiTrial = trial; // Expose for debugging
});

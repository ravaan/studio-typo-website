/**
 * SoundToggle - Audio on/off controller
 */

import { setSoundEnabled } from "../utils/storage.js";

export class SoundToggle {
  constructor(buttonElement, initialState = true, onChange = null) {
    this.button = buttonElement;
    this.enabled = initialState;
    this.onChange = onChange;

    this.init();
  }

  /**
   * Initialize the toggle
   */
  init() {
    // Set initial state
    this.updateButton();

    // Click handler
    this.button.addEventListener("click", () => {
      this.toggle();
    });
  }

  /**
   * Toggle sound on/off
   */
  toggle() {
    this.setEnabled(!this.enabled);
  }

  /**
   * Set sound enabled state
   */
  setEnabled(enabled) {
    this.enabled = enabled;

    // Persist
    setSoundEnabled(enabled);

    // Update button
    this.updateButton();

    // Callback
    this.onChange?.(enabled);
  }

  /**
   * Update button state
   */
  updateButton() {
    this.button.setAttribute("aria-pressed", String(this.enabled));
    this.button.setAttribute(
      "title",
      this.enabled ? "Mute sounds" : "Unmute sounds",
    );
  }

  /**
   * Get current state
   */
  isEnabled() {
    return this.enabled;
  }
}

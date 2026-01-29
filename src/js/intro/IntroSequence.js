/**
 * IntroSequence - Orchestrates the intro animation
 * STUDIO keys fade in place, then all keys slide right
 */

import { CONFIG } from "../../config.js";
import { wait } from "../utils/helpers.js";

export class IntroSequence {
  constructor(app) {
    this.app = app;
    this.isPlaying = false;
  }

  /**
   * Play the intro sequence
   * @param {string} triggeredKey - The key that triggered the intro
   */
  async play(triggeredKey) {
    if (this.isPlaying) return;
    this.isPlaying = true;

    const { steps } = CONFIG.intro;

    try {
      // 0.0s - Initialize audio and start typing loop
      await this.app.audioManager.init();
      this.app.audioManager.startTypingLoop();

      // 0.2s - Press the triggered key (TYPO key only)
      await wait(steps.keyPress);
      const key = this.app.keyboardLayout.getTypoKey(triggeredKey);
      if (key) {
        key.press();
        this.app.audioManager.playKeyPress();
      }

      // 0.4s - Release key
      await wait(steps.keyRelease - steps.keyPress);
      if (key) {
        key.release();
      }

      // 0.6s - STUDIO keys fade in place (staggered, left to right)
      await wait(steps.studioRevealStart - steps.keyRelease);

      const studioLetters = ["S", "T", "U", "D", "I", "O"];
      for (const letter of studioLetters) {
        const studioKey = this.app.keyboardLayout.getStudioKey(letter);
        if (studioKey) {
          studioKey.reveal(); // Non-blocking reveal
          this.app.audioManager.playKeyPress();
        }
        await wait(CONFIG.timing.studioRevealStagger);
      }

      // Calculate remaining time before slide
      const revealDuration =
        studioLetters.length * CONFIG.timing.studioRevealStagger;
      const waitBeforeSlide =
        steps.slideStart - steps.studioRevealStart - revealDuration;
      if (waitBeforeSlide > 0) {
        await wait(waitBeforeSlide);
      }

      // 1.5s - Slide entire arrangement right (keys move, camera static)
      this.app.keyboardLayout.slideRight(
        CONFIG.layout.slideDistance,
        CONFIG.timing.slideRightDuration,
      );

      // 2.3s - Navigation fades in
      await wait(steps.navReveal - steps.slideStart);
      this.app.navigation.show();

      // Stop typing loop
      this.app.audioManager.stopTypingLoop();

      // Wait for slide to complete
      const remainingTime = CONFIG.intro.totalDuration - steps.navReveal;
      if (remainingTime > 0) {
        await wait(remainingTime);
      }

      this.isPlaying = false;
      this.app.onIntroComplete();
    } catch (error) {
      console.error("Intro sequence error:", error);
      this.isPlaying = false;
      // Force transition to main state on error
      this.app.onIntroComplete();
    }
  }

  /**
   * Skip the intro (for accessibility or testing)
   */
  skip() {
    if (!this.isPlaying) return;

    this.isPlaying = false;

    // Immediately show all keys
    const studioLetters = ["S", "T", "U", "D", "I", "O"];
    for (const letter of studioLetters) {
      const key = this.app.keyboardLayout.getStudioKey(letter);
      if (key) {
        key.isVisible = true;
        key.group.visible = true;
        key.group.scale.setScalar(1);
        key.mesh.material.opacity = 1;
      }
    }

    // Move keys to final position
    this.app.keyboardLayout.group.position.x = CONFIG.layout.slideDistance;

    // Show UI
    this.app.navigation.show();
    this.app.audioManager.stopTypingLoop();
    this.app.onIntroComplete();
  }
}

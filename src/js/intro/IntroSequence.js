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
    this.letterRotationAborted = false;
  }

  /**
   * Play the intro sequence
   * @param {string} triggeredKey - The key that triggered the intro
   */
  async play(triggeredKey) {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.letterRotationAborted = false;

    // Start CARE -> O letter rotation (fire-and-forget, runs in parallel)
    const oKey = this.app.keyboardLayout.getTypoKey("O");
    if (oKey) {
      this.playLetterRotation(oKey);
    }

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
   * Play CARE letter rotation on a key
   * Spells C-A-R-E before settling on O (brand messaging)
   * @param {KeyModel} keyModel - The key to animate
   */
  async playLetterRotation(keyModel) {
    const letters = ["C", "A", "R", "E", "O"];
    const intervalMs = 100; // 100ms per letter for readability

    for (const letter of letters) {
      if (this.letterRotationAborted) break;
      keyModel.setLetter(letter);
      await wait(intervalMs);
    }
  }

  /**
   * Skip the intro (for accessibility or testing)
   */
  async skip() {
    this.isPlaying = false;
    this.letterRotationAborted = true;

    // Ensure O key displays "O" (in case rotation was mid-cycle)
    const oKey = this.app.keyboardLayout.getTypoKey("O");
    if (oKey) {
      oKey.setLetter("O");
    }

    // Initialize audio (needed for key press sounds later)
    await this.app.audioManager.init();

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
    this.app.onIntroComplete();
  }
}

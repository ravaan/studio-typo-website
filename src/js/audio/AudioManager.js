/**
 * AudioManager - Web Audio API sound system with Topre/Membrane sounds
 */

import { CONFIG } from "../../config.js";

export class AudioManager {
  constructor() {
    this.context = null;
    this.masterGain = null;
    this.typingLoopSource = null;
    this.typingLoopBuffer = null;
    this.keyPressBuffer = null;
    this.enabled = true;
    this.initialized = false;
    this.typingLoopTimeout = null;
  }

  /**
   * Initialize the audio context
   */
  async init() {
    if (this.initialized) return;

    try {
      this.context = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.context.createGain();
      this.masterGain.connect(this.context.destination);
      this.masterGain.gain.value = CONFIG.audio.masterVolume;

      // Resume context (required after user interaction)
      if (this.context.state === "suspended") {
        await this.context.resume();
      }

      this.initialized = true;

      // Try to load audio files (will fall back to synthetic if not found)
      await this.loadSounds();
    } catch (error) {
      console.error("Failed to initialize audio:", error);
      this.enabled = false;
    }
  }

  /**
   * Load audio files (optional, falls back to synthetic)
   */
  async loadSounds() {
    try {
      const [loopBuffer, pressBuffer] = await Promise.all([
        this.loadSound("/assets/audio/typing-loop.mp3"),
        this.loadSound("/assets/audio/key-press.mp3"),
      ]);

      this.typingLoopBuffer = loopBuffer;
      this.keyPressBuffer = pressBuffer;
    } catch (error) {
      // Using synthetic sounds as fallback - this is expected
      console.info("Using synthetic audio sounds");
    }
  }

  /**
   * Load a single sound file
   */
  async loadSound(url) {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return await this.context.decodeAudioData(arrayBuffer);
    } catch (error) {
      // Silent fail - will use synthetic sounds
      return null;
    }
  }

  /**
   * Start background typing loop
   */
  startTypingLoop() {
    if (!this.enabled || !this.initialized) return;

    if (this.typingLoopBuffer) {
      // Use loaded audio file
      this.typingLoopSource = this.context.createBufferSource();
      this.typingLoopSource.buffer = this.typingLoopBuffer;
      this.typingLoopSource.loop = true;

      const loopGain = this.context.createGain();
      loopGain.gain.setValueAtTime(0, this.context.currentTime);
      loopGain.gain.linearRampToValueAtTime(
        CONFIG.audio.loopVolume,
        this.context.currentTime + CONFIG.audio.fadeInDuration / 1000,
      );

      this.typingLoopSource.connect(loopGain);
      loopGain.connect(this.masterGain);
      this.typingLoopSource.start();
    } else {
      // Use synthetic typing loop
      this.startSyntheticTypingLoop();
    }
  }

  /**
   * Stop typing loop
   */
  stopTypingLoop() {
    if (this.typingLoopSource) {
      try {
        this.typingLoopSource.stop();
        this.typingLoopSource.disconnect();
      } catch (e) {
        // Source may already be stopped
      }
      this.typingLoopSource = null;
    }

    if (this.typingLoopTimeout) {
      clearTimeout(this.typingLoopTimeout);
      this.typingLoopTimeout = null;
    }
  }

  /**
   * Play key press sound
   */
  playKeyPress() {
    if (!this.enabled || !this.initialized) return;

    if (this.keyPressBuffer) {
      this.playBuffer(this.keyPressBuffer);
    } else {
      this.createSyntheticTopreSound();
    }
  }

  /**
   * Play audio buffer with slight variation
   */
  playBuffer(buffer) {
    const source = this.context.createBufferSource();
    source.buffer = buffer;

    // Slight pitch variation for realism
    source.playbackRate.value = 0.95 + Math.random() * 0.1;

    const pressGain = this.context.createGain();
    pressGain.gain.value = CONFIG.audio.keyPressVolume;

    source.connect(pressGain);
    pressGain.connect(this.masterGain);
    source.start();

    // Auto cleanup
    source.onended = () => {
      source.disconnect();
      pressGain.disconnect();
    };
  }

  /**
   * Create synthetic Topre/Membrane sound
   * Thocky, deeper, muted character
   */
  createSyntheticTopreSound() {
    if (!this.context) return;

    // === Layer 1: Deep thock ===
    const osc1 = this.context.createOscillator();
    const gain1 = this.context.createGain();
    const filter = this.context.createBiquadFilter();

    osc1.type = "sine";
    osc1.frequency.setValueAtTime(
      150 + Math.random() * 30,
      this.context.currentTime,
    );
    osc1.frequency.exponentialRampToValueAtTime(
      60,
      this.context.currentTime + 0.08,
    );

    // Low-pass filter for muted sound
    filter.type = "lowpass";
    filter.frequency.value = 800;
    filter.Q.value = 1;

    // Quick attack, medium decay (thock)
    gain1.gain.setValueAtTime(0, this.context.currentTime);
    gain1.gain.linearRampToValueAtTime(0.35, this.context.currentTime + 0.005);
    gain1.gain.exponentialRampToValueAtTime(
      0.01,
      this.context.currentTime + 0.15,
    );

    osc1.connect(filter);
    filter.connect(gain1);
    gain1.connect(this.masterGain);

    osc1.start();
    osc1.stop(this.context.currentTime + 0.15);

    // === Layer 2: Subtle click ===
    const osc2 = this.context.createOscillator();
    const gain2 = this.context.createGain();

    osc2.type = "square";
    osc2.frequency.setValueAtTime(2000, this.context.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(
      500,
      this.context.currentTime + 0.02,
    );

    gain2.gain.setValueAtTime(0.04, this.context.currentTime);
    gain2.gain.exponentialRampToValueAtTime(
      0.001,
      this.context.currentTime + 0.03,
    );

    osc2.connect(gain2);
    gain2.connect(this.masterGain);

    osc2.start();
    osc2.stop(this.context.currentTime + 0.03);

    // === Layer 3: Subtle rubber dome sound ===
    const noise = this.createNoiseBuffer(0.05);
    const noiseSource = this.context.createBufferSource();
    const noiseGain = this.context.createGain();
    const noiseFilter = this.context.createBiquadFilter();

    noiseSource.buffer = noise;

    noiseFilter.type = "bandpass";
    noiseFilter.frequency.value = 500;
    noiseFilter.Q.value = 2;

    noiseGain.gain.setValueAtTime(0.02, this.context.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(
      0.001,
      this.context.currentTime + 0.05,
    );

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    noiseSource.start();
    noiseSource.stop(this.context.currentTime + 0.05);
  }

  /**
   * Create noise buffer for sound texturing
   */
  createNoiseBuffer(duration) {
    const sampleRate = this.context.sampleRate;
    const length = sampleRate * duration;
    const buffer = this.context.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    return buffer;
  }

  /**
   * Start synthetic typing loop
   */
  startSyntheticTypingLoop() {
    const scheduleNextKey = () => {
      if (!this.enabled) {
        this.typingLoopTimeout = null;
        return;
      }

      this.createSyntheticTopreSound();

      // Random interval for natural typing rhythm
      const nextDelay = 100 + Math.random() * 150;
      this.typingLoopTimeout = setTimeout(scheduleNextKey, nextDelay);
    };

    // Start with slight delay
    this.typingLoopTimeout = setTimeout(scheduleNextKey, 500);
  }

  /**
   * Enable or disable sound
   */
  setEnabled(enabled) {
    this.enabled = enabled;

    // Fade instead of abrupt cut
    if (this.masterGain && this.context) {
      this.masterGain.gain.linearRampToValueAtTime(
        enabled ? CONFIG.audio.masterVolume : 0,
        this.context.currentTime + CONFIG.audio.fadeOutDuration / 1000,
      );
    }

    // Stop typing loop when disabled
    if (!enabled) {
      this.stopTypingLoop();
    }

    // Persist preference
    localStorage.setItem(CONFIG.sound.storageKey, String(enabled));
  }

  /**
   * Toggle sound on/off
   */
  toggle() {
    this.setEnabled(!this.enabled);
    return this.enabled;
  }

  /**
   * Clean up resources
   */
  dispose() {
    this.stopTypingLoop();
    if (this.context) {
      this.context.close();
    }
  }
}

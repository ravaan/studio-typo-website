/**
 * Keyboard Input Utilities
 */

// Valid keys for TYPO sequence
const TYPO_KEYS = ["T", "Y", "P", "O"];
const STUDIO_KEYS = ["S", "T", "U", "D", "I", "O"];
const ALL_VALID_KEYS = [...new Set([...TYPO_KEYS, ...STUDIO_KEYS])];

/**
 * Check if a key is part of the TYPO sequence
 * @param {string} key - Key to check
 * @returns {boolean} True if valid TYPO key
 */
export function isTypoKey(key) {
  return TYPO_KEYS.includes(key.toUpperCase());
}

/**
 * Check if a key is part of STUDIO
 * @param {string} key - Key to check
 * @returns {boolean} True if valid STUDIO key
 */
export function isStudioKey(key) {
  return STUDIO_KEYS.includes(key.toUpperCase());
}

/**
 * Check if a key is any valid key for the keyboard
 * @param {string} key - Key to check
 * @returns {boolean} True if valid key
 */
export function isValidKey(key) {
  return ALL_VALID_KEYS.includes(key.toUpperCase());
}

/**
 * Normalize key from event to uppercase letter
 * @param {KeyboardEvent} event - Keyboard event
 * @returns {string|null} Uppercase key or null if invalid
 */
export function normalizeKey(event) {
  // Ignore if modifier keys are pressed
  if (event.ctrlKey || event.altKey || event.metaKey) {
    return null;
  }

  const key = event.key.toUpperCase();

  // Only accept single letters
  if (key.length !== 1 || !/^[A-Z]$/.test(key)) {
    return null;
  }

  return key;
}

/**
 * Get key code from event (for older browser support)
 * @param {KeyboardEvent} event - Keyboard event
 * @returns {string} Key character
 */
export function getKeyChar(event) {
  // Modern browsers
  if (event.key) {
    return event.key.toUpperCase();
  }

  // Fallback for older browsers
  return String.fromCharCode(event.keyCode || event.which).toUpperCase();
}

/**
 * Create a keyboard event handler with key tracking
 * @param {Object} options - Handler options
 * @param {Function} options.onKeyDown - Called on key down
 * @param {Function} options.onKeyUp - Called on key up
 * @param {Function} options.onValidKey - Called for valid TYPO/STUDIO keys
 * @returns {{attach: Function, detach: Function}} Handler methods
 */
export function createKeyboardHandler(options = {}) {
  const { onKeyDown, onKeyUp, onValidKey } = options;
  const pressedKeys = new Set();

  function handleKeyDown(event) {
    const key = normalizeKey(event);
    if (!key) return;

    // Prevent repeat events
    if (pressedKeys.has(key)) return;
    pressedKeys.add(key);

    onKeyDown?.(key, event);

    if (isValidKey(key)) {
      onValidKey?.(key, "keydown", event);
    }
  }

  function handleKeyUp(event) {
    const key = normalizeKey(event);
    if (!key) return;

    pressedKeys.delete(key);
    onKeyUp?.(key, event);
  }

  // Clear pressed keys when window loses focus
  function handleBlur() {
    pressedKeys.clear();
  }

  return {
    attach() {
      window.addEventListener("keydown", handleKeyDown);
      window.addEventListener("keyup", handleKeyUp);
      window.addEventListener("blur", handleBlur);
    },
    detach() {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);
      pressedKeys.clear();
    },
    isKeyPressed(key) {
      return pressedKeys.has(key.toUpperCase());
    },
    getPressedKeys() {
      return [...pressedKeys];
    },
  };
}

/**
 * Track TYPO sequence input
 * @param {Function} onComplete - Called when TYPO is typed
 * @param {number} timeout - Reset timeout in ms (default: 2000)
 * @returns {{track: Function, reset: Function}} Tracker methods
 */
export function createTypoTracker(onComplete, timeout = 2000) {
  const sequence = ["T", "Y", "P", "O"];
  let currentIndex = 0;
  let timeoutId = null;

  function reset() {
    currentIndex = 0;
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  }

  function track(key) {
    const upperKey = key.toUpperCase();

    // Reset timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Check if key matches expected
    if (upperKey === sequence[currentIndex]) {
      currentIndex++;

      // Complete sequence
      if (currentIndex === sequence.length) {
        reset();
        onComplete();
        return true;
      }

      // Set reset timeout
      timeoutId = setTimeout(reset, timeout);
    } else {
      // Wrong key, reset
      reset();
    }

    return false;
  }

  return {
    track,
    reset,
    getProgress() {
      return currentIndex;
    },
    getExpected() {
      return sequence[currentIndex] || null;
    },
  };
}

// Export key constants
export { TYPO_KEYS, STUDIO_KEYS, ALL_VALID_KEYS };

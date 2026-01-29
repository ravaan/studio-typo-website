/**
 * Storage Utilities - Safe localStorage wrapper
 */

const PREFIX = "studio-typo-";

/**
 * Safely get item from localStorage
 * @param {string} key - Storage key
 * @param {*} defaultValue - Default value if key doesn't exist
 * @returns {*} Stored value or default
 */
export function getItem(key, defaultValue = null) {
  try {
    const item = localStorage.getItem(PREFIX + key);
    if (item === null) return defaultValue;
    return JSON.parse(item);
  } catch (error) {
    console.warn(`Failed to get storage item "${key}":`, error);
    return defaultValue;
  }
}

/**
 * Safely set item in localStorage
 * @param {string} key - Storage key
 * @param {*} value - Value to store
 * @returns {boolean} Success status
 */
export function setItem(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn(`Failed to set storage item "${key}":`, error);
    return false;
  }
}

/**
 * Safely remove item from localStorage
 * @param {string} key - Storage key
 * @returns {boolean} Success status
 */
export function removeItem(key) {
  try {
    localStorage.removeItem(PREFIX + key);
    return true;
  } catch (error) {
    console.warn(`Failed to remove storage item "${key}":`, error);
    return false;
  }
}

/**
 * Check if localStorage is available
 * @returns {boolean} True if localStorage is available
 */
export function isStorageAvailable() {
  try {
    const testKey = PREFIX + "test";
    localStorage.setItem(testKey, "test");
    localStorage.removeItem(testKey);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get theme preference
 * @param {string} defaultTheme - Default theme if not set
 * @returns {string} Theme name ('dark' or 'light')
 */
export function getTheme(defaultTheme = "dark") {
  // Check localStorage first
  const stored = getItem("theme");
  if (stored) return stored;

  // Check system preference
  if (window.matchMedia?.("(prefers-color-scheme: light)").matches) {
    return "light";
  }

  return defaultTheme;
}

/**
 * Set theme preference
 * @param {string} theme - Theme name
 */
export function setTheme(theme) {
  setItem("theme", theme);
}

/**
 * Get sound preference
 * @param {boolean} defaultValue - Default sound state
 * @returns {boolean} Sound enabled state
 */
export function getSoundEnabled(defaultValue = true) {
  return getItem("sound", defaultValue);
}

/**
 * Set sound preference
 * @param {boolean} enabled - Sound enabled state
 */
export function setSoundEnabled(enabled) {
  setItem("sound", enabled);
}

/**
 * Check if user has completed intro
 * @returns {boolean} True if intro has been completed
 */
export function hasCompletedIntro() {
  return getItem("intro-completed", false);
}

/**
 * Mark intro as completed
 */
export function markIntroCompleted() {
  setItem("intro-completed", true);
}

/**
 * Get all stored preferences
 * @returns {Object} All preferences
 */
export function getAllPreferences() {
  return {
    theme: getTheme(),
    sound: getSoundEnabled(),
    introCompleted: hasCompletedIntro(),
  };
}

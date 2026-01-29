/**
 * Device Detection Utilities
 */

/**
 * Check if device is mobile
 * @returns {boolean} True if mobile device
 */
export function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );
}

/**
 * Check if device is touch-capable
 * @returns {boolean} True if touch device
 */
export function isTouchDevice() {
  return (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0
  );
}

/**
 * Check if device is iOS
 * @returns {boolean} True if iOS device
 */
export function isIOS() {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

/**
 * Check if device is Android
 * @returns {boolean} True if Android device
 */
export function isAndroid() {
  return /Android/i.test(navigator.userAgent);
}

/**
 * Check if browser is Safari
 * @returns {boolean} True if Safari browser
 */
export function isSafari() {
  return (
    /^((?!chrome|android).)*safari/i.test(navigator.userAgent) ||
    (navigator.vendor?.includes("Apple") &&
      !navigator.userAgent.includes("CriOS"))
  );
}

/**
 * Check if browser supports WebGL
 * @returns {boolean} True if WebGL is supported
 */
export function supportsWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch (e) {
    return false;
  }
}

/**
 * Check if browser supports WebGL2
 * @returns {boolean} True if WebGL2 is supported
 */
export function supportsWebGL2() {
  try {
    const canvas = document.createElement("canvas");
    return !!(window.WebGL2RenderingContext && canvas.getContext("webgl2"));
  } catch (e) {
    return false;
  }
}

/**
 * Get WebGL capabilities
 * @returns {Object} WebGL capabilities
 */
export function getWebGLCapabilities() {
  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");

  if (!gl) {
    return { supported: false };
  }

  const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");

  return {
    supported: true,
    version: gl.getParameter(gl.VERSION),
    vendor: debugInfo
      ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)
      : "Unknown",
    renderer: debugInfo
      ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
      : "Unknown",
    maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
    maxVertexAttributes: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
    maxTextureUnits: gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS),
    isWebGL2: !!canvas.getContext("webgl2"),
  };
}

/**
 * Check if Web Audio API is supported
 * @returns {boolean} True if Web Audio is supported
 */
export function supportsWebAudio() {
  return !!(window.AudioContext || window.webkitAudioContext);
}

/**
 * Get device pixel ratio (capped for performance)
 * @param {number} max - Maximum pixel ratio (default: 2)
 * @returns {number} Device pixel ratio
 */
export function getPixelRatio(max = 2) {
  return Math.min(window.devicePixelRatio || 1, max);
}

/**
 * Check if user prefers reduced motion
 * @returns {boolean} True if reduced motion is preferred
 */
export function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Check if user prefers dark color scheme
 * @returns {boolean} True if dark mode is preferred
 */
export function prefersDarkMode() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/**
 * Get viewport dimensions
 * @returns {{width: number, height: number}} Viewport dimensions
 */
export function getViewport() {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

/**
 * Check if device has high performance GPU
 * Based on renderer string heuristics
 * @returns {boolean} True if likely high performance
 */
export function isHighPerformanceGPU() {
  const capabilities = getWebGLCapabilities();
  if (!capabilities.supported) return false;

  const renderer = capabilities.renderer.toLowerCase();

  // High-end desktop GPUs
  const highEnd = [
    "nvidia",
    "geforce",
    "rtx",
    "gtx",
    "radeon rx",
    "radeon pro",
    "quadro",
    "apple m1",
    "apple m2",
    "apple m3",
  ];

  // Low-end or integrated
  const lowEnd = [
    "intel",
    "intel hd",
    "intel uhd",
    "mali",
    "adreno",
    "powervr",
    "swiftshader",
  ];

  for (const gpu of highEnd) {
    if (renderer.includes(gpu)) return true;
  }

  for (const gpu of lowEnd) {
    if (renderer.includes(gpu)) return false;
  }

  // Default to medium performance assumption
  return capabilities.maxTextureSize >= 8192;
}

/**
 * Get device performance tier
 * @returns {'low'|'medium'|'high'} Performance tier
 */
export function getPerformanceTier() {
  // Check for reduced motion preference first
  if (prefersReducedMotion()) return "low";

  // Mobile devices are generally lower tier
  if (isMobile()) {
    return isHighPerformanceGPU() ? "medium" : "low";
  }

  // Desktop with high-end GPU
  if (isHighPerformanceGPU()) return "high";

  // Default to medium
  return "medium";
}

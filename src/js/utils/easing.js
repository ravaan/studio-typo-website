/**
 * Easing Functions
 * Matches CSS cubic-bezier values for consistency between JS and CSS animations
 */

/**
 * Create a cubic bezier easing function that matches CSS cubic-bezier(x1, y1, x2, y2)
 * Uses Newton-Raphson iteration for accurate results
 * @param {number} x1 - First control point X
 * @param {number} y1 - First control point Y
 * @param {number} x2 - Second control point X
 * @param {number} y2 - Second control point Y
 * @returns {Function} Easing function
 */
function cubicBezier(x1, y1, x2, y2) {
  // Calculate bezier curve point
  function bezierX(t) {
    return (
      3 * (1 - t) * (1 - t) * t * x1 + 3 * (1 - t) * t * t * x2 + t * t * t
    );
  }

  function bezierY(t) {
    return (
      3 * (1 - t) * (1 - t) * t * y1 + 3 * (1 - t) * t * t * y2 + t * t * t
    );
  }

  function bezierDerivativeX(t) {
    return (
      3 * (1 - t) * (1 - t) * x1 +
      6 * (1 - t) * t * (x2 - x1) +
      3 * t * t * (1 - x2)
    );
  }

  return function (t) {
    // Handle edge cases
    if (t <= 0) return 0;
    if (t >= 1) return 1;

    // Newton-Raphson iteration to find t for given x
    const epsilon = 1e-6;
    let x = t;

    for (let i = 0; i < 8; i++) {
      const currentX = bezierX(x) - t;
      if (Math.abs(currentX) < epsilon) break;
      const derivative = bezierDerivativeX(x);
      if (Math.abs(derivative) < epsilon) break;
      x -= currentX / derivative;
    }

    return bezierY(x);
  };
}

/**
 * Pre-defined easing functions matching CSS cubic-bezier values
 */
export const easings = {
  // Matches CSS: cubic-bezier(0, 0, 0.2, 1)
  easeOut: cubicBezier(0, 0, 0.2, 1),

  // Matches CSS: cubic-bezier(0.4, 0, 1, 1)
  easeIn: cubicBezier(0.4, 0, 1, 1),

  // Matches CSS: cubic-bezier(0.4, 0, 0.2, 1)
  easeInOut: cubicBezier(0.4, 0, 0.2, 1),

  // Matches CSS: cubic-bezier(0.25, 0.46, 0.45, 0.94) - Key press
  keyPress: cubicBezier(0.25, 0.46, 0.45, 0.94),

  // Matches CSS: cubic-bezier(0.34, 1.2, 0.64, 1) - Key release with overshoot
  keyRelease: cubicBezier(0.34, 1.2, 0.64, 1),

  // Linear (no easing)
  linear: (t) => t,

  // Elastic out (for playful animations)
  elasticOut: (t) => {
    const p = 0.3;
    return (
      Math.pow(2, -10 * t) * Math.sin(((t - p / 4) * (2 * Math.PI)) / p) + 1
    );
  },

  // Bounce out
  bounceOut: (t) => {
    const n1 = 7.5625;
    const d1 = 2.75;

    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  },
};

/**
 * Generic animation function using requestAnimationFrame
 * @param {number} duration - Animation duration in ms
 * @param {Function} callback - Called each frame with eased progress (0-1)
 * @param {Function} easing - Easing function (default: easeOut)
 * @returns {Promise<void>} Resolves when animation completes
 */
export function animate(duration, callback, easing = easings.easeOut) {
  return new Promise((resolve) => {
    const startTime = performance.now();

    function tick(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easing(progress);

      callback(easedProgress);

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        resolve();
      }
    }

    requestAnimationFrame(tick);
  });
}

/**
 * Animate multiple properties at once
 * @param {number} duration - Animation duration in ms
 * @param {Object} properties - Object with {prop: {from, to}} values
 * @param {Function} callback - Called with interpolated values object
 * @param {Function} easing - Easing function
 * @returns {Promise<void>}
 */
export function animateProperties(
  duration,
  properties,
  callback,
  easing = easings.easeOut,
) {
  return animate(
    duration,
    (progress) => {
      const values = {};
      for (const [key, { from, to }] of Object.entries(properties)) {
        values[key] = from + (to - from) * progress;
      }
      callback(values);
    },
    easing,
  );
}

/**
 * Create a cancellable animation
 * @param {number} duration - Animation duration in ms
 * @param {Function} callback - Called each frame
 * @param {Function} easing - Easing function
 * @returns {{promise: Promise<boolean>, cancel: Function}}
 */
export function animateCancellable(
  duration,
  callback,
  easing = easings.easeOut,
) {
  let cancelled = false;
  let animationId = null;

  const promise = new Promise((resolve) => {
    const startTime = performance.now();

    function tick(currentTime) {
      if (cancelled) {
        resolve(false);
        return;
      }

      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easing(progress);

      callback(easedProgress);

      if (progress < 1) {
        animationId = requestAnimationFrame(tick);
      } else {
        resolve(true);
      }
    }

    animationId = requestAnimationFrame(tick);
  });

  return {
    promise,
    cancel: () => {
      cancelled = true;
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    },
  };
}

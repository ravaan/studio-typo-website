/**
 * Analytics Module - Mixpanel Integration
 */

class Analytics {
  constructor() {
    this.initialized = false;
  }

  /**
   * Initialize Mixpanel with token
   * @param {string} token - Mixpanel project token
   */
  init(token) {
    // Mixpanel SDK is loaded async in HTML
    if (typeof window.mixpanel !== "undefined") {
      try {
        window.mixpanel.init(token, {
          debug: import.meta.env.DEV,
          track_pageview: false, // We'll track manually
          persistence: "localStorage",
        });
        this.initialized = true;
        this.trackPageLoad();
      } catch (error) {
        console.warn("Mixpanel initialization failed:", error);
      }
    } else {
      console.warn("Mixpanel SDK not loaded");
    }
  }

  /**
   * Track an event
   * @param {string} event - Event name
   * @param {Object} properties - Event properties
   */
  track(event, properties = {}) {
    if (!this.initialized) return;

    try {
      window.mixpanel.track(event, {
        ...properties,
        timestamp: Date.now(),
        url: window.location.href,
        viewport_width: window.innerWidth,
        viewport_height: window.innerHeight,
      });
    } catch (error) {
      console.warn("Failed to track event:", error);
    }
  }

  /**
   * Track page load
   */
  trackPageLoad() {
    this.track("Page Load", {
      referrer: document.referrer || "direct",
      user_agent: navigator.userAgent,
      screen_width: window.screen.width,
      screen_height: window.screen.height,
      device_pixel_ratio: window.devicePixelRatio,
      language: navigator.language,
    });
  }

  /**
   * Track when intro sequence is triggered
   * @param {string} method - How it was triggered ('click' or 'keyboard')
   * @param {string} key - Which key triggered it
   */
  trackIntroTriggered(method, key) {
    this.track("Intro Triggered", { method, key });
  }

  /**
   * Track intro sequence completion
   * @param {number} duration - How long the intro took
   */
  trackIntroComplete(duration) {
    this.track("Intro Complete", { duration });
  }

  /**
   * Track navigation between sections
   * @param {string} section - Section navigated to
   * @param {string} previousSection - Previous section
   */
  trackNavigation(section, previousSection = null) {
    this.track("Navigation", { section, previous_section: previousSection });
  }

  /**
   * Track theme toggle
   * @param {string} theme - New theme ('dark' or 'light')
   */
  trackThemeToggle(theme) {
    this.track("Theme Toggle", { theme });
  }

  /**
   * Track sound toggle
   * @param {boolean} enabled - New sound state
   */
  trackSoundToggle(enabled) {
    this.track("Sound Toggle", { enabled });
  }

  /**
   * Track key press on 3D keyboard
   * @param {string} key - Key that was pressed
   * @param {string} method - How it was pressed ('click' or 'keyboard')
   */
  trackKeyPress(key, method) {
    this.track("Key Press", { key, method });
  }

  /**
   * Track loading performance
   * @param {Object} metrics - Performance metrics
   */
  trackLoadPerformance(metrics) {
    this.track("Load Performance", metrics);
  }

  /**
   * Track errors
   * @param {string} type - Error type
   * @param {string} message - Error message
   * @param {string} stack - Error stack trace (optional)
   */
  trackError(type, message, stack = null) {
    this.track("Error", {
      error_type: type,
      error_message: message,
      error_stack: stack,
    });
  }

  /**
   * Track WebGL capabilities
   * @param {Object} capabilities - WebGL capabilities
   */
  trackWebGLCapabilities(capabilities) {
    this.track("WebGL Capabilities", capabilities);
  }

  /**
   * Track when user scrolls to a section
   * @param {string} section - Section scrolled to
   */
  trackSectionView(section) {
    this.track("Section View", { section });
  }

  /**
   * Track external link clicks
   * @param {string} url - Link URL
   * @param {string} text - Link text
   */
  trackExternalLink(url, text) {
    this.track("External Link Click", { url, text });
  }

  /**
   * Set user properties
   * @param {Object} properties - User properties
   */
  setUserProperties(properties) {
    if (!this.initialized) return;

    try {
      window.mixpanel.people.set(properties);
    } catch (error) {
      console.warn("Failed to set user properties:", error);
    }
  }
}

// Export singleton instance
export const analytics = new Analytics();

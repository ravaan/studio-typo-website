/**
 * Studio Typo - Main Entry Point
 */

import "./styles/main.css";
import { App } from "./js/App.js";
import { analytics } from "./js/utils/analytics.js";
import { CONFIG } from "./config.js";

// Initialize analytics
analytics.init(CONFIG.analytics.mixpanelToken);

// Initialize application when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  const app = new App();
  app.init().catch((error) => {
    console.error("Failed to initialize app:", error);
    analytics.trackError("init", error.message);

    // Show error state
    const loading = document.getElementById("loading");
    if (loading) {
      loading.innerHTML = `
        <div class="error-message">
          <p>Something went wrong. Please refresh the page.</p>
          <button onclick="location.reload()">Refresh</button>
        </div>
      `;
    }
  });
});

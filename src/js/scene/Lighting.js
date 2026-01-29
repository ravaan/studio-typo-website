/**
 * Lighting - Scene lighting setup
 */

import { AmbientLight, DirectionalLight, PointLight, Color } from "three";

export class Lighting {
  constructor(scene) {
    this.scene = scene;
    this.lights = [];
  }

  /**
   * Set up scene lighting
   */
  setup() {
    // Ambient light for base illumination
    const ambient = new AmbientLight(new Color(0x404050), 0.4);
    this.scene.add(ambient);
    this.lights.push(ambient);

    // Main key light (top-front)
    const keyLight = new DirectionalLight(new Color(0xffffff), 1.0);
    keyLight.position.set(5, 10, 7);
    keyLight.castShadow = false; // Shadows disabled for performance
    this.scene.add(keyLight);
    this.lights.push(keyLight);

    // Fill light (opposite side, softer)
    const fillLight = new DirectionalLight(new Color(0x8080ff), 0.3);
    fillLight.position.set(-5, 5, -5);
    this.scene.add(fillLight);
    this.lights.push(fillLight);

    // Rim light (behind, for edge definition)
    const rimLight = new DirectionalLight(new Color(0x0080fe), 0.4);
    rimLight.position.set(0, 5, -10);
    this.scene.add(rimLight);
    this.lights.push(rimLight);

    // Accent point light (for subtle highlight)
    const accentLight = new PointLight(new Color(0x0080fe), 0.5, 20);
    accentLight.position.set(3, 3, 5);
    this.scene.add(accentLight);
    this.lights.push(accentLight);
  }

  /**
   * Update light for theme change
   */
  setTheme(theme) {
    if (theme === "light") {
      // Brighter, warmer lighting for light theme
      this.lights[0].intensity = 0.6; // ambient
      this.lights[1].intensity = 1.2; // key
      this.lights[2].color.setHex(0xffffff); // fill - neutral
    } else {
      // Original dark theme lighting
      this.lights[0].intensity = 0.4;
      this.lights[1].intensity = 1.0;
      this.lights[2].color.setHex(0x8080ff);
    }
  }

  /**
   * Clean up lights
   */
  dispose() {
    for (const light of this.lights) {
      this.scene.remove(light);
    }
    this.lights = [];
  }
}

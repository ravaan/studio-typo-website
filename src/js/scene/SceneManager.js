/**
 * SceneManager - Three.js scene setup and management
 * Uses tree-shaken imports for minimal bundle size
 */

import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  Clock,
  ACESFilmicToneMapping,
  Vector2,
  Raycaster,
} from "three";
import { CONFIG } from "../../config.js";
import { debounce, throttle } from "../utils/helpers.js";
import { Lighting } from "./Lighting.js";
import { Environment } from "./Environment.js";

export class SceneManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = new Scene();
    this.camera = null;
    this.renderer = null;
    this.clock = new Clock();
    this.animationId = null;
    this.isPaused = false;
    this.onUpdate = null;
    this.onKeyClick = null;

    // Raycasting
    this.raycaster = new Raycaster();
    this.mouse = new Vector2();
    this.hoveredKey = null;

    // Lighting and environment
    this.lighting = null;
    this.environment = null;
  }

  /**
   * Initialize the scene
   */
  async init() {
    this.setupCamera();
    this.setupRenderer();
    this.setupLighting();
    await this.setupEnvironment();
    this.setupEventListeners();
  }

  /**
   * Set up the camera
   */
  setupCamera() {
    const { fov, near, far, position } = CONFIG.scene.camera;
    const aspect = window.innerWidth / window.innerHeight;

    this.camera = new PerspectiveCamera(fov, aspect, near, far);
    this.camera.position.set(position.x, position.y, position.z);
    this.camera.lookAt(0, 0, 0);
  }

  /**
   * Set up the renderer
   */
  setupRenderer() {
    const { antialias, alpha, powerPreference } = CONFIG.scene.renderer;
    const maxPixelRatio = CONFIG.performance.maxPixelRatio;

    this.renderer = new WebGLRenderer({
      canvas: this.canvas,
      antialias,
      alpha,
      powerPreference,
    });

    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, maxPixelRatio),
    );
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
  }

  /**
   * Set up scene lighting
   */
  setupLighting() {
    this.lighting = new Lighting(this.scene);
    this.lighting.setup();
  }

  /**
   * Set up environment map
   */
  async setupEnvironment() {
    this.environment = new Environment(this.scene, this.renderer);
    await this.environment.load();
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Debounced resize handler
    const debouncedResize = debounce(
      this.handleResize.bind(this),
      CONFIG.performance.resizeDebounce,
    );
    window.addEventListener("resize", debouncedResize);

    // Visibility change - pause/resume when tab hidden
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.pause();
      } else {
        this.resume();
      }
    });

    // WebGL context loss handling
    this.canvas.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      this.handleContextLost();
    });

    this.canvas.addEventListener("webglcontextrestored", () => {
      this.handleContextRestored();
    });

    // Mouse interaction for key hover/click
    const throttledRaycast = throttle(
      this.handleMouseMove.bind(this),
      CONFIG.performance.raycastInterval,
    );
    this.canvas.addEventListener("mousemove", throttledRaycast);
    this.canvas.addEventListener("click", this.handleClick.bind(this));

    // Touch support
    this.canvas.addEventListener("touchstart", this.handleTouch.bind(this), {
      passive: true,
    });
  }

  /**
   * Handle window resize
   */
  handleResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  /**
   * Handle WebGL context loss
   */
  handleContextLost() {
    console.warn("WebGL context lost");
    this.pause();

    // Show user message
    const loading = document.getElementById("loading");
    if (loading) {
      loading.innerHTML = `
        <div class="error-message">
          <p>Graphics context lost. Please refresh the page.</p>
          <button onclick="location.reload()">Refresh</button>
        </div>
      `;
      loading.classList.remove("hidden");
    }
  }

  /**
   * Handle WebGL context restoration
   */
  handleContextRestored() {
    console.log("WebGL context restored");
    this.resume();
  }

  /**
   * Handle mouse move for raycasting
   */
  handleMouseMove(event) {
    // Convert mouse position to normalized device coordinates
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Raycast
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(
      this.scene.children,
      true,
    );

    // Find key model in intersects
    const keyIntersect = intersects.find((i) => i.object.userData?.keyModel);

    if (keyIntersect) {
      const keyModel = keyIntersect.object.userData.keyModel;

      // Hover state change
      if (this.hoveredKey !== keyModel) {
        if (this.hoveredKey) {
          this.hoveredKey.hover(false);
        }
        keyModel.hover(true);
        this.hoveredKey = keyModel;
        this.canvas.style.cursor = "pointer";
      }
    } else {
      // Clear hover
      if (this.hoveredKey) {
        this.hoveredKey.hover(false);
        this.hoveredKey = null;
        this.canvas.style.cursor = "default";
      }
    }
  }

  /**
   * Handle click on canvas
   */
  handleClick(event) {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(
      this.scene.children,
      true,
    );

    const keyIntersect = intersects.find((i) => i.object.userData?.keyModel);

    if (keyIntersect) {
      const keyModel = keyIntersect.object.userData.keyModel;
      this.onKeyClick?.(keyModel);
    }
  }

  /**
   * Handle touch on canvas
   */
  handleTouch(event) {
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      this.mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(
        this.scene.children,
        true,
      );

      const keyIntersect = intersects.find((i) => i.object.userData?.keyModel);

      if (keyIntersect) {
        const keyModel = keyIntersect.object.userData.keyModel;
        this.onKeyClick?.(keyModel);
      }
    }
  }

  /**
   * Start the render loop
   */
  start(updateCallback) {
    this.onUpdate = updateCallback;
    this.animate();
  }

  /**
   * Animation loop
   */
  animate() {
    if (this.isPaused) return;

    this.animationId = requestAnimationFrame(this.animate.bind(this));

    const delta = this.clock.getDelta();
    const elapsed = this.clock.getElapsedTime();

    // Call update callback
    this.onUpdate?.(delta, elapsed);

    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Pause rendering
   */
  pause() {
    this.isPaused = true;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * Resume rendering
   */
  resume() {
    if (!this.isPaused) return;
    this.isPaused = false;
    this.clock.start();
    this.animate();
  }

  /**
   * Clean up all resources
   */
  dispose() {
    this.pause();

    // Dispose all scene objects
    this.scene.traverse((child) => {
      if (child.geometry) {
        child.geometry.dispose();
      }
      if (child.material) {
        this.disposeMaterial(child.material);
      }
    });

    this.environment?.dispose();
    this.renderer.dispose();
  }

  /**
   * Dispose material and its textures
   */
  disposeMaterial(material) {
    if (Array.isArray(material)) {
      material.forEach((m) => this.disposeMaterial(m));
      return;
    }

    // Dispose all texture types
    if (material.map) material.map.dispose();
    if (material.normalMap) material.normalMap.dispose();
    if (material.roughnessMap) material.roughnessMap.dispose();
    if (material.metalnessMap) material.metalnessMap.dispose();
    if (material.envMap) material.envMap.dispose();
    if (material.emissiveMap) material.emissiveMap.dispose();

    material.dispose();
  }
}

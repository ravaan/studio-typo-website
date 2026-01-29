# Studio Typo - Performance Guidelines

## Overview

This document outlines critical performance considerations for the Studio Typo website. The goal is to deliver a premium, immersive 3D experience while maintaining fast load times and smooth 60fps animations.

---

## 🎯 Performance Priorities (Ranked)

1. **First Paint Speed** - Show something immediately
2. **Smooth Animations** - Never drop below 60fps
3. **Mobile Performance** - Must work well on mid-range phones
4. **Memory Efficiency** - Don't crash mobile browsers
5. **Battery Consideration** - Don't overheat devices

---

## 📦 Loading Strategy

### Critical Render Path

```
┌─────────────────────────────────────────────────────────────┐
│                    LOADING SEQUENCE                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  0ms     HTML received                                      │
│    │     └─ Inline critical CSS in <head>                  │
│    │     └─ Show loading state (CSS only, no JS)           │
│    │                                                        │
│  50ms    CSS parsed                                         │
│    │     └─ Page styled, loading indicator visible         │
│    │                                                        │
│  100ms   JS bundle starts loading                           │
│    │     └─ async/defer - doesn't block                    │
│    │                                                        │
│  200ms   Fonts loading (preload)                            │
│    │     └─ Font swap shows system font first              │
│    │                                                        │
│  400ms   Three.js initialized                               │
│    │     └─ Canvas visible, dark background                │
│    │                                                        │
│  600ms   Key models start loading                           │
│    │     └─ Load TYPO keys first (visible immediately)     │
│    │                                                        │
│  800ms   TYPO keys visible                                  │
│    │     └─ READY state - user can interact                │
│    │     └─ Hide loading indicator                         │
│    │                                                        │
│  1000ms  STUDIO keys loading in background                  │
│    │     └─ User doesn't see these yet                     │
│    │                                                        │
│  1200ms  Environment map loaded                             │
│    │     └─ Metallic reflections activate                  │
│    │                                                        │
│  1500ms  Audio files loaded                                 │
│    │     └─ Ready for playback on interaction              │
│    │                                                        │
│  2000ms  All assets loaded                                  │
│          └─ FULLY READY                                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Preloading Priority

```html
<head>
  <!-- 1. Critical CSS (inline) -->
  <style>
    /* Critical above-fold CSS */
  </style>

  <!-- 2. Preload fonts -->
  <link
    rel="preload"
    href="/fonts/space-mono.woff2"
    as="font"
    type="font/woff2"
    crossorigin
  />

  <!-- 3. Preconnect to CDNs if using any -->
  <link rel="preconnect" href="https://cdn.example.com" />

  <!-- 4. Main CSS (non-blocking) -->
  <link rel="stylesheet" href="/styles/main.css" />

  <!-- 5. Main JS (async) -->
  <script type="module" src="/js/main.js" async></script>
</head>
```

---

## 🎮 Three.js Optimization

### 1. Renderer Configuration

```javascript
const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById("canvas"),
  antialias: true,
  alpha: true,
  powerPreference: "high-performance", // Request dedicated GPU
  stencil: false, // Disable if not using stencil
  depth: true,
});

// Limit pixel ratio for performance
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Enable tone mapping for HDR environment maps
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;

// Optimize shadow maps if using shadows
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.shadowMap.autoUpdate = false; // Manual update only
```

### 2. Geometry Optimization

```javascript
// ❌ DON'T: Create geometry in animation loop
function animate() {
  const geometry = new THREE.BoxGeometry(1, 1, 1); // Memory leak!
}

// ✅ DO: Reuse geometry and materials
const sharedGeometry = new THREE.BoxGeometry(1, 1, 1);
const sharedMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });

keys.forEach((key) => {
  const mesh = new THREE.Mesh(sharedGeometry, sharedMaterial.clone());
});
```

### 3. Model Loading

```javascript
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

// Use Draco compression for smaller files
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("/draco/");

const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

// Load with progress tracking
async function loadModel(url, onProgress) {
  return new Promise((resolve, reject) => {
    gltfLoader.load(url, resolve, onProgress, reject);
  });
}

// Priority loading: TYPO first, STUDIO second
async function loadAllKeys() {
  // Phase 1: Visible keys
  const typoKeys = await Promise.all([
    loadModel("/models/key-t.glb"),
    loadModel("/models/key-y.glb"),
    loadModel("/models/key-p.glb"),
    loadModel("/models/key-o.glb"),
  ]);

  // Signal ready state
  onReadyState();

  // Phase 2: Hidden keys (background)
  const studioKeys = await Promise.all([
    loadModel("/models/key-s.glb"),
    loadModel("/models/key-t.glb"), // Second T
    loadModel("/models/key-u.glb"),
    loadModel("/models/key-d.glb"),
    loadModel("/models/key-i.glb"),
    loadModel("/models/key-o.glb"), // Second O
  ]);

  return { typoKeys, studioKeys };
}
```

### 4. Texture Optimization

```javascript
// Use compressed textures where possible
const textureLoader = new THREE.TextureLoader();

// ❌ DON'T: Load massive textures
textureLoader.load("/textures/metal-4k.jpg");

// ✅ DO: Use appropriate sizes
textureLoader.load("/textures/metal-512.jpg", (texture) => {
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  texture.encoding = THREE.sRGBEncoding;
});
```

### 5. Environment Map Optimization

```javascript
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";

// Load HDR environment map
const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

const rgbeLoader = new RGBELoader();
rgbeLoader.load("/textures/studio-env.hdr", (texture) => {
  const envMap = pmremGenerator.fromEquirectangular(texture).texture;
  scene.environment = envMap;

  // Dispose original to save memory
  texture.dispose();
  pmremGenerator.dispose();
});
```

### 6. Animation Loop Optimization

```javascript
// ❌ DON'T: Do heavy work every frame
function animate() {
  // Expensive raycasting every frame
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children, true);

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

// ✅ DO: Throttle expensive operations
let lastRaycast = 0;
const RAYCAST_INTERVAL = 50; // ms

function animate(time) {
  // Throttle raycasting
  if (time - lastRaycast > RAYCAST_INTERVAL) {
    raycaster.setFromCamera(mouse, camera);
    intersects = raycaster.intersectObjects(interactiveObjects); // Only check interactive
    lastRaycast = time;
  }

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
```

### 7. Object Pooling for Particles/Effects

```javascript
// If adding particle effects, use object pooling
class ParticlePool {
  constructor(size) {
    this.pool = [];
    this.active = [];

    for (let i = 0; i < size; i++) {
      this.pool.push(new Particle());
    }
  }

  get() {
    return this.pool.pop() || new Particle();
  }

  release(particle) {
    particle.reset();
    this.pool.push(particle);
  }
}
```

---

## 🔊 Audio Optimization

### 1. Audio Loading Strategy

```javascript
// Preload audio but don't decode until needed
class AudioManager {
  constructor() {
    this.buffers = new Map();
    this.context = null;
  }

  async preload(url, key) {
    // Fetch audio file
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();

    // Store raw buffer (don't decode yet)
    this.buffers.set(key, arrayBuffer);
  }

  async decode(key) {
    const arrayBuffer = this.buffers.get(key);
    if (!this.context) {
      this.context = new AudioContext();
    }

    // Decode only when needed
    const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
    this.buffers.set(key, audioBuffer);
    return audioBuffer;
  }
}
```

### 2. Audio Sprite for Key Sounds

Instead of loading 8 separate key sounds, use an audio sprite:

```javascript
// Single file with multiple sounds
const keySprite = {
  press1: { start: 0, duration: 0.15 },
  press2: { start: 0.2, duration: 0.15 },
  press3: { start: 0.4, duration: 0.15 },
  // ... variations
};

function playKeySound() {
  const variant = keySprite[`press${Math.floor(Math.random() * 3) + 1}`];
  source.start(0, variant.start, variant.duration);
}
```

### 3. Audio Cleanup

```javascript
// Always disconnect and null references
function stopSound(source) {
  source.stop();
  source.disconnect();
  source = null;
}

// Cleanup on page hide (mobile)
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    audioManager.suspend();
  } else {
    audioManager.resume();
  }
});
```

---

## 📱 Mobile Optimization

### 1. Device Detection & Adaptation

```javascript
function getDeviceCapabilities() {
  const gl = document.createElement("canvas").getContext("webgl2");

  return {
    isMobile: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent),
    pixelRatio: Math.min(window.devicePixelRatio, 2),
    maxTextureSize: gl?.getParameter(gl.MAX_TEXTURE_SIZE) || 2048,
    supportsWebGL2: !!gl,
    isLowEnd: navigator.hardwareConcurrency <= 4 || navigator.deviceMemory <= 4,
  };
}

// Adapt quality based on device
function configureQuality(capabilities) {
  if (capabilities.isLowEnd) {
    return {
      pixelRatio: 1,
      shadowQuality: "off",
      envMapSize: 256,
      antialias: false,
      maxLights: 2,
    };
  }

  if (capabilities.isMobile) {
    return {
      pixelRatio: Math.min(capabilities.pixelRatio, 1.5),
      shadowQuality: "low",
      envMapSize: 512,
      antialias: true,
      maxLights: 4,
    };
  }

  // Desktop
  return {
    pixelRatio: 2,
    shadowQuality: "high",
    envMapSize: 1024,
    antialias: true,
    maxLights: 8,
  };
}
```

### 2. Touch Optimization

```javascript
// Passive listeners for scroll performance
document.addEventListener('touchstart', handleTouch, { passive: true });
document.addEventListener('touchmove', handleMove, { passive: true });

// Prevent double-tap zoom on interactive elements
.key-interactive {
  touch-action: manipulation;
}

// Increase touch targets
@media (pointer: coarse) {
  .key-interactive {
    min-width: 48px;
    min-height: 48px;
  }
}
```

### 3. Reduce Motion Support

```javascript
// Check user preference
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

if (prefersReducedMotion) {
  // Skip intro animation
  // Reduce 3D effects
  // Disable particle effects
  config.animationDuration = 0.01;
  config.enableParticles = false;
}
```

---

## 🎨 CSS Optimization

### 1. Critical CSS

```css
/* Inline in <head> - Only what's needed for first paint */
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  background: #0a0a0f;
  color: #f4f4f5;
  min-height: 100vh;
  overflow: hidden;
}

#canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.loading {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: monospace;
  color: #a1a1aa;
}
```

### 2. Animation Performance

```css
/* ❌ DON'T: Animate expensive properties */
.animated {
  left: 0;
  top: 0;
  width: 100px;
}
.animated:hover {
  left: 100px; /* Triggers layout */
  width: 200px; /* Triggers layout */
}

/* ✅ DO: Use transform and opacity only */
.animated {
  transform: translateX(0);
  opacity: 1;
  will-change: transform, opacity; /* Hint to browser */
}
.animated:hover {
  transform: translateX(100px);
}

/* Remove will-change after animation */
.animated.done {
  will-change: auto;
}
```

### 3. Contain Property

```css
/* Tell browser what won't change */
.nav-item {
  contain: layout style paint; /* Isolate repaints */
}

.content-section {
  contain: content; /* Strongly contained */
}
```

### 4. Font Loading

```css
/* Prevent FOIT (Flash of Invisible Text) */
@font-face {
  font-family: "Space Mono";
  src: url("/fonts/space-mono.woff2") format("woff2");
  font-display: swap; /* Show fallback immediately */
  font-weight: 400;
}

/* Prevent layout shift from font swap */
body {
  font-family: "Space Mono", "SF Mono", "Consolas", monospace;
  /* Similar metrics fallbacks */
}
```

---

## 📊 Memory Management

### 1. Dispose Three.js Objects

```javascript
// ALWAYS dispose when removing objects
function disposeObject(obj) {
  if (obj.geometry) {
    obj.geometry.dispose();
  }

  if (obj.material) {
    if (Array.isArray(obj.material)) {
      obj.material.forEach((m) => disposeMaterial(m));
    } else {
      disposeMaterial(obj.material);
    }
  }

  if (obj.children) {
    obj.children.forEach((child) => disposeObject(child));
  }
}

function disposeMaterial(material) {
  for (const key in material) {
    const value = material[key];
    if (value && typeof value.dispose === "function") {
      value.dispose(); // Dispose textures
    }
  }
  material.dispose();
}
```

### 2. Memory Monitoring

```javascript
// Development only - monitor memory
if (import.meta.env.DEV) {
  setInterval(() => {
    if (performance.memory) {
      console.log({
        usedJSHeapSize:
          (performance.memory.usedJSHeapSize / 1048576).toFixed(2) + " MB",
        totalJSHeapSize:
          (performance.memory.totalJSHeapSize / 1048576).toFixed(2) + " MB",
      });
    }

    console.log("Three.js Memory:", renderer.info.memory);
    console.log("Three.js Render:", renderer.info.render);
  }, 5000);
}
```

---

## 🧪 Performance Testing Checklist

### Lighthouse Targets

| Metric                   | Target  | Critical |
| ------------------------ | ------- | -------- |
| Performance Score        | > 80    | > 70     |
| First Contentful Paint   | < 1.5s  | < 2.5s   |
| Largest Contentful Paint | < 2.5s  | < 4s     |
| Time to Interactive      | < 3.5s  | < 5s     |
| Total Blocking Time      | < 200ms | < 500ms  |
| Cumulative Layout Shift  | < 0.1   | < 0.25   |

### Manual Testing

- [ ] Test on slow 3G (Chrome DevTools throttling)
- [ ] Test on mid-range Android device
- [ ] Test on older iPhone (iPhone 8/X)
- [ ] Verify 60fps on desktop (DevTools Performance)
- [ ] Verify 60fps on mobile (remote debugging)
- [ ] Check memory doesn't grow over time
- [ ] Verify no WebGL errors in console

### Build Analysis

```bash
# Analyze bundle size
npx vite-bundle-visualizer

# Check for duplicate dependencies
npx depcheck
```

---

## 🚀 Quick Wins Summary

1. **Inline critical CSS** - First paint in < 100ms
2. **Load TYPO keys first** - Interactive in < 1s
3. **Use Draco compression** - 70% smaller models
4. **Limit pixel ratio to 2** - Big mobile performance gain
5. **Throttle raycasting** - 50ms intervals, not every frame
6. **Use `transform` only** - Never animate `left/top/width`
7. **Dispose all resources** - No memory leaks
8. **Audio sprites** - Single file for variations
9. **`font-display: swap`** - No invisible text flash
10. **Passive touch listeners** - Smooth mobile scrolling

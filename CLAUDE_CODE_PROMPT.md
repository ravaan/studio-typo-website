# Studio Typo - Claude Code Development Prompt

You are building **Studio Typo**, a premium technology consultancy website featuring an immersive 3D mechanical keyboard intro experience with ASMR typing sounds.

---

## 🎯 Project Vision

A cinematic, single-page website where visitors are greeted by interactive 3D mechanical keyboard keys spelling "TYPO". Upon interaction, the full "STUDIO TYPO" logo reveals in a dramatic sequence, then slides right to reveal the navigation. The entire experience is accompanied by immersive mechanical keyboard ASMR sounds.

**Design Philosophy**: Minimal, premium, memorable. Every interaction should feel intentional and satisfying.

---

## 📋 Technical Requirements

### Tech Stack (MANDATORY)

| Technology    | Version | Purpose                |
| ------------- | ------- | ---------------------- |
| Vite          | 5.x     | Build tool, dev server |
| Three.js      | 0.160+  | 3D rendering           |
| Vanilla JS    | ES2022+ | Application logic      |
| CSS Variables | Native  | Theming                |
| Web Audio API | Native  | Sound system           |

### Constraints

- **NO** React, Vue, Angular, or any framework
- **NO** jQuery or utility libraries (lodash, etc.)
- **NO** CSS frameworks (Tailwind, Bootstrap)
- **NO** animation libraries (GSAP) - use native CSS/JS animations
- **ONLY** Three.js as external dependency for 3D
- Total bundle (excluding assets): **< 200KB gzipped**

---

## 🗂 File Structure

Create this EXACT structure:

```
studio-typo/
├── index.html
├── vite.config.js
├── package.json
│
├── src/
│   ├── main.js                      # Entry point
│   │
│   ├── styles/
│   │   ├── main.css                 # Imports all styles
│   │   ├── variables.css            # CSS custom properties
│   │   ├── reset.css                # CSS reset
│   │   ├── typography.css           # Font styles
│   │   ├── layout.css               # Page structure
│   │   ├── components.css           # UI components
│   │   ├── animations.css           # Keyframes
│   │   └── responsive.css           # Media queries
│   │
│   ├── js/
│   │   ├── App.js                   # Main application class
│   │   │
│   │   ├── scene/
│   │   │   ├── SceneManager.js      # Three.js scene setup
│   │   │   ├── KeyModel.js          # Single key mesh class
│   │   │   ├── KeyboardLayout.js    # Positions all keys
│   │   │   ├── Lighting.js          # Lights setup
│   │   │   └── Environment.js       # HDR environment map
│   │   │
│   │   ├── audio/
│   │   │   └── AudioManager.js      # Web Audio controller
│   │   │
│   │   ├── intro/
│   │   │   └── IntroSequence.js     # Cinematic intro
│   │   │
│   │   ├── ui/
│   │   │   ├── Navigation.js        # Sidebar nav
│   │   │   ├── ThemeToggle.js       # Dark/light switch
│   │   │   ├── SoundToggle.js       # Audio toggle
│   │   │   └── ContentSections.js   # Page sections
│   │   │
│   │   └── utils/
│   │       ├── storage.js           # localStorage wrapper
│   │       ├── keyboard.js          # Keyboard shortcuts
│   │       ├── device.js            # Device detection
│   │       └── analytics.js         # Mixpanel wrapper
│   │
│   └── assets/
│       ├── models/                  # GLTF/GLB files (placeholder)
│       ├── textures/                # HDR environment (placeholder)
│       ├── audio/                   # Sound files (placeholder)
│       └── fonts/                   # Web fonts
│
└── public/
    ├── favicon.ico
    └── og-image.png
```

---

## 🎨 Design System

### Colors

Implement these CSS variables in `variables.css`:

```css
/* Dark Theme (Default) */
:root {
  /* Backgrounds */
  --bg-primary: #0a0a0f;
  --bg-secondary: #12121a;
  --bg-tertiary: #1a1a24;

  /* Text */
  --text-primary: #f4f4f5;
  --text-secondary: #a1a1aa;
  --text-tertiary: #71717a;

  /* Accent - Azure */
  --accent: #0080fe;
  --accent-hover: #0066cc;
  --accent-subtle: rgba(0, 128, 254, 0.1);

  /* Borders */
  --border-primary: #2a2a3a;
  --border-secondary: #3a3a4a;

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-normal: 300ms ease;
  --transition-slow: 500ms ease;
}

/* Light Theme */
[data-theme="light"] {
  --bg-primary: #fafafa;
  --bg-secondary: #ffffff;
  --bg-tertiary: #f4f4f5;

  --text-primary: #18181b;
  --text-secondary: #52525b;
  --text-tertiary: #a1a1aa;

  --border-primary: #e4e4e7;
  --border-secondary: #d4d4d8;
}
```

### Typography

```css
:root {
  --font-mono: "Space Mono", "SF Mono", "Consolas", monospace;

  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 2rem;
  --text-4xl: 2.5rem;
}
```

---

## 🎬 Interaction Flow

### State Machine

Implement these states in `App.js`:

```javascript
const STATES = {
  LOADING: "loading", // Assets loading
  READY: "ready", // TYPO keys visible, waiting for interaction
  INTRO: "intro", // Intro sequence playing
  MAIN: "main", // Full site active
  TRANSITIONING: "transitioning", // Section change animation
};
```

### Flow Diagram

```
[Page Load]
     │
     ▼
[LOADING] ─────────────────────────────────────────────────────
     │     Show: Dark background + minimal loading indicator
     │     Load: TYPO keys (T, Y, P, O) FIRST (priority)
     │     Load: STUDIO keys in background
     │     Load: Environment map
     │     Load: Audio files (don't decode yet)
     │
     ▼
[READY] ───────────────────────────────────────────────────────
     │     Show: 4 TYPO keys in center, subtle idle animation
     │     Show: "Click a key or type TYPO" hint (fades out after 3s)
     │     Listen: Mouse click on keys
     │     Listen: Keyboard T, Y, P, O keys
     │
     │ ◄─── User clicks OR types
     ▼
[INTRO] ───────────────────────────────────────────────────────
     │     0.0s: Initialize AudioContext, start typing loop
     │     0.2s: Clicked key animates (press down/up)
     │     0.6s: STUDIO keys fade in from left (staggered)
     │     1.5s: All keys visible, brief pause
     │     2.0s: Entire arrangement slides right
     │     2.8s: Navigation fades in from left
     │     3.5s: Intro complete
     │
     ▼
[MAIN] ────────────────────────────────────────────────────────
     │     Layout: Sidebar (left) | 3D Keys (right)
     │     Active: Full navigation
     │     Active: Theme toggle
     │     Active: Sound toggle
     │     Active: Keyboard shortcuts
     │
     │ ◄─── User clicks nav item
     ▼
[TRANSITIONING] ───────────────────────────────────────────────
     │     Animate: Keys react (optional press effect)
     │     Animate: Content section slides in
     │     Duration: 500ms
     │
     └───► Back to [MAIN]
```

---

## 🎮 3D Scene Requirements

### Scene Setup (SceneManager.js)

```javascript
// Required configuration
const config = {
  camera: {
    fov: 45,
    near: 0.1,
    far: 100,
    position: { x: 0, y: 2, z: 8 },
  },
  renderer: {
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
    pixelRatio: Math.min(window.devicePixelRatio, 2),
  },
};
```

### Key Layout (KeyboardLayout.js)

Position keys in this arrangement:

```
INITIAL STATE (READY):
Only these 4 keys visible, centered:

        [T] [Y]
        [P] [O]

AFTER INTRO (MAIN):
Full arrangement, shifted right:

    [S] [T] [U] [D] [I] [O]
            [T] [Y]
            [P] [O]
```

Spacing: 1.2 units between keys (adjust for visual appeal)

### Key Model Class (KeyModel.js)

Each key needs:

- GLTF model loading
- Press animation (down 0.15 units, then bounce back)
- Hover state (subtle glow or lift)
- Click handler
- Letter identifier

```javascript
class KeyModel {
  constructor(letter, position) {
    this.letter = letter;
    this.mesh = null;
    this.isPressed = false;
  }

  async load(loader) {
    /* Load GLTF */
  }
  press() {
    /* Animate down then up */
  }
  hover(isHovering) {
    /* Subtle effect */
  }
  onClick(callback) {
    /* Register handler */
  }
}
```

### Placeholder Models

Until real GLTF models are provided, create procedural keys:

```javascript
function createPlaceholderKey(letter) {
  const group = new THREE.Group();

  // Key cap (box)
  const capGeometry = new THREE.BoxGeometry(1, 0.4, 1);
  const capMaterial = new THREE.MeshStandardMaterial({
    color: 0x2a2a35,
    metalness: 0.8,
    roughness: 0.3,
  });
  const cap = new THREE.Mesh(capGeometry, capMaterial);
  cap.position.y = 0.2;

  // Rounded edges using chamfer or bevel (optional)

  // Letter on top (texture or 3D text)
  // For placeholder: use TextGeometry or canvas texture

  group.add(cap);
  return group;
}
```

---

## 🔊 Audio System (AudioManager.js)

### Requirements

```javascript
class AudioManager {
  constructor() {
    this.context = null;
    this.masterGain = null;
    this.typingLoop = null;
    this.keyPressBuffer = null;
    this.enabled = true;
  }

  // Called on first user interaction
  async init() {
    this.context = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.context.createGain();
    this.masterGain.connect(this.context.destination);
    this.masterGain.gain.value = 0.7;
  }

  // Load and decode audio file
  async loadSound(url) {
    /* ... */
  }

  // Play typing loop (background ASMR)
  startTypingLoop() {
    // Fade in over 1 second
    // Loop continuously
  }

  // Play single key press
  playKeyPress() {
    // Slight pitch variation for realism
    // Short duration (~150ms)
  }

  // Toggle mute
  setEnabled(enabled) {
    this.enabled = enabled;
    this.masterGain.gain.value = enabled ? 0.7 : 0;
    // Save to localStorage
  }

  // Cleanup
  dispose() {
    this.context?.close();
  }
}
```

### Placeholder Audio

Until real audio files are provided, create synthetic sounds:

```javascript
function createSyntheticKeyPress(context) {
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(800, context.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(
    200,
    context.currentTime + 0.1,
  );

  gainNode.gain.setValueAtTime(0.3, context.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.1);

  oscillator.connect(gainNode);
  gainNode.connect(context.destination);

  oscillator.start();
  oscillator.stop(context.currentTime + 0.1);
}
```

---

## 🧭 Navigation (Navigation.js)

### Structure

```html
<nav class="sidebar" aria-label="Main navigation">
  <ul class="nav-list">
    <li><a href="#services" class="nav-item active">Services</a></li>
    <li><a href="#about" class="nav-item">About</a></li>
    <li><a href="#work" class="nav-item">Work</a></li>
    <li><a href="#contact" class="nav-item">Contact</a></li>
  </ul>

  <div class="sidebar-controls">
    <button id="theme-toggle" aria-label="Toggle theme">
      <!-- Sun/Moon icon -->
    </button>
    <button id="sound-toggle" aria-label="Toggle sound">
      <!-- Speaker icon -->
    </button>
  </div>
</nav>
```

### Behavior

- Initially hidden (off-screen left)
- Fades/slides in after intro sequence
- Click animates content section change
- Active state indicates current section
- Keyboard: 1-4 to jump to sections

---

## 🎚 Theme Toggle (ThemeToggle.js)

### Requirements

```javascript
class ThemeToggle {
  constructor() {
    this.theme = this.getInitialTheme();
    this.button = null;
  }

  getInitialTheme() {
    // 1. Check localStorage
    // 2. Check system preference
    // 3. Default to 'dark'
  }

  setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("studio-typo-theme", theme);
    this.updateIcon();
  }

  toggle() {
    this.theme = this.theme === "dark" ? "light" : "dark";
    this.setTheme(this.theme);
  }

  updateIcon() {
    // Swap sun/moon icon with smooth animation
  }
}
```

### Icons

Use inline SVGs (no icon libraries):

```html
<!-- Sun (light mode) -->
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <circle cx="12" cy="12" r="5" />
  <path
    d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
  />
</svg>

<!-- Moon (dark mode) -->
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
</svg>
```

---

## ⌨️ Keyboard Shortcuts (keyboard.js)

### Required Shortcuts

| Key             | Action         | State      |
| --------------- | -------------- | ---------- |
| `T`             | Toggle theme   | MAIN only  |
| `S`             | Toggle sound   | MAIN only  |
| `1`             | Go to Services | MAIN only  |
| `2`             | Go to About    | MAIN only  |
| `3`             | Go to Work     | MAIN only  |
| `4`             | Go to Contact  | MAIN only  |
| `T`,`Y`,`P`,`O` | Trigger intro  | READY only |

### Implementation

```javascript
class KeyboardManager {
  constructor(app) {
    this.app = app;
    this.buffer = ""; // For detecting "TYPO" sequence
    this.bufferTimeout = null;
  }

  init() {
    document.addEventListener("keydown", this.handleKeyDown.bind(this));
  }

  handleKeyDown(e) {
    // Ignore if typing in input
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

    const key = e.key.toUpperCase();

    if (this.app.state === "ready") {
      // Check for TYPO trigger
      this.handleReadyState(key);
    } else if (this.app.state === "main") {
      // Handle shortcuts
      this.handleMainState(key, e);
    }
  }

  handleReadyState(key) {
    if ("TYPO".includes(key)) {
      this.app.triggerIntro(key);
    }
  }

  handleMainState(key, e) {
    switch (key) {
      case "T":
        e.preventDefault();
        this.app.themeToggle.toggle();
        break;
      case "S":
        e.preventDefault();
        this.app.audioManager.toggle();
        break;
      case "1":
      case "2":
      case "3":
      case "4":
        e.preventDefault();
        this.app.navigateTo(parseInt(key) - 1);
        break;
    }
  }
}
```

---

## 📱 Responsive Design

### Breakpoints

```css
/* Mobile first */
/* Base styles: 0 - 767px */

/* Tablet */
@media (min-width: 768px) {
  /* Tablet adjustments */
}

/* Desktop */
@media (min-width: 1024px) {
  /* Desktop layout */
}

/* Large Desktop */
@media (min-width: 1440px) {
  /* Larger screens */
}
```

### Mobile Layout

```
MOBILE (< 768px):
┌─────────────────────┐
│     3D KEYS         │
│   (full width)      │
│                     │
├─────────────────────┤
│     CONTENT         │
│                     │
├─────────────────────┤
│  NAV (bottom bar)   │
└─────────────────────┘

DESKTOP (≥ 1024px):
┌─────────────────────────────────────┐
│  NAV  │        │    3D KEYS         │
│       │CONTENT │                    │
│       │        │                    │
└─────────────────────────────────────┘
```

### Touch Interactions

- Keys respond to tap (touchstart)
- Increase tap target size to 48x48px minimum
- Remove hover effects on touch devices
- Support swipe for section navigation (optional)

---

## 🚀 Performance Requirements

### Critical Path

1. **Inline critical CSS** in `<head>`
2. **Load TYPO keys first** (T, Y, P, O models)
3. **Show ready state in < 1.5 seconds**
4. **Load STUDIO keys in background**
5. **Lazy load audio** (don't decode until needed)

### Code Guidelines

```javascript
// ❌ DON'T: Create objects in animation loop
function animate() {
  const tempVector = new THREE.Vector3(); // Memory leak!
}

// ✅ DO: Reuse objects
const tempVector = new THREE.Vector3();
function animate() {
  tempVector.set(x, y, z);
}

// ❌ DON'T: Update DOM in animation loop
function animate() {
  element.innerHTML = value; // Forces reflow!
}

// ✅ DO: Batch DOM updates
let needsUpdate = false;
function animate() {
  if (needsUpdate) {
    element.textContent = value;
    needsUpdate = false;
  }
}

// ❌ DON'T: Add event listeners in loop
items.forEach((item) => {
  item.addEventListener("click", handler);
});

// ✅ DO: Use event delegation
container.addEventListener("click", (e) => {
  if (e.target.matches(".item")) {
    handler(e);
  }
});
```

### Disposal

Always clean up Three.js resources:

```javascript
function disposeModel(model) {
  model.traverse((child) => {
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      if (Array.isArray(child.material)) {
        child.material.forEach((m) => m.dispose());
      } else {
        child.material.dispose();
      }
    }
  });
}
```

---

## 🧪 Testing Checklist

Before considering any phase complete, verify:

### Functionality

- [ ] Page loads without console errors
- [ ] TYPO keys visible and interactive
- [ ] Click triggers intro sequence
- [ ] Keyboard TYPO triggers intro
- [ ] Audio plays after interaction
- [ ] Theme toggle works
- [ ] Sound toggle works
- [ ] Navigation works
- [ ] All keyboard shortcuts work
- [ ] State persists on reload (theme, sound)

### Performance

- [ ] First paint < 1.5s
- [ ] Interactive < 3s
- [ ] 60fps animations (Chrome DevTools)
- [ ] No memory leaks over time
- [ ] Bundle size < 200KB (gzipped JS)

### Responsive

- [ ] Works on 375px width (iPhone SE)
- [ ] Works on 768px width (tablet)
- [ ] Works on 1920px width (desktop)
- [ ] Touch interactions work on mobile

### Accessibility

- [ ] All interactive elements focusable
- [ ] Focus visible on all elements
- [ ] ARIA labels on buttons
- [ ] Reduced motion respected
- [ ] Color contrast passes WCAG AA

---

## 📝 Development Workflow

### Getting Started

```bash
# Create project
npm create vite@latest studio-typo -- --template vanilla
cd studio-typo

# Install Three.js
npm install three

# Start dev server
npm run dev
```

### Build Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run preview  # Preview production build
```

### Vite Config

```javascript
// vite.config.js
import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  root: ".",
  publicDir: "public",
  build: {
    outDir: "dist",
    assetsDir: "assets",
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
      },
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
});
```

---

## 🎯 Implementation Order

Build in this sequence:

### Phase 1: Foundation

1. Vite project setup
2. File structure
3. CSS variables and reset
4. Basic HTML structure

### Phase 2: 3D Scene

1. Three.js scene setup
2. Camera and renderer
3. Placeholder keys (boxes)
4. Key press animation
5. Lighting and environment

### Phase 3: Intro Sequence

1. State machine
2. READY state (keys visible)
3. Click/keyboard detection
4. STUDIO keys reveal animation
5. Slide right animation

### Phase 4: Audio

1. AudioManager class
2. Placeholder synthetic sounds
3. Typing loop
4. Key press sounds
5. Sound toggle

### Phase 5: UI

1. Navigation sidebar
2. Theme toggle
3. Sound toggle
4. Content sections (placeholder)
5. Section transitions

### Phase 6: Polish

1. Responsive design
2. Mobile touch
3. Keyboard shortcuts
4. Loading state
5. Error handling

### Phase 7: Optimization

1. Performance audit
2. Bundle optimization
3. Asset optimization
4. Accessibility audit

---

## ⚠️ Important Notes

1. **Asset Placeholders**: Use procedural/synthetic placeholders for models and audio. The developer will replace with real assets later.

2. **No GSAP**: Use native CSS animations and requestAnimationFrame. Easing functions can be implemented manually.

3. **Module Structure**: Use ES modules (`import`/`export`). Vite handles bundling.

4. **Error Handling**: Gracefully handle WebGL failures with a fallback message.

5. **Analytics**: Implement Mixpanel tracking for:
   - Page load
   - Intro triggered
   - Navigation clicks
   - Theme/sound toggles

6. **Comments**: Add clear comments explaining complex logic, especially in 3D and audio code.

---

## 📚 Reference Files

When implementing, refer to these companion documents:

- `TECH_STACK.md` - Full technical specification
- `PERFORMANCE.md` - Performance optimization guidelines

---

**Remember**: This is a premium tech consultancy website. Every detail matters. The experience should feel polished, intentional, and memorable. When in doubt, choose simplicity and performance over complexity.

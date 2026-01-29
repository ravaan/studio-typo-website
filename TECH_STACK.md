# Studio Typo - Technical Specification

## Project Overview

**Studio Typo** is a technology consultancy website featuring an immersive, cinematic landing experience with interactive 3D mechanical keyboard keys and ASMR typing sounds.

---

## Tech Stack

| Layer          | Technology    | Version | Purpose                                       |
| -------------- | ------------- | ------- | --------------------------------------------- |
| **Build Tool** | Vite          | 5.x     | Fast dev server, ES modules, optimized builds |
| **3D Engine**  | Three.js      | 0.160+  | WebGL rendering, GLTF loading, animations     |
| **3D Format**  | GLTF/GLB      | 2.0     | Optimized 3D model delivery                   |
| **Audio**      | Web Audio API | Native  | Spatial audio, ASMR playback                  |
| **Styling**    | CSS Variables | Native  | Theming, transitions                          |
| **State**      | Vanilla JS    | ES2022+ | localStorage persistence                      |
| **Analytics**  | Mixpanel      | Latest  | User interaction tracking                     |

### Why This Stack?

```
┌─────────────────────────────────────────────────────────────┐
│                    ZERO FRAMEWORK OVERHEAD                   │
│                                                             │
│   ❌ No React (~45KB)      ❌ No Vue (~34KB)                │
│   ❌ No Angular (~90KB)    ❌ No jQuery (~87KB)             │
│                                                             │
│   ✅ Three.js (~150KB) - Required for 3D                   │
│   ✅ Vite - Zero runtime, build-time only                  │
│   ✅ Everything else is vanilla                             │
└─────────────────────────────────────────────────────────────┘
```

---

## File Structure

```
studio-typo/
├── index.html                    # Single HTML entry point
├── vite.config.js                # Vite configuration
├── package.json                  # Dependencies
│
├── src/
│   ├── main.js                   # Application entry point
│   │
│   ├── styles/
│   │   ├── main.css              # Main stylesheet
│   │   ├── variables.css         # CSS custom properties (themes)
│   │   ├── typography.css        # Font definitions
│   │   ├── animations.css        # Keyframe animations
│   │   └── responsive.css        # Media queries
│   │
│   ├── js/
│   │   ├── app.js                # Main application controller
│   │   ├── scene/
│   │   │   ├── SceneManager.js   # Three.js scene setup
│   │   │   ├── KeyModel.js       # Keyboard key class
│   │   │   ├── Lighting.js       # Lights & environment
│   │   │   └── PostProcessing.js # Optional effects
│   │   │
│   │   ├── audio/
│   │   │   ├── AudioManager.js   # Web Audio API controller
│   │   │   └── sounds.js         # Sound definitions
│   │   │
│   │   ├── intro/
│   │   │   ├── IntroSequence.js  # Cinematic intro controller
│   │   │   └── Timeline.js       # Animation timeline
│   │   │
│   │   ├── ui/
│   │   │   ├── Navigation.js     # Sidebar navigation
│   │   │   ├── ThemeToggle.js    # Dark/light switch
│   │   │   ├── SoundToggle.js    # Audio on/off
│   │   │   └── Sections.js       # Content section manager
│   │   │
│   │   └── utils/
│   │       ├── storage.js        # localStorage wrapper
│   │       ├── keyboard.js       # Keyboard shortcuts
│   │       └── analytics.js      # Mixpanel wrapper
│   │
│   └── assets/
│       ├── models/
│       │   ├── key-s.glb         # Individual key models
│       │   ├── key-t.glb
│       │   ├── key-u.glb
│       │   ├── key-d.glb
│       │   ├── key-i.glb
│       │   ├── key-o.glb
│       │   ├── key-y.glb
│       │   └── key-p.glb
│       │
│       ├── textures/
│       │   └── env-map.hdr       # Environment map for reflections
│       │
│       ├── audio/
│       │   ├── typing-loop.mp3   # Background ASMR
│       │   └── key-press.mp3     # Individual key sound
│       │
│       └── fonts/
│           └── space-mono.woff2  # Monospace font
│
├── public/
│   ├── favicon.ico
│   └── og-image.png              # Social sharing image
│
└── docs/
    ├── TECH_STACK.md             # This file
    ├── PERFORMANCE.md            # Performance guidelines
    └── PROMPT.md                 # Claude Code instructions
```

---

## Design System

### Color Palette

#### Dark Theme (Default)

```css
:root {
  /* Backgrounds */
  --bg-primary: #0a0a0f; /* Main background */
  --bg-secondary: #12121a; /* Cards, elevated surfaces */
  --bg-tertiary: #1a1a24; /* Hover states */

  /* Text */
  --text-primary: #f4f4f5; /* Main text */
  --text-secondary: #a1a1aa; /* Muted text */
  --text-tertiary: #71717a; /* Disabled, hints */

  /* Accent */
  --accent: #0080fe; /* Azure - primary accent */
  --accent-hover: #0066cc; /* Darker on hover */
  --accent-subtle: rgba(0, 128, 254, 0.1); /* Backgrounds */

  /* Borders */
  --border-primary: #2a2a3a;
  --border-secondary: #3a3a4a;

  /* Metallic (for 3D keys reference) */
  --metal-base: #2a2a35;
  --metal-highlight: #4a4a55;
  --metal-shine: #6a6a75;
}
```

#### Light Theme

```css
[data-theme="light"] {
  /* Backgrounds */
  --bg-primary: #fafafa;
  --bg-secondary: #ffffff;
  --bg-tertiary: #f4f4f5;

  /* Text */
  --text-primary: #18181b;
  --text-secondary: #52525b;
  --text-tertiary: #a1a1aa;

  /* Accent - same azure */
  --accent: #0080fe;
  --accent-hover: #0066cc;
  --accent-subtle: rgba(0, 128, 254, 0.08);

  /* Borders */
  --border-primary: #e4e4e7;
  --border-secondary: #d4d4d8;
}
```

### Typography

```css
:root {
  /* Font Family */
  --font-mono: "Space Mono", "Roboto Mono", "SF Mono", monospace;

  /* Font Sizes */
  --text-xs: 0.75rem; /* 12px */
  --text-sm: 0.875rem; /* 14px */
  --text-base: 1rem; /* 16px */
  --text-lg: 1.125rem; /* 18px */
  --text-xl: 1.25rem; /* 20px */
  --text-2xl: 1.5rem; /* 24px */
  --text-3xl: 2rem; /* 32px */
  --text-4xl: 2.5rem; /* 40px */

  /* Line Heights */
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;

  /* Letter Spacing */
  --tracking-tight: -0.02em;
  --tracking-normal: 0;
  --tracking-wide: 0.05em;
  --tracking-wider: 0.1em;
}
```

### Spacing Scale

```css
:root {
  --space-1: 0.25rem; /* 4px */
  --space-2: 0.5rem; /* 8px */
  --space-3: 0.75rem; /* 12px */
  --space-4: 1rem; /* 16px */
  --space-5: 1.25rem; /* 20px */
  --space-6: 1.5rem; /* 24px */
  --space-8: 2rem; /* 32px */
  --space-10: 2.5rem; /* 40px */
  --space-12: 3rem; /* 48px */
  --space-16: 4rem; /* 64px */
  --space-20: 5rem; /* 80px */
}
```

### Animation Timing

```css
:root {
  /* Durations */
  --duration-instant: 50ms;
  --duration-fast: 150ms;
  --duration-normal: 300ms;
  --duration-slow: 500ms;
  --duration-slower: 700ms;

  /* Easings */
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);

  /* 3D specific */
  --ease-key-press: cubic-bezier(0.25, 0.46, 0.45, 0.94);
  --ease-key-release: cubic-bezier(0.34, 1.2, 0.64, 1);
}
```

---

## 3D Specification

### Scene Setup

```javascript
// Camera
const camera = new THREE.PerspectiveCamera(
  45, // FOV
  window.innerWidth / window.innerHeight, // Aspect
  0.1, // Near
  100, // Far
);
camera.position.set(0, 2, 8); // Positioned to see all keys

// Renderer
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true, // Transparent background
  powerPreference: "high-performance",
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
```

### Key Model Requirements

| Property  | Specification                       |
| --------- | ----------------------------------- |
| Format    | GLTF 2.0 / GLB                      |
| Polygons  | < 2,000 per key                     |
| Textures  | 512x512 max                         |
| Materials | PBR (metallic-roughness)            |
| Origin    | Center-bottom (for press animation) |
| Scale     | 1 unit = 1 cm                       |
| Naming    | `Key_[Letter]`                      |

### Material Setup (PBR Metallic)

```javascript
const keyMaterial = new THREE.MeshStandardMaterial({
  color: 0x2a2a35,
  metalness: 0.9,
  roughness: 0.3,
  envMapIntensity: 1.5,
});
```

### Key Layout (World Coordinates)

```
Row 1:  S(0,0)   T(1.2,0)   U(2.4,0)   D(3.6,0)   I(4.8,0)   O(6.0,0)

Row 2:                      T(2.4,-1.2)  Y(3.6,-1.2)

Row 3:                      P(2.4,-2.4)  O(3.6,-2.4)
```

Initial state: Only T, Y, P, O visible (Row 2 & 3)

### Key Press Animation

```javascript
// Press down
gsap.to(key.position, {
  y: key.position.y - 0.15,
  duration: 0.08,
  ease: "power2.out",
});

// Release
gsap.to(key.position, {
  y: originalY,
  duration: 0.12,
  ease: "back.out(3)",
});
```

### Environment Map

- Format: HDR or EXR (converted to PMREM)
- Resolution: 1024x512 minimum
- Style: Studio lighting (soft boxes, neutral)
- Purpose: Metallic reflections on keys

---

## Audio Specification

### Audio Files Required

| File              | Format      | Duration    | Purpose              |
| ----------------- | ----------- | ----------- | -------------------- |
| `typing-loop.mp3` | MP3 128kbps | 30-60s loop | Background ASMR      |
| `key-press.mp3`   | MP3 128kbps | 100-200ms   | Individual key sound |

### Web Audio Setup

```javascript
class AudioManager {
  constructor() {
    this.context = null;
    this.masterGain = null;
    this.sounds = {};
    this.enabled = true;
  }

  async init() {
    this.context = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.context.createGain();
    this.masterGain.connect(this.context.destination);
    this.masterGain.gain.value = 0.7; // Master volume
  }

  // Called on first user interaction
  resume() {
    if (this.context.state === "suspended") {
      this.context.resume();
    }
  }
}
```

### Sound Behavior

| Event        | Sound         | Behavior                                 |
| ------------ | ------------- | ---------------------------------------- |
| Intro starts | `typing-loop` | Fade in over 1s, loop continuously       |
| Key hover    | -             | No sound                                 |
| Key press    | `key-press`   | Play immediately, slight pitch variation |
| Nav click    | `key-press`   | Same sound, lower volume                 |
| Sound off    | All           | Fade out over 300ms                      |

---

## Interaction Flow

### State Machine

```
┌─────────────────────────────────────────────────────────────┐
│                         STATES                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   [INITIAL]                                                 │
│       │                                                     │
│       │ Page loaded                                         │
│       ▼                                                     │
│   [READY] ──────── 4 keys (TYPO) visible, waiting          │
│       │                                                     │
│       │ User clicks key OR types T/Y/P/O                   │
│       ▼                                                     │
│   [INTRO_PLAYING] ── Audio starts, STUDIO reveals          │
│       │                                                     │
│       │ Animation complete (~3s)                           │
│       ▼                                                     │
│   [MAIN] ─────────── Full site active, nav visible         │
│       │                                                     │
│       │ Nav item clicked                                    │
│       ▼                                                     │
│   [TRANSITIONING] ── Content animates                      │
│       │                                                     │
│       │ Animation complete                                  │
│       ▼                                                     │
│   [MAIN] ─────────── Back to main state                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Intro Sequence Timeline

```
0.0s  ─┬─ User triggers (click/keypress)
       │   └─ Audio context resumed
       │   └─ Typing loop fades in
       │
0.2s  ─┼─ Clicked key animates (press down)
       │
0.4s  ─┼─ Key releases
       │
0.6s  ─┼─ STUDIO keys fade in from left
       │   └─ S appears
0.7s  ─┼─   └─ T appears
0.8s  ─┼─     └─ U appears
0.9s  ─┼─       └─ D appears
1.0s  ─┼─         └─ I appears
1.1s  ─┼─           └─ O appears
       │
1.5s  ─┼─ All keys now visible
       │   └─ Brief pause for impact
       │
2.0s  ─┼─ Entire key arrangement moves right
       │   └─ Duration: 800ms
       │   └─ Easing: ease-out
       │
2.8s  ─┼─ Navigation sidebar fades in from left
       │   └─ Items stagger in (100ms each)
       │
3.5s  ─┴─ INTRO COMPLETE
           └─ State → MAIN
           └─ Full interactivity enabled
```

---

## Keyboard Shortcuts

| Key                | Action              | Context              |
| ------------------ | ------------------- | -------------------- |
| `T`                | Toggle theme        | Always (after intro) |
| `S`                | Toggle sound        | Always (after intro) |
| `1-5`              | Navigate to section | Main state           |
| `T`, `Y`, `P`, `O` | Trigger intro       | Ready state only     |
| `Esc`              | Close any overlay   | When overlay open    |

---

## LocalStorage Keys

| Key                      | Type                  | Default  | Purpose                    |
| ------------------------ | --------------------- | -------- | -------------------------- |
| `studio-typo-theme`      | `'dark'` \| `'light'` | `'dark'` | Theme preference           |
| `studio-typo-sound`      | `boolean`             | `true`   | Sound enabled              |
| `studio-typo-intro-seen` | `boolean`             | `false`  | Skip intro option (future) |

---

## Browser Support

| Browser       | Version | Support Level |
| ------------- | ------- | ------------- |
| Chrome        | 90+     | Full          |
| Firefox       | 90+     | Full          |
| Safari        | 15+     | Full          |
| Edge          | 90+     | Full          |
| Mobile Chrome | 90+     | Full          |
| Mobile Safari | 15+     | Full          |
| IE            | Any     | Not supported |

### Required Features

- WebGL 2.0
- Web Audio API
- CSS Custom Properties
- ES2020+ (async/await, optional chaining)
- Pointer Events

---

## Deployment

### Build Command

```bash
npm run build
```

### Output

```
dist/
├── index.html          # Minified HTML
├── assets/
│   ├── main.[hash].js  # Bundled JS (~180KB gzipped)
│   ├── main.[hash].css # Bundled CSS (~8KB gzipped)
│   ├── models/         # Copied GLTF files
│   ├── audio/          # Copied audio files
│   └── fonts/          # Copied font files
```

### Hosting Requirements

- Static file hosting
- HTTPS (required for Web Audio)
- Proper MIME types for .glb, .hdr
- Gzip/Brotli compression

### Recommended Hosts

1. **Vercel** - Zero config, global CDN
2. **Netlify** - Zero config, global CDN
3. **GitHub Pages** - Free, simple
4. **Cloudflare Pages** - Fast, free tier

---

## Size Budget

| Category   | Budget      | Notes                      |
| ---------- | ----------- | -------------------------- |
| JavaScript | < 200KB     | Gzipped, includes Three.js |
| CSS        | < 15KB      | Gzipped                    |
| HTML       | < 5KB       | Gzipped                    |
| 3D Models  | < 500KB     | All keys combined          |
| Textures   | < 200KB     | Environment map            |
| Audio      | < 500KB     | All audio files            |
| Fonts      | < 50KB      | Single weight              |
| **Total**  | **< 1.5MB** | First load                 |

---

## Performance Targets

| Metric                   | Target  | Measurement     |
| ------------------------ | ------- | --------------- |
| First Contentful Paint   | < 1.5s  | Lighthouse      |
| Largest Contentful Paint | < 2.5s  | Lighthouse      |
| Time to Interactive      | < 3.5s  | Lighthouse      |
| Total Blocking Time      | < 200ms | Lighthouse      |
| Cumulative Layout Shift  | < 0.1   | Lighthouse      |
| Frame Rate               | 60fps   | Chrome DevTools |
| Memory Usage             | < 150MB | Chrome DevTools |

/**
 * ASCII Art Animations - Export all effects
 */

// Base class
import { AsciiArt } from "./AsciiArt.js";

// Basic effects
import { MatrixReveal } from "./MatrixReveal.js";
import { TypewriterArt } from "./TypewriterArt.js";
import { GlitchScramble } from "./GlitchScramble.js";
import { WaveDistortion } from "./WaveDistortion.js";
import { ParticleReform } from "./ParticleReform.js";

// Advanced effects
import { ChromaticSplit } from "./ChromaticSplit.js";
import { MagneticCursor } from "./MagneticCursor.js";
import { HolographicGlitch } from "./HolographicGlitch.js";
import { LiquidMorph } from "./LiquidMorph.js";
import { Perspective3D } from "./Perspective3D.js";

// Re-export all classes
export {
  AsciiArt,
  // Basic
  MatrixReveal,
  TypewriterArt,
  GlitchScramble,
  WaveDistortion,
  ParticleReform,
  // Advanced
  ChromaticSplit,
  MagneticCursor,
  HolographicGlitch,
  LiquidMorph,
  Perspective3D,
};

// Effect map for easy instantiation
export const EFFECTS = {
  // Basic effects
  matrix: MatrixReveal,
  typewriter: TypewriterArt,
  glitch: GlitchScramble,
  wave: WaveDistortion,
  particle: ParticleReform,
  // Advanced effects
  chromatic: ChromaticSplit,
  magnetic: MagneticCursor,
  holographic: HolographicGlitch,
  liquid: LiquidMorph,
  perspective: Perspective3D,
};

/**
 * Initialize ASCII art on an element
 */
export function initAsciiArt(container, asciiString, effectType = "glitch") {
  const EffectClass = EFFECTS[effectType];
  if (!EffectClass) {
    console.warn(`Unknown ASCII effect: ${effectType}`);
    return null;
  }
  return new EffectClass(container, asciiString);
}

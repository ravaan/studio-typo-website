/**
 * Simplex Noise - Fast, high-quality noise for organic animations
 * Based on Stefan Gustavson's implementation
 */

// Permutation table
const perm = new Uint8Array(512);
const gradP = new Array(512);

// Gradient vectors for 2D
const grad3 = [
  [1, 1, 0],
  [-1, 1, 0],
  [1, -1, 0],
  [-1, -1, 0],
  [1, 0, 1],
  [-1, 0, 1],
  [1, 0, -1],
  [-1, 0, -1],
  [0, 1, 1],
  [0, -1, 1],
  [0, 1, -1],
  [0, -1, -1],
];

// Skewing and unskewing factors for 2D
const F2 = 0.5 * (Math.sqrt(3) - 1);
const G2 = (3 - Math.sqrt(3)) / 6;

// Skewing and unskewing factors for 3D
const F3 = 1 / 3;
const G3 = 1 / 6;

/**
 * Seed the noise function
 */
export function seed(value = Math.random() * 65536) {
  const p = new Uint8Array(256);

  // Initialize with values 0-255
  for (let i = 0; i < 256; i++) {
    p[i] = i;
  }

  // Shuffle using seed
  let n = value;
  for (let i = 255; i > 0; i--) {
    n = (n * 16807) % 2147483647;
    const j = n % (i + 1);
    [p[i], p[j]] = [p[j], p[i]];
  }

  // Extend to 512 values
  for (let i = 0; i < 512; i++) {
    perm[i] = p[i & 255];
    gradP[i] = grad3[perm[i] % 12];
  }
}

// Initialize with random seed
seed();

/**
 * 2D Simplex Noise
 */
export function noise2D(x, y) {
  let n0, n1, n2;

  // Skew input space
  const s = (x + y) * F2;
  const i = Math.floor(x + s);
  const j = Math.floor(y + s);

  // Unskew back to simplex cell origin
  const t = (i + j) * G2;
  const X0 = i - t;
  const Y0 = j - t;
  const x0 = x - X0;
  const y0 = y - Y0;

  // Determine which simplex we're in
  let i1, j1;
  if (x0 > y0) {
    i1 = 1;
    j1 = 0;
  } else {
    i1 = 0;
    j1 = 1;
  }

  // Offsets for corners
  const x1 = x0 - i1 + G2;
  const y1 = y0 - j1 + G2;
  const x2 = x0 - 1 + 2 * G2;
  const y2 = y0 - 1 + 2 * G2;

  // Wrap indices
  const ii = i & 255;
  const jj = j & 255;

  // Calculate contributions from corners
  let t0 = 0.5 - x0 * x0 - y0 * y0;
  if (t0 < 0) {
    n0 = 0;
  } else {
    t0 *= t0;
    const g0 = gradP[ii + perm[jj]];
    n0 = t0 * t0 * (g0[0] * x0 + g0[1] * y0);
  }

  let t1 = 0.5 - x1 * x1 - y1 * y1;
  if (t1 < 0) {
    n1 = 0;
  } else {
    t1 *= t1;
    const g1 = gradP[ii + i1 + perm[jj + j1]];
    n1 = t1 * t1 * (g1[0] * x1 + g1[1] * y1);
  }

  let t2 = 0.5 - x2 * x2 - y2 * y2;
  if (t2 < 0) {
    n2 = 0;
  } else {
    t2 *= t2;
    const g2 = gradP[ii + 1 + perm[jj + 1]];
    n2 = t2 * t2 * (g2[0] * x2 + g2[1] * y2);
  }

  // Return scaled to [-1, 1]
  return 70 * (n0 + n1 + n2);
}

/**
 * 3D Simplex Noise
 */
export function noise3D(x, y, z) {
  let n0, n1, n2, n3;

  // Skew input space
  const s = (x + y + z) * F3;
  const i = Math.floor(x + s);
  const j = Math.floor(y + s);
  const k = Math.floor(z + s);

  // Unskew back
  const t = (i + j + k) * G3;
  const X0 = i - t;
  const Y0 = j - t;
  const Z0 = k - t;
  const x0 = x - X0;
  const y0 = y - Y0;
  const z0 = z - Z0;

  // Determine simplex
  let i1, j1, k1, i2, j2, k2;
  if (x0 >= y0) {
    if (y0 >= z0) {
      i1 = 1;
      j1 = 0;
      k1 = 0;
      i2 = 1;
      j2 = 1;
      k2 = 0;
    } else if (x0 >= z0) {
      i1 = 1;
      j1 = 0;
      k1 = 0;
      i2 = 1;
      j2 = 0;
      k2 = 1;
    } else {
      i1 = 0;
      j1 = 0;
      k1 = 1;
      i2 = 1;
      j2 = 0;
      k2 = 1;
    }
  } else {
    if (y0 < z0) {
      i1 = 0;
      j1 = 0;
      k1 = 1;
      i2 = 0;
      j2 = 1;
      k2 = 1;
    } else if (x0 < z0) {
      i1 = 0;
      j1 = 1;
      k1 = 0;
      i2 = 0;
      j2 = 1;
      k2 = 1;
    } else {
      i1 = 0;
      j1 = 1;
      k1 = 0;
      i2 = 1;
      j2 = 1;
      k2 = 0;
    }
  }

  const x1 = x0 - i1 + G3;
  const y1 = y0 - j1 + G3;
  const z1 = z0 - k1 + G3;
  const x2 = x0 - i2 + 2 * G3;
  const y2 = y0 - j2 + 2 * G3;
  const z2 = z0 - k2 + 2 * G3;
  const x3 = x0 - 1 + 3 * G3;
  const y3 = y0 - 1 + 3 * G3;
  const z3 = z0 - 1 + 3 * G3;

  const ii = i & 255;
  const jj = j & 255;
  const kk = k & 255;

  let t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
  if (t0 < 0) {
    n0 = 0;
  } else {
    t0 *= t0;
    const g0 = gradP[ii + perm[jj + perm[kk]]];
    n0 = t0 * t0 * (g0[0] * x0 + g0[1] * y0 + g0[2] * z0);
  }

  let t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
  if (t1 < 0) {
    n1 = 0;
  } else {
    t1 *= t1;
    const g1 = gradP[ii + i1 + perm[jj + j1 + perm[kk + k1]]];
    n1 = t1 * t1 * (g1[0] * x1 + g1[1] * y1 + g1[2] * z1);
  }

  let t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
  if (t2 < 0) {
    n2 = 0;
  } else {
    t2 *= t2;
    const g2 = gradP[ii + i2 + perm[jj + j2 + perm[kk + k2]]];
    n2 = t2 * t2 * (g2[0] * x2 + g2[1] * y2 + g2[2] * z2);
  }

  let t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
  if (t3 < 0) {
    n3 = 0;
  } else {
    t3 *= t3;
    const g3 = gradP[ii + 1 + perm[jj + 1 + perm[kk + 1]]];
    n3 = t3 * t3 * (g3[0] * x3 + g3[1] * y3 + g3[2] * z3);
  }

  // Return scaled to [-1, 1]
  return 32 * (n0 + n1 + n2 + n3);
}

/**
 * Fractal Brownian Motion - layered noise for more detail
 */
export function fbm(x, y, octaves = 4, persistence = 0.5, lacunarity = 2) {
  let total = 0;
  let amplitude = 1;
  let frequency = 1;
  let maxValue = 0;

  for (let i = 0; i < octaves; i++) {
    total += noise2D(x * frequency, y * frequency) * amplitude;
    maxValue += amplitude;
    amplitude *= persistence;
    frequency *= lacunarity;
  }

  return total / maxValue;
}

export default { seed, noise2D, noise3D, fbm };

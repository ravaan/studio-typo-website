/**
 * Stable Fluid Solver
 * Based on Jos Stam's "Stable Fluids" paper
 * Real-Time Fluid Dynamics for Games (GDC 2003)
 */

export class FluidSolver {
  constructor(size, diffusion = 0.0001, viscosity = 0.0000001) {
    this.size = size;
    this.dt = 0.2;
    this.diff = diffusion;
    this.visc = viscosity;

    const n = size * size;

    // Density field (what we see)
    this.density = new Float32Array(n);
    this.densityPrev = new Float32Array(n);

    // Velocity field
    this.vx = new Float32Array(n);
    this.vy = new Float32Array(n);
    this.vxPrev = new Float32Array(n);
    this.vyPrev = new Float32Array(n);
  }

  /**
   * Add density at a position
   */
  addDensity(x, y, amount) {
    const idx = this.idx(Math.floor(x), Math.floor(y));
    if (idx >= 0 && idx < this.density.length) {
      this.density[idx] += amount;
    }
  }

  /**
   * Add velocity at a position
   */
  addVelocity(x, y, amountX, amountY) {
    const idx = this.idx(Math.floor(x), Math.floor(y));
    if (idx >= 0 && idx < this.vx.length) {
      this.vx[idx] += amountX;
      this.vy[idx] += amountY;
    }
  }

  /**
   * Step the simulation forward
   */
  step() {
    const N = this.size;

    // Velocity step
    this.diffuse(1, this.vxPrev, this.vx, this.visc);
    this.diffuse(2, this.vyPrev, this.vy, this.visc);

    this.project(this.vxPrev, this.vyPrev, this.vx, this.vy);

    this.advect(1, this.vx, this.vxPrev, this.vxPrev, this.vyPrev);
    this.advect(2, this.vy, this.vyPrev, this.vxPrev, this.vyPrev);

    this.project(this.vx, this.vy, this.vxPrev, this.vyPrev);

    // Density step
    this.diffuse(0, this.densityPrev, this.density, this.diff);
    this.advect(0, this.density, this.densityPrev, this.vx, this.vy);
  }

  /**
   * Get density value at position
   */
  getDensityAt(x, y) {
    return this.density[this.idx(x, y)] || 0;
  }

  /**
   * Get velocity at position
   */
  getVelocityAt(x, y) {
    const idx = this.idx(x, y);
    return {
      x: this.vx[idx] || 0,
      y: this.vy[idx] || 0,
    };
  }

  /**
   * Get full density array
   */
  getDensity() {
    return this.density;
  }

  /**
   * Clear all fields
   */
  clear() {
    this.density.fill(0);
    this.densityPrev.fill(0);
    this.vx.fill(0);
    this.vy.fill(0);
    this.vxPrev.fill(0);
    this.vyPrev.fill(0);
  }

  // --- Private methods ---

  idx(x, y) {
    x = Math.max(0, Math.min(this.size - 1, x));
    y = Math.max(0, Math.min(this.size - 1, y));
    return x + y * this.size;
  }

  diffuse(b, x, x0, diff) {
    const N = this.size;
    const a = this.dt * diff * (N - 2) * (N - 2);
    this.linSolve(b, x, x0, a, 1 + 6 * a);
  }

  linSolve(b, x, x0, a, c) {
    const N = this.size;
    const cRecip = 1.0 / c;

    for (let k = 0; k < 4; k++) {
      for (let j = 1; j < N - 1; j++) {
        for (let i = 1; i < N - 1; i++) {
          x[this.idx(i, j)] =
            (x0[this.idx(i, j)] +
              a *
                (x[this.idx(i + 1, j)] +
                  x[this.idx(i - 1, j)] +
                  x[this.idx(i, j + 1)] +
                  x[this.idx(i, j - 1)])) *
            cRecip;
        }
      }
      this.setBnd(b, x);
    }
  }

  project(vx, vy, p, div) {
    const N = this.size;
    const h = 1.0 / N;

    for (let j = 1; j < N - 1; j++) {
      for (let i = 1; i < N - 1; i++) {
        div[this.idx(i, j)] =
          -0.5 *
          h *
          (vx[this.idx(i + 1, j)] -
            vx[this.idx(i - 1, j)] +
            vy[this.idx(i, j + 1)] -
            vy[this.idx(i, j - 1)]);
        p[this.idx(i, j)] = 0;
      }
    }

    this.setBnd(0, div);
    this.setBnd(0, p);
    this.linSolve(0, p, div, 1, 6);

    for (let j = 1; j < N - 1; j++) {
      for (let i = 1; i < N - 1; i++) {
        vx[this.idx(i, j)] -=
          0.5 * (p[this.idx(i + 1, j)] - p[this.idx(i - 1, j)]) * N;
        vy[this.idx(i, j)] -=
          0.5 * (p[this.idx(i, j + 1)] - p[this.idx(i, j - 1)]) * N;
      }
    }

    this.setBnd(1, vx);
    this.setBnd(2, vy);
  }

  advect(b, d, d0, vx, vy) {
    const N = this.size;
    const dt0 = this.dt * (N - 2);

    for (let j = 1; j < N - 1; j++) {
      for (let i = 1; i < N - 1; i++) {
        let x = i - dt0 * vx[this.idx(i, j)];
        let y = j - dt0 * vy[this.idx(i, j)];

        x = Math.max(0.5, Math.min(N - 1.5, x));
        y = Math.max(0.5, Math.min(N - 1.5, y));

        const i0 = Math.floor(x);
        const i1 = i0 + 1;
        const j0 = Math.floor(y);
        const j1 = j0 + 1;

        const s1 = x - i0;
        const s0 = 1 - s1;
        const t1 = y - j0;
        const t0 = 1 - t1;

        d[this.idx(i, j)] =
          s0 * (t0 * d0[this.idx(i0, j0)] + t1 * d0[this.idx(i0, j1)]) +
          s1 * (t0 * d0[this.idx(i1, j0)] + t1 * d0[this.idx(i1, j1)]);
      }
    }

    this.setBnd(b, d);
  }

  setBnd(b, x) {
    const N = this.size;

    for (let i = 1; i < N - 1; i++) {
      x[this.idx(i, 0)] = b === 2 ? -x[this.idx(i, 1)] : x[this.idx(i, 1)];
      x[this.idx(i, N - 1)] =
        b === 2 ? -x[this.idx(i, N - 2)] : x[this.idx(i, N - 2)];
    }

    for (let j = 1; j < N - 1; j++) {
      x[this.idx(0, j)] = b === 1 ? -x[this.idx(1, j)] : x[this.idx(1, j)];
      x[this.idx(N - 1, j)] =
        b === 1 ? -x[this.idx(N - 2, j)] : x[this.idx(N - 2, j)];
    }

    x[this.idx(0, 0)] = 0.5 * (x[this.idx(1, 0)] + x[this.idx(0, 1)]);
    x[this.idx(0, N - 1)] =
      0.5 * (x[this.idx(1, N - 1)] + x[this.idx(0, N - 2)]);
    x[this.idx(N - 1, 0)] =
      0.5 * (x[this.idx(N - 2, 0)] + x[this.idx(N - 1, 1)]);
    x[this.idx(N - 1, N - 1)] =
      0.5 * (x[this.idx(N - 2, N - 1)] + x[this.idx(N - 1, N - 2)]);
  }
}

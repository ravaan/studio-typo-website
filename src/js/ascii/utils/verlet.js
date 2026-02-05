/**
 * Verlet Integration Physics Engine
 * Position-based dynamics for soft body simulation
 */

export class Particle {
  constructor(x, y, pinned = false) {
    this.x = x;
    this.y = y;
    this.oldX = x;
    this.oldY = y;
    this.pinned = pinned;
    this.mass = 1;
    this.char = "*";
  }

  /**
   * Apply Verlet integration
   */
  update(friction = 0.99, gravity = 0.5) {
    if (this.pinned) return;

    const vx = (this.x - this.oldX) * friction;
    const vy = (this.y - this.oldY) * friction;

    this.oldX = this.x;
    this.oldY = this.y;

    this.x += vx;
    this.y += vy + gravity;
  }

  /**
   * Apply external force
   */
  applyForce(fx, fy) {
    if (this.pinned) return;
    this.x += fx / this.mass;
    this.y += fy / this.mass;
  }

  /**
   * Constrain to bounds
   */
  constrain(minX, minY, maxX, maxY, bounce = 0.8) {
    if (this.pinned) return;

    const vx = this.x - this.oldX;
    const vy = this.y - this.oldY;

    if (this.x < minX) {
      this.x = minX;
      this.oldX = this.x + vx * bounce;
    }
    if (this.x > maxX) {
      this.x = maxX;
      this.oldX = this.x + vx * bounce;
    }
    if (this.y < minY) {
      this.y = minY;
      this.oldY = this.y + vy * bounce;
    }
    if (this.y > maxY) {
      this.y = maxY;
      this.oldY = this.y + vy * bounce;
    }
  }
}

export class Constraint {
  constructor(p1, p2, stiffness = 1) {
    this.p1 = p1;
    this.p2 = p2;
    this.length = this.getDistance();
    this.stiffness = stiffness;
  }

  getDistance() {
    const dx = this.p2.x - this.p1.x;
    const dy = this.p2.y - this.p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Satisfy the constraint (move particles to correct distance)
   */
  solve() {
    const dx = this.p2.x - this.p1.x;
    const dy = this.p2.y - this.p1.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist === 0) return;

    const diff = ((this.length - dist) / dist) * this.stiffness;
    const offsetX = dx * diff * 0.5;
    const offsetY = dy * diff * 0.5;

    if (!this.p1.pinned) {
      this.p1.x -= offsetX;
      this.p1.y -= offsetY;
    }
    if (!this.p2.pinned) {
      this.p2.x += offsetX;
      this.p2.y += offsetY;
    }
  }
}

export class VerletSystem {
  constructor(options = {}) {
    this.particles = [];
    this.constraints = [];

    this.gravity = options.gravity ?? 0.5;
    this.friction = options.friction ?? 0.99;
    this.bounce = options.bounce ?? 0.8;
    this.iterations = options.iterations ?? 3;

    this.bounds = options.bounds || null;
  }

  /**
   * Add a particle to the system
   */
  addParticle(x, y, pinned = false) {
    const particle = new Particle(x, y, pinned);
    this.particles.push(particle);
    return particle;
  }

  /**
   * Add a constraint between two particles
   */
  addConstraint(p1, p2, stiffness = 1) {
    const constraint = new Constraint(p1, p2, stiffness);
    this.constraints.push(constraint);
    return constraint;
  }

  /**
   * Apply force to all particles
   */
  applyForce(fx, fy) {
    for (const p of this.particles) {
      p.applyForce(fx, fy);
    }
  }

  /**
   * Apply force to a specific particle
   */
  applyForceToParticle(index, fx, fy) {
    if (this.particles[index]) {
      this.particles[index].applyForce(fx, fy);
    }
  }

  /**
   * Apply radial force from a point
   */
  applyRadialForce(x, y, radius, strength) {
    for (const p of this.particles) {
      if (p.pinned) continue;

      const dx = p.x - x;
      const dy = p.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < radius && dist > 0) {
        const force = (1 - dist / radius) * strength;
        p.applyForce((dx / dist) * force, (dy / dist) * force);
      }
    }
  }

  /**
   * Step the simulation forward
   */
  step() {
    // Update particles
    for (const p of this.particles) {
      p.update(this.friction, this.gravity);
    }

    // Solve constraints multiple times for stability
    for (let i = 0; i < this.iterations; i++) {
      for (const c of this.constraints) {
        c.solve();
      }
    }

    // Apply bounds
    if (this.bounds) {
      for (const p of this.particles) {
        p.constrain(
          this.bounds.minX,
          this.bounds.minY,
          this.bounds.maxX,
          this.bounds.maxY,
          this.bounce,
        );
      }
    }
  }

  /**
   * Set bounds for the system
   */
  setBounds(minX, minY, maxX, maxY) {
    this.bounds = { minX, minY, maxX, maxY };
  }

  /**
   * Get all particles
   */
  getParticles() {
    return this.particles;
  }

  /**
   * Get all constraints
   */
  getConstraints() {
    return this.constraints;
  }

  /**
   * Clear the system
   */
  clear() {
    this.particles = [];
    this.constraints = [];
  }

  /**
   * Create a chain of particles
   */
  createChain(
    startX,
    startY,
    length,
    segments,
    pinStart = true,
    pinEnd = false,
  ) {
    const particles = [];
    const segmentLength = length / segments;

    for (let i = 0; i <= segments; i++) {
      const pinned = (i === 0 && pinStart) || (i === segments && pinEnd);
      const p = this.addParticle(startX + i * segmentLength, startY, pinned);
      particles.push(p);

      if (i > 0) {
        this.addConstraint(particles[i - 1], p);
      }
    }

    return particles;
  }

  /**
   * Create a grid of particles (cloth-like)
   */
  createGrid(startX, startY, cols, rows, spacing, pinTop = true) {
    const grid = [];

    for (let y = 0; y < rows; y++) {
      const row = [];
      for (let x = 0; x < cols; x++) {
        const pinned = pinTop && y === 0;
        const p = this.addParticle(
          startX + x * spacing,
          startY + y * spacing,
          pinned,
        );
        row.push(p);

        // Horizontal constraint
        if (x > 0) {
          this.addConstraint(row[x - 1], p);
        }

        // Vertical constraint
        if (y > 0) {
          this.addConstraint(grid[y - 1][x], p);
        }
      }
      grid.push(row);
    }

    return grid;
  }
}

/**
 * Create text from particles
 * Returns an array of particles forming the text
 */
export function createTextParticles(
  text,
  startX,
  startY,
  charWidth,
  charHeight,
  system,
) {
  const particles = [];
  const chars = text.split("");

  let x = startX;
  let y = startY;

  for (const char of chars) {
    if (char === "\n") {
      x = startX;
      y += charHeight;
      continue;
    }

    if (char === " ") {
      x += charWidth;
      continue;
    }

    const p = system.addParticle(x, y);
    p.char = char;
    p.originalX = x;
    p.originalY = y;
    particles.push(p);

    x += charWidth;
  }

  return particles;
}

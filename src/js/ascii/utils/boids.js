/**
 * Boids Flocking Simulation
 * Based on Craig Reynolds' "Flocks, Herds, and Schools" algorithm
 */

export class Boid {
  constructor(x, y, maxSpeed = 4, maxForce = 0.1) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 2;
    this.vy = (Math.random() - 0.5) * 2;
    this.ax = 0;
    this.ay = 0;
    this.maxSpeed = maxSpeed;
    this.maxForce = maxForce;
  }

  /**
   * Apply a force to the boid
   */
  applyForce(fx, fy) {
    this.ax += fx;
    this.ay += fy;
  }

  /**
   * Update position based on velocity
   */
  update() {
    this.vx += this.ax;
    this.vy += this.ay;

    // Limit speed
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (speed > this.maxSpeed) {
      this.vx = (this.vx / speed) * this.maxSpeed;
      this.vy = (this.vy / speed) * this.maxSpeed;
    }

    this.x += this.vx;
    this.y += this.vy;

    // Reset acceleration
    this.ax = 0;
    this.ay = 0;
  }

  /**
   * Wrap around edges
   */
  edges(width, height) {
    if (this.x > width) this.x = 0;
    if (this.x < 0) this.x = width;
    if (this.y > height) this.y = 0;
    if (this.y < 0) this.y = height;
  }

  /**
   * Get direction character based on velocity
   */
  getDirectionChar() {
    const angle = Math.atan2(this.vy, this.vx);
    const deg = ((angle * 180) / Math.PI + 360) % 360;

    if (deg < 22.5 || deg >= 337.5) return ">";
    if (deg < 67.5) return "\\";
    if (deg < 112.5) return "v";
    if (deg < 157.5) return "/";
    if (deg < 202.5) return "<";
    if (deg < 247.5) return "\\";
    if (deg < 292.5) return "^";
    return "/";
  }
}

export class Flock {
  constructor(count, width, height, options = {}) {
    this.width = width;
    this.height = height;
    this.boids = [];

    // Behavior weights
    this.separationWeight = options.separationWeight || 1.5;
    this.alignmentWeight = options.alignmentWeight || 1.0;
    this.cohesionWeight = options.cohesionWeight || 1.0;

    // Perception radii
    this.perceptionRadius = options.perceptionRadius || 50;
    this.separationRadius = options.separationRadius || 25;

    // Initialize boids
    for (let i = 0; i < count; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      this.boids.push(new Boid(x, y, options.maxSpeed, options.maxForce));
    }

    // Trail for visual effect
    this.trails = [];
    this.maxTrailLength = options.maxTrailLength || 5;
  }

  /**
   * Update all boids
   * @param {Object|null} predator - Optional predator position {x, y}
   * @param {Object|null} attractor - Optional attractor position {x, y}
   */
  update(predator = null, attractor = null) {
    // Store trail positions
    this.trails = this.boids.map((b) => ({ x: b.x, y: b.y, char: "." }));

    for (const boid of this.boids) {
      // Calculate flocking forces
      const sep = this.separation(boid);
      const ali = this.alignment(boid);
      const coh = this.cohesion(boid);

      // Apply weights
      boid.applyForce(
        sep.x * this.separationWeight,
        sep.y * this.separationWeight,
      );
      boid.applyForce(
        ali.x * this.alignmentWeight,
        ali.y * this.alignmentWeight,
      );
      boid.applyForce(coh.x * this.cohesionWeight, coh.y * this.cohesionWeight);

      // Flee from predator
      if (predator) {
        const flee = this.flee(boid, predator, 100);
        boid.applyForce(flee.x * 2, flee.y * 2);
      }

      // Seek attractor
      if (attractor) {
        const seek = this.seek(boid, attractor, 150);
        boid.applyForce(seek.x * 1.5, seek.y * 1.5);
      }

      boid.update();
      boid.edges(this.width, this.height);
    }
  }

  /**
   * Separation: steer to avoid crowding local flockmates
   */
  separation(boid) {
    let steerX = 0;
    let steerY = 0;
    let count = 0;

    for (const other of this.boids) {
      const dx = boid.x - other.x;
      const dy = boid.y - other.y;
      const d = Math.sqrt(dx * dx + dy * dy);

      if (other !== boid && d < this.separationRadius && d > 0) {
        // Weight by distance
        steerX += dx / d / d;
        steerY += dy / d / d;
        count++;
      }
    }

    if (count > 0) {
      steerX /= count;
      steerY /= count;

      // Normalize and scale
      const mag = Math.sqrt(steerX * steerX + steerY * steerY);
      if (mag > 0) {
        steerX = (steerX / mag) * boid.maxSpeed - boid.vx;
        steerY = (steerY / mag) * boid.maxSpeed - boid.vy;

        // Limit force
        const forceMag = Math.sqrt(steerX * steerX + steerY * steerY);
        if (forceMag > boid.maxForce) {
          steerX = (steerX / forceMag) * boid.maxForce;
          steerY = (steerY / forceMag) * boid.maxForce;
        }
      }
    }

    return { x: steerX, y: steerY };
  }

  /**
   * Alignment: steer towards average heading of local flockmates
   */
  alignment(boid) {
    let avgVx = 0;
    let avgVy = 0;
    let count = 0;

    for (const other of this.boids) {
      const dx = other.x - boid.x;
      const dy = other.y - boid.y;
      const d = Math.sqrt(dx * dx + dy * dy);

      if (other !== boid && d < this.perceptionRadius) {
        avgVx += other.vx;
        avgVy += other.vy;
        count++;
      }
    }

    if (count > 0) {
      avgVx /= count;
      avgVy /= count;

      // Normalize and scale
      const mag = Math.sqrt(avgVx * avgVx + avgVy * avgVy);
      if (mag > 0) {
        avgVx = (avgVx / mag) * boid.maxSpeed;
        avgVy = (avgVy / mag) * boid.maxSpeed;
      }

      let steerX = avgVx - boid.vx;
      let steerY = avgVy - boid.vy;

      // Limit force
      const forceMag = Math.sqrt(steerX * steerX + steerY * steerY);
      if (forceMag > boid.maxForce) {
        steerX = (steerX / forceMag) * boid.maxForce;
        steerY = (steerY / forceMag) * boid.maxForce;
      }

      return { x: steerX, y: steerY };
    }

    return { x: 0, y: 0 };
  }

  /**
   * Cohesion: steer towards average position of local flockmates
   */
  cohesion(boid) {
    let centerX = 0;
    let centerY = 0;
    let count = 0;

    for (const other of this.boids) {
      const dx = other.x - boid.x;
      const dy = other.y - boid.y;
      const d = Math.sqrt(dx * dx + dy * dy);

      if (other !== boid && d < this.perceptionRadius) {
        centerX += other.x;
        centerY += other.y;
        count++;
      }
    }

    if (count > 0) {
      centerX /= count;
      centerY /= count;

      return this.seek(boid, { x: centerX, y: centerY });
    }

    return { x: 0, y: 0 };
  }

  /**
   * Seek: steer towards a target
   */
  seek(boid, target, maxDist = Infinity) {
    const dx = target.x - boid.x;
    const dy = target.y - boid.y;
    const d = Math.sqrt(dx * dx + dy * dy);

    if (d > maxDist || d === 0) return { x: 0, y: 0 };

    // Desired velocity
    let desiredX = (dx / d) * boid.maxSpeed;
    let desiredY = (dy / d) * boid.maxSpeed;

    // Steering = desired - current
    let steerX = desiredX - boid.vx;
    let steerY = desiredY - boid.vy;

    // Limit force
    const forceMag = Math.sqrt(steerX * steerX + steerY * steerY);
    if (forceMag > boid.maxForce) {
      steerX = (steerX / forceMag) * boid.maxForce;
      steerY = (steerY / forceMag) * boid.maxForce;
    }

    return { x: steerX, y: steerY };
  }

  /**
   * Flee: steer away from a target
   */
  flee(boid, target, maxDist = 100) {
    const dx = boid.x - target.x;
    const dy = boid.y - target.y;
    const d = Math.sqrt(dx * dx + dy * dy);

    if (d > maxDist || d === 0) return { x: 0, y: 0 };

    // Flee force inversely proportional to distance
    const strength = (maxDist - d) / maxDist;

    let steerX = (dx / d) * boid.maxSpeed * strength;
    let steerY = (dy / d) * boid.maxSpeed * strength;

    // Limit force
    const forceMag = Math.sqrt(steerX * steerX + steerY * steerY);
    if (forceMag > boid.maxForce * 2) {
      steerX = (steerX / forceMag) * boid.maxForce * 2;
      steerY = (steerY / forceMag) * boid.maxForce * 2;
    }

    return { x: steerX, y: steerY };
  }

  /**
   * Get all boids
   */
  getBoids() {
    return this.boids;
  }

  /**
   * Get trails for rendering
   */
  getTrails() {
    return this.trails;
  }

  /**
   * Resize the bounds
   */
  resize(width, height) {
    this.width = width;
    this.height = height;
  }
}

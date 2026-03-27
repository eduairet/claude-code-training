function createSketch(p) {
  let particles = [];
  let phase = "rising";
  let foamLine;
  let coolingTimer = 0;
  const MAX_PARTICLES = 2500;
  const SPAWN_RATE = 12;

  class Particle {
    constructor(x, y, r) {
      this.x = x;
      this.y = y;
      this.r = r;
      this.vx = 0;
      this.vy = 0;
      this.age = 0;
      this.popTime = -1;
      this.wobbleOffset = p.random(p.TWO_PI);
      this.wobbleSpeed = p.random(0.01, 0.04);
      // Buoyancy strength varies per bubble — smaller ones rise slower
      this.buoyancy = p.map(r, p.width * 0.001, p.width * 0.007, 0.3, 1.2);
      this.tint = p.random(230, 255);
      this.baseAlpha = p.random(0.08, 0.35);
    }

    update() {
      this.age++;

      // Constant buoyancy — always pushing up
      this.vy -= p.height * 0.0004 * this.buoyancy;

      // Horizontal wobble like a real bubble zigzagging
      this.vx += Math.sin(this.age * this.wobbleSpeed + this.wobbleOffset) * p.width * 0.00015;

      // When above foam line, buoyancy weakens but doesn't stop —
      // bubbles crowd and slowly push upward through the foam
      let distAboveFoam = foamLine - this.y;
      if (distAboveFoam > 0) {
        // Dampen vertical speed in the foam (viscous), but don't zero it
        this.vy *= 0.92;
        this.vx *= 0.95;
        // Slight downward gravity counteracting buoyancy in foam
        this.vy += p.height * 0.00008;
      }

      // Apply velocity
      this.x += this.vx;
      this.y += this.vy;

      // Drag — liquid resistance
      this.vx *= 0.98;
      this.vy *= 0.98;

      // Soft ceiling — bubbles slow down near top, compress but keep drifting
      if (this.y < this.r) {
        this.vy += (this.r - this.y) * 0.05;
      }

      // Wrap horizontally
      if (this.x < -this.r) this.x = p.width + this.r;
      if (this.x > p.width + this.r) this.x = -this.r;

      // Cooling: bubbles fade out
      if (phase === "cooling" && this.popTime < 0) {
        let heightRatio = 1 - (this.y / p.height);
        if (p.random() < heightRatio * 0.005 + 0.001) {
          this.popTime = this.age;
        }
      }
    }

    draw() {
      let alpha = this.baseAlpha;

      if (this.popTime >= 0) {
        let fadeProgress = (this.age - this.popTime) / 40;
        if (fadeProgress >= 1) return false;
        alpha *= (1 - fadeProgress);
      }

      p.noStroke();
      p.fill(this.tint, this.tint, this.tint, alpha * 255);
      p.ellipse(this.x, this.y, this.r * 2, this.r * 2);

      return true;
    }
  }

  // Simple spatial grid for particle-particle repulsion
  let grid = {};
  const CELL_SIZE_RATIO = 0.02;

  function getCellKey(x, y, cellSize) {
    return ((x / cellSize) | 0) + "," + ((y / cellSize) | 0);
  }

  function buildGrid(cellSize) {
    grid = {};
    for (let i = 0; i < particles.length; i++) {
      let pt = particles[i];
      let key = getCellKey(pt.x, pt.y, cellSize);
      if (!grid[key]) grid[key] = [];
      grid[key].push(i);
    }
  }

  function resolveCollisions(cellSize) {
    for (let i = 0; i < particles.length; i++) {
      let a = particles[i];
      let cx = (a.x / cellSize) | 0;
      let cy = (a.y / cellSize) | 0;

      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          let key = (cx + dx) + "," + (cy + dy);
          let cell = grid[key];
          if (!cell) continue;
          for (let ji = 0; ji < cell.length; ji++) {
            let j = cell[ji];
            if (j <= i) continue;
            let b = particles[j];
            let ex = a.x - b.x;
            let ey = a.y - b.y;
            let distSq = ex * ex + ey * ey;
            let minDist = a.r + b.r;
            if (distSq < minDist * minDist && distSq > 0.01) {
              let dist = Math.sqrt(distSq);
              let overlap = (minDist - dist) * 0.5;
              let nx = ex / dist;
              let ny = ey / dist;
              // Soft push apart
              let pushForce = overlap * 0.3;
              a.vx += nx * pushForce;
              a.vy += ny * pushForce;
              b.vx -= nx * pushForce;
              b.vy -= ny * pushForce;
            }
          }
        }
      }
    }
  }

  function spawnParticles() {
    for (let i = 0; i < SPAWN_RATE; i++) {
      if (particles.length >= MAX_PARTICLES) return;
      let minR = p.width * 0.001;
      let maxR = p.width * 0.007;
      let r = p.random(minR, maxR);
      // Spawn from bottom, clustered a bit toward center like nucleation sites
      let x = p.random(p.width * 0.1, p.width * 0.9);
      let y = p.height + r;
      particles.push(new Particle(x, y, r));
    }
  }

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    foamLine = p.height * 0.7;
    phase = "rising";
    coolingTimer = 0;
  };

  p.draw = () => {
    p.background(12, 14, 20);

    if (phase === "rising") {
      spawnParticles();
      // Foam line rises as more bubbles accumulate above it
      let aboveCount = 0;
      for (let pt of particles) {
        if (pt.y < foamLine) aboveCount++;
      }
      let fillRatio = aboveCount / MAX_PARTICLES;
      foamLine = p.lerp(p.height * 0.7, p.height * 0.06, fillRatio);

      if (particles.length >= MAX_PARTICLES * 0.9) {
        phase = "full";
      }
    } else if (phase === "full") {
      coolingTimer++;
      if (coolingTimer > 120) {
        phase = "cooling";
        coolingTimer = 0;
      }
    }

    // Collision grid
    let cellSize = p.width * CELL_SIZE_RATIO;
    buildGrid(cellSize);
    resolveCollisions(cellSize);

    for (let pt of particles) {
      pt.update();
    }
    for (let pt of particles) {
      pt.draw();
    }

    // Remove dead (in-place swap to avoid per-frame allocation)
    let writeIdx = 0;
    for (let i = 0; i < particles.length; i++) {
      let pt = particles[i];
      if (pt.popTime < 0 || (pt.age - pt.popTime) < 40) {
        particles[writeIdx++] = pt;
      }
    }
    particles.length = writeIdx;

    // Restart cycle
    if (phase === "cooling" && particles.length === 0) {
      phase = "rising";
      foamLine = p.height * 0.7;
      coolingTimer = 0;
    }
  };

  p.windowResized = () => {
    let oldW = p.width;
    let oldH = p.height;
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    let sx = p.width / oldW;
    let sy = p.height / oldH;
    foamLine *= sy;
    for (let pt of particles) {
      pt.x *= sx;
      pt.y *= sy;
      pt.r *= Math.min(sx, sy);
    }
  };

  p.keyPressed = () => {
    if (p.key === "r" || p.key === "R") {
      particles = [];
      phase = "rising";
      foamLine = p.height * 0.7;
      coolingTimer = 0;
    }
  };
}

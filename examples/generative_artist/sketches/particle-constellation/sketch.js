function createSketch(p) {
  const PARTICLE_COUNT = 150;
  const CONNECTION_DIST_RATIO = 0.12; // fraction of min(width, height)
  const MOUSE_ATTRACT_RATIO = 0.2;   // fraction of min(width, height)
  const MOUSE_FORCE = 0.3;
  const BG = [8, 8, 20];

  let particles = [];
  let connectionDist;
  let mouseAttractDist;
  let baseSize;

  // Pre-allocated color palette as RGB arrays for performance
  const PALETTE = [
    [0, 255, 200],    // cyan-green
    [120, 80, 255],   // electric purple
    [255, 50, 150],   // hot pink
    [50, 200, 255],   // sky blue
    [200, 100, 255],  // violet
    [0, 255, 120],    // neon green
  ];

  function recalcSizes() {
    let minDim = Math.min(p.width, p.height);
    connectionDist = minDim * CONNECTION_DIST_RATIO;
    mouseAttractDist = minDim * MOUSE_ATTRACT_RATIO;
    baseSize = minDim * 0.004;
  }

  class Particle {
    constructor() {
      this.x = p.random(p.width);
      this.y = p.random(p.height);
      this.vx = p.random(-0.5, 0.5);
      this.vy = p.random(-0.5, 0.5);
      let c = PALETTE[p.floor(p.random(PALETTE.length))];
      this.r = c[0];
      this.g = c[1];
      this.b = c[2];
    }

    update() {
      // Mouse attraction
      if (p.mouseX > 0 && p.mouseX < p.width && p.mouseY > 0 && p.mouseY < p.height) {
        let dx = p.mouseX - this.x;
        let dy = p.mouseY - this.y;
        let d = Math.sqrt(dx * dx + dy * dy);
        if (d < mouseAttractDist && d > 1) {
          let force = MOUSE_FORCE * (1 - d / mouseAttractDist);
          this.vx += (dx / d) * force;
          this.vy += (dy / d) * force;
        }
      }

      // Damping
      this.vx *= 0.98;
      this.vy *= 0.98;

      // Drift — gentle random walk
      this.vx += p.random(-0.05, 0.05);
      this.vy += p.random(-0.05, 0.05);

      // Speed limit
      let speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      if (speed > 2) {
        this.vx = (this.vx / speed) * 2;
        this.vy = (this.vy / speed) * 2;
      }

      this.x += this.vx;
      this.y += this.vy;

      // Wrap edges
      if (this.x < 0) this.x += p.width;
      if (this.x > p.width) this.x -= p.width;
      if (this.y < 0) this.y += p.height;
      if (this.y > p.height) this.y -= p.height;
    }

    draw() {
      // Outer glow (soft halo)
      let glowSize = baseSize * 6;
      p.fill(this.r, this.g, this.b, 15);
      p.circle(this.x, this.y, glowSize);

      // Mid glow
      p.fill(this.r, this.g, this.b, 40);
      p.circle(this.x, this.y, glowSize * 0.5);

      // Core
      p.fill(this.r, this.g, this.b, 220);
      p.circle(this.x, this.y, baseSize * 1.5);
    }
  }

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    recalcSizes();

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(new Particle());
    }
  };

  p.draw = () => {
    p.background(BG[0], BG[1], BG[2]);
    p.noStroke();

    // Update all particles
    for (let i = 0; i < particles.length; i++) {
      particles[i].update();
    }

    // Draw connections
    let connDistSq = connectionDist * connectionDist;
    for (let i = 0; i < particles.length; i++) {
      let a = particles[i];
      for (let j = i + 1; j < particles.length; j++) {
        let b = particles[j];
        let dx = a.x - b.x;
        let dy = a.y - b.y;
        let distSq = dx * dx + dy * dy;

        if (distSq < connDistSq) {
          let d = Math.sqrt(distSq);
          let alpha = p.map(d, 0, connectionDist, 120, 0);
          // Blend the two particle colors
          let mr = (a.r + b.r) * 0.5;
          let mg = (a.g + b.g) * 0.5;
          let mb = (a.b + b.b) * 0.5;
          p.stroke(mr, mg, mb, alpha);
          p.strokeWeight(p.map(d, 0, connectionDist, baseSize * 0.6, baseSize * 0.15));
          p.line(a.x, a.y, b.x, b.y);
        }
      }
    }

    p.noStroke();
    // Draw particles on top
    for (let i = 0; i < particles.length; i++) {
      particles[i].draw();
    }
  };

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    recalcSizes();
  };

  p.keyPressed = () => {
    if (p.key === 'r' || p.key === 'R') {
      particles = [];
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push(new Particle());
      }
    }
    if (p.key === 's') {
      p.saveCanvas('particle-constellation', 'png');
    }
  };
}

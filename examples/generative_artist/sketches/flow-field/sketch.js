function createSketch(p) {
  const particles = [];
  const PARTICLE_COUNT = 800;
  const NOISE_SCALE = 0.003;
  const SPEED = 2;
  const BG = [10, 10, 18];

  let palette;

  class Particle {
    constructor() {
      this.reset();
    }

    reset() {
      this.pos = p.createVector(p.random(p.width), p.random(p.height));
      this.vel = p.createVector(0, 0);
      this.acc = p.createVector(0, 0);
      this.maxSpeed = SPEED + p.random(-0.5, 0.5);
      let c = p.random(palette);
      this.r = p.red(c);
      this.g = p.green(c);
      this.b = p.blue(c);
      this.life = p.floor(p.random(100, 400));
      this.age = 0;
    }

    update() {
      // Noise-based angle
      let angle = p.noise(
        this.pos.x * NOISE_SCALE,
        this.pos.y * NOISE_SCALE,
        p.frameCount * 0.002
      ) * p.TWO_PI * 2;

      // Mouse influence
      if (p.mouseX > 0 && p.mouseX < p.width && p.mouseY > 0 && p.mouseY < p.height) {
        let d = p.dist(this.pos.x, this.pos.y, p.mouseX, p.mouseY);
        let influence = p.map(d, 0, p.width * 0.3, 0.8, 0, true);
        let mouseAngle = p.atan2(this.pos.y - p.mouseY, this.pos.x - p.mouseX);
        angle = p.lerp(angle, mouseAngle, influence);
      }

      this.acc.set(Math.cos(angle) * 0.5, Math.sin(angle) * 0.5);
      this.vel.add(this.acc);
      this.vel.limit(this.maxSpeed);
      this.pos.add(this.vel);
      this.age++;

      // Wrap around edges
      if (this.pos.x < 0) this.pos.x = p.width;
      if (this.pos.x > p.width) this.pos.x = 0;
      if (this.pos.y < 0) this.pos.y = p.height;
      if (this.pos.y > p.height) this.pos.y = 0;

      // Reset when old
      if (this.age > this.life) this.reset();
    }

    draw() {
      let t = this.age / this.life;
      let alpha = 200 * (1 - t);
      let size = p.width * (0.003 - 0.002 * t);
      p.fill(this.r, this.g, this.b, alpha);
      p.circle(this.pos.x, this.pos.y, size);
    }
  }

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    p.background(...BG);

    palette = [
      p.color(108, 92, 231),   // purple
      p.color(162, 155, 254),   // light purple
      p.color(0, 206, 209),     // teal
      p.color(255, 107, 107),   // coral
      p.color(72, 219, 251),    // cyan
    ];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(new Particle());
    }
  };

  p.draw = () => {
    // Semi-transparent background for trail effect
    p.background(...BG, 15);
    p.noStroke();

    for (const particle of particles) {
      particle.update();
      particle.draw();
    }
  };

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    p.background(...BG);
  };

  p.keyPressed = () => {
    if (p.key === "r" || p.key === "R") {
      p.background(...BG);
      for (const particle of particles) {
        particle.reset();
      }
    }
    if (p.key === "s") {
      p.saveCanvas("flow-field", "png");
    }
  };
}

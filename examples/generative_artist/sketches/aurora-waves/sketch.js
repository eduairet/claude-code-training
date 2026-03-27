function createSketch(p) {
  const BG = [5, 5, 15];
  const LAYER_COUNT = 7;
  const RESOLUTION = 3; // pixel step for wave vertices

  // Aurora color stops: deep green -> teal -> cyan -> purple -> magenta
  // Stored as RGB arrays for performance
  const AURORA_COLORS = [
    [20, 200, 80],    // green
    [0, 220, 160],    // teal
    [30, 180, 255],   // cyan
    [100, 60, 255],   // blue-purple
    [180, 40, 220],   // magenta
    [80, 255, 120],   // bright green
  ];

  let layers = [];
  let starX = [];
  let starY = [];
  let starBright = [];
  const STAR_COUNT = 200;

  function initStars() {
    starX = [];
    starY = [];
    starBright = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      starX.push(p.random(p.width));
      starY.push(p.random(p.height * 0.6)); // stars in upper portion
      starBright.push(p.random(80, 255));
    }
  }

  function initLayers() {
    layers = [];
    for (let i = 0; i < LAYER_COUNT; i++) {
      let colorIdx = i % AURORA_COLORS.length;
      layers.push({
        noiseOffsetX: p.random(1000),
        noiseOffsetY: p.random(1000),
        speed: 0.0003 + i * 0.0001,
        amplitude: 0.08 + i * 0.015, // fraction of height
        baseY: 0.2 + i * 0.06,       // fraction of height
        waveScale: 0.002 + i * 0.0003,
        alpha: 25 - i * 2,
        r: AURORA_COLORS[colorIdx][0],
        g: AURORA_COLORS[colorIdx][1],
        b: AURORA_COLORS[colorIdx][2],
      });
    }
  }

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    initLayers();
    initStars();
  };

  p.draw = () => {
    p.background(BG[0], BG[1], BG[2]);

    p.noStroke();
    for (let i = 0; i < STAR_COUNT; i++) {
      let twinkle = starBright[i] * (0.5 + 0.5 * Math.sin(p.frameCount * 0.02 + i));
      p.fill(255, 255, 240, twinkle);
      let sz = p.width * 0.002;
      p.circle(starX[i], starY[i], sz);
    }

    let t = p.frameCount;
    let mouseInfluenceX = 0;
    let intensityMult = 1;
    if (p.mouseX > 0 && p.mouseX < p.width && p.mouseY > 0 && p.mouseY < p.height) {
      mouseInfluenceX = (p.mouseX / p.width - 0.5) * 0.5;
      intensityMult = p.map(p.mouseY, 0, p.height, 1.5, 0.5);
    }

    for (let l = 0; l < layers.length; l++) {
      let layer = layers[l];

      let colorShift = (t * 0.001 + l * 0.7) % AURORA_COLORS.length;
      let cIdx = p.floor(colorShift);
      let cFrac = colorShift - cIdx;
      let c1 = AURORA_COLORS[cIdx % AURORA_COLORS.length];
      let c2 = AURORA_COLORS[(cIdx + 1) % AURORA_COLORS.length];
      let cr = c1[0] + (c2[0] - c1[0]) * cFrac;
      let cg = c1[1] + (c2[1] - c1[1]) * cFrac;
      let cb = c1[2] + (c2[2] - c1[2]) * cFrac;

      let baseAlpha = layer.alpha * intensityMult;

      // Compute wave vertices once, reuse for fill and stroke
      let yBase = p.height * layer.baseY;
      let amplitude = p.height * layer.amplitude * intensityMult;
      let ny = layer.noiseOffsetY + t * layer.speed * 0.7;
      let waveYs = [];
      for (let x = 0; x <= p.width; x += RESOLUTION) {
        let nx = x * layer.waveScale + layer.noiseOffsetX + t * layer.speed + mouseInfluenceX;
        let noiseVal = p.noise(nx, ny);
        let sineWave = Math.sin(x * 0.005 + t * 0.008 + l * 1.2) * 0.3;
        waveYs.push(yBase - (noiseVal + sineWave) * amplitude);
      }

      // Filled wave shape
      p.noStroke();
      p.fill(cr, cg, cb, baseAlpha);
      p.beginShape();
      p.vertex(0, p.height);
      for (let i = 0; i < waveYs.length; i++) {
        p.vertex(i * RESOLUTION, waveYs[i]);
      }
      p.vertex(p.width, p.height);
      p.endShape(p.CLOSE);

      // Bright edge glow
      p.noFill();
      p.stroke(cr, cg, cb, baseAlpha * 2.5);
      p.strokeWeight(Math.max(1, p.width * 0.002));
      p.beginShape();
      for (let i = 0; i < waveYs.length; i++) {
        p.curveVertex(i * RESOLUTION, waveYs[i]);
      }
      p.endShape();
    }

    // Subtle ground gradient at the bottom
    p.noStroke();
    let gradientH = p.height * 0.15;
    for (let y = p.height - gradientH; y < p.height; y++) {
      let t2 = (y - (p.height - gradientH)) / gradientH;
      p.fill(10, 15, 30, t2 * 60);
      p.rect(0, y, p.width, 1);
    }
  };

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    initStars();
  };

  p.keyPressed = () => {
    if (p.key === 'r' || p.key === 'R') {
      initLayers();
      initStars();
    }
    if (p.key === 's') {
      p.saveCanvas('aurora-waves', 'png');
    }
  };
}

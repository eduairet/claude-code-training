function createSketch(p) {
  let coinY;
  let coinVY;
  let coinRotX;
  let coinSpinX;
  let coinRotZ;
  let coinSpinZ;
  let flipping = false;
  let landed = false;
  let result = "";
  let groundY;
  let coinRadius;
  let coinThickness;
  let gravity;
  let resultAngle;
  let restY;
  let headsTex, tailsTex;

  const COIN_SEGMENTS = 48;
  const TEX_SIZE = 512;

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight, p.WEBGL);
    p.textureMode(p.NORMAL);
    headsTex = createHeadsTexture();
    tailsTex = createTailsTexture();
    recalcSizes();
    resetCoin();
  };

  function drawRimAndDots(g, s, cx, cy, strokeR, strokeG, strokeB) {
    g.noFill();
    g.stroke(strokeR, strokeG, strokeB);
    g.strokeWeight(s * 0.03);
    g.ellipse(cx, cy, s * 0.92, s * 0.92);
    g.strokeWeight(s * 0.01);
    g.ellipse(cx, cy, s * 0.84, s * 0.84);
    g.noStroke();
    g.fill(strokeR, strokeG, strokeB);
    for (let i = 0; i < 60; i++) {
      let a = (i / 60) * g.TWO_PI;
      let r = s * 0.435;
      g.ellipse(cx + Math.cos(a) * r, cy + Math.sin(a) * r, s * 0.012, s * 0.012);
    }
  }

  function drawArcText(g, word, cx, cy, radius, startAngle, spread, flipRotation) {
    g.textAlign(g.CENTER, g.CENTER);
    g.textStyle(g.BOLD);
    for (let i = 0; i < word.length; i++) {
      let a = startAngle + (i - (word.length - 1) * 0.5) * spread;
      g.push();
      g.translate(cx + Math.cos(a) * radius, cy + Math.sin(a) * radius);
      g.rotate(a + (flipRotation ? -g.HALF_PI : g.HALF_PI));
      g.text(word[i], 0, 0);
      g.pop();
    }
  }

  function createHeadsTexture() {
    let g = p.createGraphics(TEX_SIZE, TEX_SIZE);
    let s = TEX_SIZE;
    let cx = s * 0.5, cy = s * 0.5;

    g.background(218, 185, 80);
    drawRimAndDots(g, s, cx, cy, 170, 140, 50);

    // Head profile (simplified silhouette facing right)
    g.fill(185, 155, 60);
    g.noStroke();
    g.beginShape();
    // Neck
    g.vertex(cx - s * 0.02, cy + s * 0.28);
    g.vertex(cx + s * 0.04, cy + s * 0.28);
    g.vertex(cx + s * 0.06, cy + s * 0.18);
    // Chin
    g.vertex(cx + s * 0.12, cy + s * 0.14);
    // Jaw
    g.vertex(cx + s * 0.15, cy + s * 0.08);
    // Mouth
    g.vertex(cx + s * 0.16, cy + s * 0.04);
    // Nose
    g.vertex(cx + s * 0.2, cy - s * 0.02);
    g.vertex(cx + s * 0.18, cy - s * 0.06);
    // Bridge
    g.vertex(cx + s * 0.14, cy - s * 0.08);
    // Brow
    g.vertex(cx + s * 0.15, cy - s * 0.12);
    // Forehead
    g.vertex(cx + s * 0.12, cy - s * 0.18);
    g.vertex(cx + s * 0.06, cy - s * 0.24);
    // Top of head
    g.vertex(cx - s * 0.02, cy - s * 0.27);
    // Back of head
    g.vertex(cx - s * 0.1, cy - s * 0.24);
    g.vertex(cx - s * 0.14, cy - s * 0.18);
    g.vertex(cx - s * 0.15, cy - s * 0.08);
    // Back of neck
    g.vertex(cx - s * 0.12, cy + s * 0.05);
    g.vertex(cx - s * 0.08, cy + s * 0.15);
    g.vertex(cx - s * 0.04, cy + s * 0.24);
    g.endShape(g.CLOSE);

    // Eye
    g.fill(218, 185, 80);
    g.ellipse(cx + s * 0.08, cy - s * 0.08, s * 0.03, s * 0.02);

    // Laurel wreath hints
    g.stroke(185, 155, 60);
    g.strokeWeight(s * 0.008);
    g.noFill();
    for (let i = 0; i < 8; i++) {
      let a = -g.HALF_PI - 0.4 + (i / 7) * 1.6;
      let r = s * 0.2;
      let lx = cx - s * 0.02 + Math.cos(a) * r;
      let ly = cy - s * 0.04 + Math.sin(a) * r;
      g.push();
      g.translate(lx, ly);
      g.rotate(a + g.HALF_PI);
      g.ellipse(0, 0, s * 0.02, s * 0.05);
      g.pop();
    }

    g.noStroke();
    g.fill(170, 140, 50);
    g.textSize(s * 0.06);
    drawArcText(g, "HEADS", cx, cy, s * 0.37, -g.HALF_PI - 0.25, 0.1, false);

    return g;
  }

  function createTailsTexture() {
    let g = p.createGraphics(TEX_SIZE, TEX_SIZE);
    let s = TEX_SIZE;
    let cx = s * 0.5, cy = s * 0.5;

    g.background(195, 160, 70);
    drawRimAndDots(g, s, cx, cy, 150, 120, 45);

    // Eagle / shield emblem
    g.fill(160, 130, 50);
    g.noStroke();

    // Shield body
    g.beginShape();
    g.vertex(cx - s * 0.1, cy - s * 0.1);
    g.vertex(cx + s * 0.1, cy - s * 0.1);
    g.vertex(cx + s * 0.1, cy + s * 0.05);
    g.vertex(cx, cy + s * 0.16);
    g.vertex(cx - s * 0.1, cy + s * 0.05);
    g.endShape(g.CLOSE);

    // Shield stripe
    g.fill(180, 150, 60);
    g.rect(cx - s * 0.015, cy - s * 0.1, s * 0.03, s * 0.22);

    // Wings (left)
    g.fill(160, 130, 50);
    g.beginShape();
    g.vertex(cx - s * 0.1, cy - s * 0.06);
    g.vertex(cx - s * 0.28, cy - s * 0.18);
    g.vertex(cx - s * 0.24, cy - s * 0.12);
    g.vertex(cx - s * 0.22, cy - s * 0.16);
    g.vertex(cx - s * 0.18, cy - s * 0.1);
    g.vertex(cx - s * 0.16, cy - s * 0.14);
    g.vertex(cx - s * 0.12, cy - s * 0.06);
    g.endShape(g.CLOSE);

    // Wings (right)
    g.beginShape();
    g.vertex(cx + s * 0.1, cy - s * 0.06);
    g.vertex(cx + s * 0.28, cy - s * 0.18);
    g.vertex(cx + s * 0.24, cy - s * 0.12);
    g.vertex(cx + s * 0.22, cy - s * 0.16);
    g.vertex(cx + s * 0.18, cy - s * 0.1);
    g.vertex(cx + s * 0.16, cy - s * 0.14);
    g.vertex(cx + s * 0.12, cy - s * 0.06);
    g.endShape(g.CLOSE);

    // Star above
    g.fill(180, 150, 60);
    drawStar(g, cx, cy - s * 0.22, s * 0.04, s * 0.02, 5);

    // Stars flanking
    drawStar(g, cx - s * 0.2, cy + s * 0.05, s * 0.02, s * 0.01, 5);
    drawStar(g, cx + s * 0.2, cy + s * 0.05, s * 0.02, s * 0.01, 5);

    g.noStroke();
    g.fill(150, 120, 45);
    g.textSize(s * 0.06);
    drawArcText(g, "TAILS", cx, cy, s * 0.37, -g.HALF_PI - 0.2, 0.1, false);

    g.textSize(s * 0.04);
    drawArcText(g, "ONE CENT", cx, cy, s * 0.37, g.HALF_PI + 0.35, -0.07, true);

    return g;
  }

  function drawStar(g, x, y, r1, r2, points) {
    g.beginShape();
    for (let i = 0; i < points * 2; i++) {
      let a = (i / (points * 2)) * g.TWO_PI - g.HALF_PI;
      let r = i % 2 === 0 ? r1 : r2;
      g.vertex(x + Math.cos(a) * r, y + Math.sin(a) * r);
    }
    g.endShape(g.CLOSE);
  }

  function recalcSizes() {
    coinRadius = Math.min(p.width, p.height) * 0.15;
    coinThickness = coinRadius * 0.08;
    gravity = p.height * 0.0006;
    groundY = coinRadius * 0.6;
    restY = groundY - coinThickness * 0.5;
  }

  function resetCoin() {
    coinY = restY;
    coinVY = 0;
    coinRotX = p.HALF_PI;
    coinSpinX = 0;
    coinRotZ = 0;
    coinSpinZ = 0;
    flipping = false;
    landed = false;
    result = "";
  }

  function flipCoin() {
    if (flipping) return;
    flipping = true;
    landed = false;
    result = p.random() > 0.5 ? "HEADS" : "TAILS";
    coinVY = -p.height * 0.025;
    coinSpinX = p.random(0.2, 0.4) * (p.random() > 0.5 ? 1 : -1);
    coinSpinZ = p.random(-0.03, 0.03);
    resultAngle = result === "HEADS" ? p.HALF_PI : -p.HALF_PI;
  }

  function drawCoin() {
    let edgeR = 180, edgeG = 150, edgeB = 60;

    // Top face (heads) — textured
    p.push();
    p.translate(0, 0, coinThickness * 0.5 + 0.1);
    p.noStroke();
    p.texture(headsTex);
    p.beginShape(p.TRIANGLE_FAN);
    p.vertex(0, 0, 0, 0.5, 0.5);
    for (let i = 0; i <= COIN_SEGMENTS; i++) {
      let a = (i / COIN_SEGMENTS) * p.TWO_PI;
      let ca = Math.cos(a), sa = Math.sin(a);
      p.vertex(ca * coinRadius, sa * coinRadius, 0, ca * 0.5 + 0.5, sa * 0.5 + 0.5);
    }
    p.endShape();
    p.pop();

    // Bottom face (tails) — textured
    p.push();
    p.translate(0, 0, -coinThickness * 0.5 - 0.1);
    p.noStroke();
    p.texture(tailsTex);
    p.beginShape(p.TRIANGLE_FAN);
    p.vertex(0, 0, 0, 0.5, 0.5);
    for (let i = COIN_SEGMENTS; i >= 0; i--) {
      let a = (i / COIN_SEGMENTS) * p.TWO_PI;
      let ca = Math.cos(a), sa = Math.sin(a);
      // Mirror U so text reads correctly
      p.vertex(ca * coinRadius, sa * coinRadius, 0, 1 - (ca * 0.5 + 0.5), sa * 0.5 + 0.5);
    }
    p.endShape();
    p.pop();

    // Edge rim
    p.noStroke();
    p.fill(edgeR, edgeG, edgeB);
    p.beginShape(p.TRIANGLE_STRIP);
    for (let i = 0; i <= COIN_SEGMENTS; i++) {
      let a = (i / COIN_SEGMENTS) * p.TWO_PI;
      let cx = Math.cos(a) * coinRadius;
      let cy = Math.sin(a) * coinRadius;
      p.vertex(cx, cy, coinThickness * 0.5);
      p.vertex(cx, cy, -coinThickness * 0.5);
    }
    p.endShape();

    // Ridged edge detail
    p.stroke(edgeR * 0.8, edgeG * 0.8, edgeB * 0.8);
    p.strokeWeight(0.5);
    for (let i = 0; i < COIN_SEGMENTS; i += 2) {
      let a = (i / COIN_SEGMENTS) * p.TWO_PI;
      let cx = Math.cos(a) * coinRadius * 1.001;
      let cy = Math.sin(a) * coinRadius * 1.001;
      p.line(cx, cy, coinThickness * 0.5, cx, cy, -coinThickness * 0.5);
    }
  }

  p.draw = () => {
    p.background(18, 18, 24);
    p.camera(0, -p.height * 0.15, p.height * 0.8, 0, 0, 0, 0, 1, 0);

    p.ambientLight(100);
    p.directionalLight(220, 210, 190, 0.5, 1, -0.5);
    p.directionalLight(80, 80, 110, -0.3, -0.5, -0.8);

    if (flipping) {
      coinVY += gravity;
      coinY += coinVY;
      coinRotX += coinSpinX;
      coinRotZ += coinSpinZ;
      coinSpinX *= 0.998;
      coinSpinZ *= 0.995;

      if (coinY >= restY && coinVY > 0) {
        coinY = restY;
        flipping = false;
        landed = true;
        coinRotX = resultAngle;
        coinSpinX = 0;
        coinSpinZ = 0;
        coinVY = 0;
      }
    }

    // Ground plane
    p.push();
    p.translate(0, groundY, 0);
    p.rotateX(p.HALF_PI);
    p.noStroke();
    p.fill(30, 30, 40);
    p.ellipse(0, 0, p.width * 0.6, p.width * 0.6);
    p.pop();

    // Shadow
    let heightAboveGround = groundY - coinY;
    let shadowScale = p.map(heightAboveGround, 0, p.height * 0.4, 1, 0.3, true);
    let shadowAlpha = p.map(heightAboveGround, 0, p.height * 0.4, 50, 5, true);
    p.push();
    p.translate(0, groundY - 0.5, 0);
    p.rotateX(p.HALF_PI);
    p.noStroke();
    p.fill(0, 0, 0, shadowAlpha);
    p.ellipse(0, 0, coinRadius * 2.2 * shadowScale, coinRadius * 2.2 * shadowScale);
    p.pop();

    // Coin
    p.push();
    p.translate(0, coinY, 0);
    p.rotateX(coinRotX);
    p.rotateZ(coinRotZ);
    drawCoin();
    p.pop();

    // HUD
    p.push();
    p.camera();
    p.ortho();
    p.noLights();
    p.textAlign(p.CENTER, p.CENTER);

    if (landed) {
      p.fill(255, 255, 255, 200);
      p.textSize(p.width * 0.035);
      p.textStyle(p.BOLD);
      p.text(result, 0, p.height * 0.3);

      p.fill(255, 255, 255, 60);
      p.textSize(p.width * 0.015);
      p.textStyle(p.NORMAL);
      p.text("Click to flip again", 0, p.height * 0.37);
    } else if (!flipping) {
      p.fill(255, 255, 255, 80);
      p.textSize(p.width * 0.018);
      p.textStyle(p.NORMAL);
      p.text("Click to flip", 0, p.height * 0.3);
    }

    p.pop();
  };

  p.mousePressed = () => {
    if (landed) resetCoin();
    flipCoin();
  };

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    recalcSizes();
    if (!flipping) coinY = restY;
  };
}

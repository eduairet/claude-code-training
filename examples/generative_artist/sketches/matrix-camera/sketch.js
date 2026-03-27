function createSketch(p) {
  let capture;
  let cols, rows;
  let cellSize;
  let drops = [];
  let captureReady = false;

  // Matrix characters — katakana + digits + symbols
  const CHARS = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789@#$%&*+=<>";

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    p.textAlign(p.CENTER, p.CENTER);
    p.textStyle(p.BOLD);

    cellSize = Math.floor(Math.min(p.width, p.height) * 0.018);
    cellSize = Math.max(cellSize, 8);
    cols = Math.ceil(p.width / cellSize);
    rows = Math.ceil(p.height / cellSize);

    capture = p.createCapture(p.VIDEO);
    capture.size(cols, rows);
    capture.hide();

    setTimeout(() => { captureReady = true; }, 500);

    initDrops();
    p.background(0);
  };

  function initDrops() {
    drops = [];
    for (let x = 0; x < cols; x++) {
      drops.push({
        y: p.random(-rows, 0),
        speed: p.random(0.3, 1.0),
        length: Math.floor(p.random(rows * 0.3, rows * 0.9)),
      });
    }
  }

  p.draw = () => {
    p.background(0);

    if (!captureReady || !capture) {
      p.noStroke();
      p.fill(0, 255, 70);
      p.textSize(cellSize * 2);
      p.text("Initializing camera...", p.width * 0.5, p.height * 0.5);
      return;
    }

    capture.loadPixels();
    if (!capture.pixels || capture.pixels.length === 0) return;

    p.noStroke();
    p.textSize(cellSize * 0.9);

    let camW = capture.width;
    let camH = capture.height;

    for (let x = 0; x < cols; x++) {
      let drop = drops[x];
      drop.y += drop.speed;

      if (drop.y - drop.length > rows) {
        drop.y = p.random(-rows * 0.5, -2);
        drop.speed = p.random(0.3, 1.0);
        drop.length = Math.floor(p.random(rows * 0.3, rows * 0.9));
      }

      for (let y = 0; y < rows; y++) {
        // Sample brightness from camera (mirrored)
        let camX = camW - 1 - Math.floor((x / cols) * camW);
        let camY = Math.floor((y / rows) * camH);
        camX = p.constrain(camX, 0, camW - 1);
        camY = p.constrain(camY, 0, camH - 1);
        let idx = (camY * camW + camX) * 4;
        let r = capture.pixels[idx];
        let g = capture.pixels[idx + 1];
        let b = capture.pixels[idx + 2];
        let brightness = (r * 0.299 + g * 0.587 + b * 0.114) / 255;

        let distFromHead = drop.y - y;
        let rainBoost = 0;
        if (distFromHead >= 0 && distFromHead <= drop.length) {
          let fade = 1 - (distFromHead / drop.length);
          rainBoost = fade * fade * 0.6;
        }
        let isHead = distFromHead >= 0 && distFromHead < 1.5;

        // Combined intensity: camera drives the base, rain adds on top
        // Boost and curve brightness so the person is clearly visible
        let boosted = brightness * 1.8;
        boosted = Math.min(boosted, 1);
        // Lift shadows so even dimly lit areas show up
        boosted = 0.15 + boosted * 0.85;
        let intensity = boosted + rainBoost;
        intensity = Math.min(intensity, 1);

        if (intensity < 0.1 && !isHead) continue;

        // Pick character
        let charIdx;
        if (p.random() < 0.02) {
          charIdx = Math.floor(p.random(CHARS.length));
        } else {
          charIdx = (x * 37 + y * 13 + Math.floor(drop.y * 3)) % CHARS.length;
        }

        let px = x * cellSize + cellSize * 0.5;
        let py = y * cellSize + cellSize * 0.5;

        if (isHead) {
          // Rain head — bright white-green
          p.fill(180, 255, 180, 255);
        } else {
          // Green intensity driven by camera + rain
          let greenVal = Math.floor(intensity * 220 + 35);
          let alpha = Math.floor(intensity * 255);
          p.fill(0, greenVal, 0, alpha);
        }

        p.text(CHARS[charIdx], px, py);
      }
    }
  };

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    cellSize = Math.floor(Math.min(p.width, p.height) * 0.018);
    cellSize = Math.max(cellSize, 8);
    let newCols = Math.ceil(p.width / cellSize);
    rows = Math.ceil(p.height / cellSize);

    if (capture) {
      capture.size(newCols, rows);
    }

    while (drops.length < newCols) {
      drops.push({
        y: p.random(-rows, 0),
        speed: p.random(0.3, 1.0),
        length: Math.floor(p.random(rows * 0.3, rows * 0.9)),
      });
    }
    drops.length = newCols;
    cols = newCols;

    p.background(0);
  };
}

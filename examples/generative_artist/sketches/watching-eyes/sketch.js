function createSketch(p) {
  let eyes = [];
  const COLS = 18;

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    p.noStroke();
    buildGrid();
  };

  function buildGrid() {
    eyes = [];
    let spacingX = p.width / COLS;
    let rows = Math.ceil(p.height / spacingX);
    let spacingY = p.height / rows;
    let eyeRadius = Math.min(spacingX, spacingY) * 0.38;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < COLS; col++) {
        let cx = spacingX * (col + 0.5);
        let cy = spacingY * (row + 0.5);
        eyes.push({
          x: cx,
          y: cy,
          r: eyeRadius,
          irisRatio: p.random(0.5, 0.6),
          pupilRatio: p.random(0.22, 0.3),
          irisR: p.random(20, 60),
          irisG: p.random(80, 180),
          irisB: p.random(60, 160),
        });
      }
    }
  }

  p.draw = () => {
    p.background(18, 18, 24);

    let mx = p.mouseX;
    let my = p.mouseY;

    for (let eye of eyes) {
      let r = eye.r;
      let irisSize = r * eye.irisRatio;
      let pupilSize = r * eye.pupilRatio;

      // Direction to mouse
      let dx = mx - eye.x;
      let dy = my - eye.y;
      let dist = Math.sqrt(dx * dx + dy * dy);
      let maxShift = r - irisSize;
      let shift = Math.min(dist * 0.15, maxShift);
      let angle = Math.atan2(dy, dx);
      let irisX = eye.x + Math.cos(angle) * shift;
      let irisY = eye.y + Math.sin(angle) * shift;

      // Sclera — perfect circle
      p.fill(240, 238, 235);
      p.ellipse(eye.x, eye.y, r * 2, r * 2);

      // Iris
      p.fill(eye.irisR, eye.irisG, eye.irisB);
      p.ellipse(irisX, irisY, irisSize * 2, irisSize * 2);

      // Pupil
      p.fill(5, 5, 8);
      p.ellipse(irisX, irisY, pupilSize * 2, pupilSize * 2);

      // Specular highlight
      p.fill(255, 255, 255, 200);
      p.ellipse(irisX - pupilSize * 0.35, irisY - pupilSize * 0.35, pupilSize * 0.5, pupilSize * 0.5);
    }
  };

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    buildGrid();
  };
}

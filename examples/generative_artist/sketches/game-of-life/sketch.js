function createSketch(p) {
  let grid, nextGrid, ageGrid;
  let cols, rows, cellSize;
  let running = true;
  let colorPicker;
  const MAX_AGE = 60;
  const TARGET_COLS = 80;
  const DEFAULT_COLOR = "#e8e44f"; // lemon — always used for thumbnails

  function initGrids() {
    cellSize = p.floor(p.width / TARGET_COLS);
    cols = p.floor(p.width / cellSize);
    rows = p.floor(p.height / cellSize);
    grid = make2D(cols, rows, 0);
    nextGrid = make2D(cols, rows, 0);
    ageGrid = make2D(cols, rows, 0);
  }

  function make2D(c, r, val) {
    const arr = new Array(c);
    for (let i = 0; i < c; i++) {
      arr[i] = new Array(r).fill(val);
    }
    return arr;
  }

  function randomize() {
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        grid[i][j] = p.random() > 0.7 ? 1 : 0;
        ageGrid[i][j] = grid[i][j] ? 1 : 0;
      }
    }
  }

  function clearGrid() {
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        grid[i][j] = 0;
        ageGrid[i][j] = 0;
      }
    }
  }

  function countNeighbors(x, y) {
    let sum = 0;
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue;
        let ni = (x + dx + cols) % cols;
        let nj = (y + dy + rows) % rows;
        sum += grid[ni][nj];
      }
    }
    return sum;
  }

  function step() {
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        let neighbors = countNeighbors(i, j);
        if (grid[i][j] === 1) {
          nextGrid[i][j] = (neighbors === 2 || neighbors === 3) ? 1 : 0;
        } else {
          nextGrid[i][j] = (neighbors === 3) ? 1 : 0;
        }

        if (nextGrid[i][j] === 1) {
          ageGrid[i][j] = grid[i][j] === 1 ? ageGrid[i][j] + 1 : 1;
        } else {
          ageGrid[i][j] = 0;
        }
      }
    }
    let temp = grid;
    grid = nextGrid;
    nextGrid = temp;
  }

  function paintCell(mx, my) {
    let i = p.floor(mx / cellSize);
    let j = p.floor(my / cellSize);
    if (i >= 0 && i < cols && j >= 0 && j < rows) {
      grid[i][j] = 1;
      ageGrid[i][j] = 1;
    }
  }

  function getBaseColor() {
    if (colorPicker) return colorPicker.color();
    return p.color(DEFAULT_COLOR);
  }

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    initGrids();
    randomize();
    p.frameRate(15);

    // Only create the picker if we're not in thumbnail mode
    if (p.windowWidth > 400) {
      colorPicker = p.createColorPicker(DEFAULT_COLOR);
      colorPicker.style("border", "none");
      colorPicker.style("border-radius", "4px");
      colorPicker.style("cursor", "pointer");
      colorPicker.style("width", "32px");
      colorPicker.style("height", "24px");
      colorPicker.style("padding", "0");
      colorPicker.style("background", "transparent");
    }
  };

  p.draw = () => {
    p.background(8, 12, 14);
    p.noStroke();

    let base = getBaseColor();
    let br = p.red(base);
    let bg = p.green(base);
    let bb = p.blue(base);

    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        if (grid[i][j] === 1) {
          let t = p.constrain(ageGrid[i][j] / MAX_AGE, 0, 1);
          // Young: dim base color → Old: bright white-tinted glow
          let cr = p.lerp(br * 0.3, p.min(br + 80, 255), t);
          let cg = p.lerp(bg * 0.3, p.min(bg + 80, 255), t);
          let cb = p.lerp(bb * 0.3, p.min(bb + 80, 255), t);
          let ca = p.lerp(160, 255, t);
          p.fill(cr, cg, cb, ca);
          p.rect(i * cellSize, j * cellSize, cellSize - 1, cellSize - 1);
        }
      }
    }

    if (running) step();

    // HUD
    let hudLines = [
      running ? "▶ Playing" : "⏸ Paused",
      "Click/drag · draw",
      "R · randomize",
      "C · clear",
      "Space · pause",
      "S · save png",
      "Color:",
    ];
    let fontSize = p.width * 0.011;
    let lineH = fontSize * 1.5;
    let padX = fontSize * 0.8;
    let padY = fontSize * 0.6;
    let hudW = fontSize * 12;
    let hudH = padY * 2 + hudLines.length * lineH;
    let hudX = p.width - hudW - p.width * 0.015;
    let hudY = p.height * 0.015;

    p.push();
    p.textFont("monospace");
    p.fill(0, 0, 0, 180);
    p.noStroke();
    p.rect(hudX, hudY, hudW, hudH, 6);
    p.textSize(fontSize);
    p.textAlign(p.LEFT, p.TOP);
    for (let i = 0; i < hudLines.length; i++) {
      let isStatus = i === 0;
      p.fill(0, isStatus ? 230 : 212, isStatus ? 200 : 170, isStatus ? 255 : 160);
      p.text(hudLines[i], hudX + padX, hudY + padY + i * lineH);
    }
    p.pop();

    // Position color picker next to "Color:" label
    if (colorPicker) {
      let pickerX = hudX + padX + fontSize * 5;
      let pickerY = hudY + padY + (hudLines.length - 1) * lineH - 2;
      colorPicker.position(pickerX, pickerY);
    }
  };

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    let oldGrid = grid;
    let oldAge = ageGrid;
    let oldCols = cols;
    let oldRows = rows;
    initGrids();
    for (let i = 0; i < Math.min(oldCols, cols); i++) {
      for (let j = 0; j < Math.min(oldRows, rows); j++) {
        grid[i][j] = oldGrid[i][j];
        ageGrid[i][j] = oldAge[i][j];
      }
    }
  };

  p.mousePressed = () => {
    paintCell(p.mouseX, p.mouseY);
  };

  p.mouseDragged = () => {
    paintCell(p.mouseX, p.mouseY);
  };

  p.keyPressed = () => {
    if (p.key === " ") {
      running = !running;
    } else if (p.key === "r" || p.key === "R") {
      randomize();
    } else if (p.key === "c" || p.key === "C") {
      clearGrid();
    } else if (p.key === "s") {
      p.saveCanvas("game-of-life", "png");
    }
  };
}

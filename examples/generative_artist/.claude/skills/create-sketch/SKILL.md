---
name: create-sketch
description: Build a gallery-compatible P5.js sketch from a description or algorithm. Use this to produce the final sketch files (instance-mode sketch.js + meta.json) and register them in the gallery. For artistic philosophy and algorithm design, use /algorithmic-art first — then pass the result here.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
argument-hint: <description or algorithm to implement>
---

# Build Gallery Sketch

Build a gallery-compatible P5.js sketch from: **$ARGUMENTS**

This skill is the **technical builder** — it takes a concept and produces correctly structured, gallery-ready files. It does NOT do creative/philosophical design (that's `/algorithmic-art`'s job).

## What This Skill Does

- Converts any P5.js algorithm into **instance mode** (`function createSketch(p)`)
- Ensures **proportional sizing** (no magic pixel numbers)
- Ensures **responsive** canvas with `p.windowResized`
- Creates the correct **file structure** (`sketches/<slug>/sketch.js` + `meta.json`)
- **Registers** the sketch in `sketches/index.json`
- **Verifies** the output passes all conventions

## Input Sources

This skill accepts input from two paths:

1. **From `/algorithmic-art`** — An algorithm already designed with artistic philosophy. Convert it from global-mode P5.js into our instance-mode gallery format. The `/algorithmic-art` skill outputs global-mode code with `setup()`/`draw()` — you must wrap it in `function createSketch(p)` and prefix all P5 calls with `p.`.

2. **Direct description** — A simple natural language request like "a particle system with gravity" that doesn't need deep artistic philosophy.

## Step 1: Choose a Slug

Create a URL-friendly slug (e.g., `flowing-particles`, `noise-landscape`).

Check if it already exists:
```bash
ls sketches/
```

## Step 2: Create the Sketch Files

Create `sketches/<slug>/` with two files.

### sketch.js

Wrap all code in instance mode — this is **non-negotiable**:

```javascript
function createSketch(p) {
  // State variables here

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
  };

  p.draw = () => {
    // Rendering
  };

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    // Recalculate size-dependent values
  };
}
```

### Instance Mode Conversion Rules

When converting from global-mode P5.js (e.g., from `/algorithmic-art` output):

1. Wrap everything in `function createSketch(p) { ... }`
2. Prefix ALL p5 calls with `p.`:
   - Functions: `p.background()`, `p.fill()`, `p.ellipse()`, `p.noise()`, `p.random()`, `p.createVector()`, `p.color()`, `p.lerpColor()`, `p.colorMode()`, `p.map()`, `p.constrain()`, `p.lerp()`, `p.dist()`, `p.sin()`, `p.cos()`, `p.atan2()`, `p.sqrt()`, `p.abs()`, `p.floor()`, `p.ceil()`, `p.push()`, `p.pop()`, `p.translate()`, `p.rotate()`, `p.scale()`, `p.beginShape()`, `p.vertex()`, `p.endShape()`, `p.curveVertex()`, `p.bezierVertex()`, `p.noFill()`, `p.noStroke()`, `p.strokeWeight()`, `p.blendMode()`, `p.textSize()`, `p.textAlign()`, `p.text()`, `p.randomSeed()`, `p.noiseSeed()`, `p.randomGaussian()`, `p.noLoop()`, `p.loop()`, `p.redraw()`, `p.saveCanvas()`, `p.image()`, `p.loadImage()`, `p.tint()`, `p.noTint()`
   - Properties: `p.mouseX`, `p.mouseY`, `p.pmouseX`, `p.pmouseY`, `p.mouseIsPressed`, `p.width`, `p.height`, `p.windowWidth`, `p.windowHeight`, `p.frameCount`, `p.key`, `p.keyCode`, `p.keyIsPressed`
   - Constants: `p.PI`, `p.TWO_PI`, `p.HALF_PI`, `p.TAU`, `p.CENTER`, `p.CLOSE`, `p.HSB`, `p.RGB`, `p.DEGREES`, `p.RADIANS`, `p.ADD`, `p.BLEND`, `p.MULTIPLY`, `p.SCREEN`, `p.WEBGL`
   - Static methods stay as-is: `p5.Vector.fromAngle()`, `p5.Vector.add()`, etc.
3. Replace `createCanvas(W, H)` → `p.createCanvas(p.windowWidth, p.windowHeight)`
4. Add `p.windowResized` handler
5. Convert fixed sizes to proportional: `400` → `p.width * ratio`

### Mandatory Rules

1. **Proportional sizing** — NEVER use magic pixel numbers for positions or sizes
   - GOOD: `p.width * 0.5`, `p.height * 0.1`, `Math.min(p.width, p.height) * 0.02`
   - BAD: `400`, `50`, `800`
   - Exception: small values like `1` or `2` for stroke weight are fine

2. **Performant** — limit particle arrays, avoid per-frame object allocations, use `p.fill(r,g,b,a)` instead of creating `p.color()` objects in draw loops

3. **No external dependencies** — only P5.js (already loaded via CDN)

### meta.json

```json
{
  "title": "Human-readable title",
  "description": "One sentence: what it does + how to interact with it."
}
```

## Step 3: Register the Sketch

Read `sketches/index.json` and add the new slug. If the file doesn't exist, create it as `["<slug>"]`.

## Step 4: Verify

Read back the created files and check:
- [ ] `sketch.js` starts with `function createSketch(p)`
- [ ] ALL p5 calls prefixed with `p.` — search for bare `background(`, `fill(`, `ellipse(`, `noise(`, `random(`, `createVector(`
- [ ] No magic pixel numbers > 10 used for positions/sizes
- [ ] `p.windowResized` is implemented
- [ ] `meta.json` has title and description
- [ ] Slug is in `sketches/index.json`

## P5.js Quick Reference

### Canvas
- `p.createCanvas(w, h)` or `p.createCanvas(w, h, p.WEBGL)` for 3D
- `p.windowWidth`, `p.windowHeight` — viewport size
- `p.width`, `p.height` — canvas size

### Shapes
`p.rect()`, `p.ellipse()`, `p.circle()`, `p.line()`, `p.point()`, `p.triangle()`, `p.quad()`, `p.arc()`, `p.beginShape()`/`p.vertex()`/`p.endShape()`, 3D: `p.box()`, `p.sphere()`

### Color & Style
`p.background()`, `p.fill()`, `p.stroke()`, `p.noFill()`, `p.noStroke()`, `p.strokeWeight()`, `p.colorMode()`, `p.blendMode()`, `p.lerpColor()`

### Transform
`p.push()`/`p.pop()`, `p.translate()`, `p.rotate()`, `p.scale()`, 3D: `p.rotateX()`/`Y()`/`Z()`

### Math
`p.random()`, `p.randomGaussian()`, `p.noise()`, `p.map()`, `p.lerp()`, `p.constrain()`, `p.dist()`, `p.createVector()`, trig: `p.sin()`, `p.cos()`, `p.atan2()`

### Input
Mouse: `p.mouseX`, `p.mouseY`, `p.mouseIsPressed` | Keyboard: `p.key`, `p.keyCode`, `p.keyIsPressed`
Handlers: `p.mousePressed`, `p.mouseMoved`, `p.keyPressed`

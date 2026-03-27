---
name: initial-setup
description: P5.js conventions, performance patterns, and skill workflow for sketch creation
type: project
---

## Sketch Convention

All sketches use instance mode with `function createSketch(p)` pattern.
- Always prefix p5 calls with `p.` (e.g., `p.ellipse()`, `p.noise()`, `p.mouseX`)
- Always use proportional sizing: `p.width * 0.1` not `50`
- Always implement `p.windowResized` with `p.resizeCanvas(p.windowWidth, p.windowHeight)`
- Register every new sketch in `sketches/index.json`

## Performance Patterns (learned from /simplify reviews)

- Cache particle colors as r/g/b numbers on reset, use `p.fill(r, g, b, alpha)` — avoid `p.color()` in draw loops
- Call `p.noStroke()` once per frame in `p.draw`, not per-particle
- Use direct math instead of `p.map()` in hot loops: `let t = age / life; let alpha = 200 * (1 - t);`
- Reuse vectors: `this.acc.set(Math.cos(a) * mag, Math.sin(a) * mag)` instead of `p5.Vector.fromAngle(a).setMag(mag)`
- Store repeated color values as constants: `const BG = [10, 10, 18]; p.background(...BG);`

## Skill Workflow

- Use `/algorithmic-art` for artistic philosophy and algorithm concept development
- Use `/create-sketch` to produce the final gallery-compatible files
- `/algorithmic-art` outputs global-mode P5.js — must convert to instance mode via `/create-sketch`
- For simple requests, `/create-sketch` works standalone

# Generative Artist — Agent Teams Example

> P5.js generative art gallery with 2 specialized agents and complementary skills.

## Project

A vanilla HTML/CSS/JS gallery that:

1. Shows all P5.js sketches in a responsive grid of cards on the landing page
2. Each card has a thumbnail, title, and description
3. Clicking a card opens the sketch full-screen (100vw x 100vh)
4. A back button returns to the gallery

No server, no build step — just static files served from this directory.

## Team

| Role                 | Agent file                                | Owns                                      |
| -------------------- | ----------------------------------------- | ----------------------------------------- |
| **Web Developer**    | `.claude/agents/web-developer.md`         | `index.html`, `styles.css`, `app.js`      |
| **Generative Artist**| `.claude/agents/generative-artist.md`     | `sketches/*`                              |

## Skills

| Skill               | Role                    | Description                                                    |
| -------------------- | ----------------------- | -------------------------------------------------------------- |
| `/create-sketch`     | Technical builder       | Produces gallery-compatible files (instance mode, proportional) |
| `/algorithmic-art`   | Creative director       | Develops artistic philosophy, designs algorithms (marketplace)  |

**Workflow:** `/algorithmic-art` (think) → `/create-sketch` (build). For simple requests, `/create-sketch` works standalone.

## Tech Stack

- Vanilla HTML/CSS/JS (no frameworks)
- P5.js loaded from CDN: `https://cdn.jsdelivr.net/npm/p5@1.9.4/lib/p5.min.js`
- Modern browsers only (ES2020+)
- All sketches use **instance mode** so multiple can coexist
- `algorithmic-art` marketplace plugin from `anthropics/skills`

## Sketch Convention

Every sketch lives in `sketches/<slug>/` with:

```
sketches/
  flow-field/
    sketch.js      ← P5.js instance-mode sketch (function createSketch(p) { ... })
    meta.json      ← { "title": "...", "description": "..." }
```

Sketches are discovered via `sketches/index.json` — an array of slug strings.

### Sketch Rules

- **Instance mode only** — `function createSketch(p)`, all P5 calls prefixed with `p.`
- **Responsive** — use `p.windowWidth` / `p.windowHeight`, implement `p.windowResized`
- **Proportional** — use `p.width * 0.1` instead of magic numbers like `50`
- **Performant** — avoid per-frame allocations, cache colors as r/g/b, use direct math over `p.map()` in hot loops
- **Self-contained** — each sketch.js works with just P5.js loaded

## Rules

- The Web Developer NEVER edits files inside `sketches/`
- The Generative Artist NEVER edits `index.html`, `styles.css`, or `app.js`
- The Generative Artist uses `/create-sketch` to produce final sketch files
- The Generative Artist can use `/algorithmic-art` for creative concept development
- Each agent owns only the files listed above — no cross-editing

## How to Run This Example

### 1. Enable agent teams

Already configured in `.claude/settings.json`.

### 2. Launch Claude Code from this directory

```bash
cd examples/generative_artist
claude
```

### 3. Prompt the team

```
Create an agent team of 2 for this generative art gallery project.
Use the agent definitions in .claude/agents/:
- Web Developer (.claude/agents/web-developer.md) — builds the gallery UI
- Generative Artist (.claude/agents/generative-artist.md) — creates P5.js sketches

Each teammate should read their agent file for instructions.
Wait for all teammates to finish before reviewing.
```

### 4. Serve locally

```bash
python -m http.server 8000
# or
npx serve .
```

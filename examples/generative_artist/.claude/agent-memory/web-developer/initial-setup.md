---
name: initial-setup
description: Gallery web app patterns, architecture decisions, and quality conventions
type: project
---

## Architecture

- Dark theme gallery with CSS Grid layout, CSS custom properties in :root
- Sketches discovered via `sketches/index.json` → each `sketches/<slug>/meta.json`
- P5.js instance mode for sketch isolation, loaded once from CDN
- Dynamic script loading for sketch.js files via script tag injection

## Quality Patterns (learned from /simplify reviews)

- Fetch all meta.json in parallel via `Promise.allSettled` — not sequential
- Always check `res.ok` after fetch — HTTP 404 doesn't throw, only network errors do
- Use CSS classes for error messages, not inline styles
- Guard against rapid click races in `openSketch` with a staleness check (`openingSlug`)
- Keep focus-visible outlines on interactive elements for keyboard accessibility
- Combine identical CSS rules (e.g., `.gallery-loading, .gallery-empty`)
- Viewer visibility tracked via `.hidden` class + `aria-hidden` attribute — keep them in sync

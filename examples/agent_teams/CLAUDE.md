# Font Converter — Agent Teams Example

> Minimal example of the **Agent Teams** beta feature with 3 agents.

## Project

A single-page client-side tool that:

1. Accepts a font file (.otf or .ttf) via drag-and-drop
2. Converts it to .woff2 entirely in the browser
3. Returns the .woff2 file as a download

No server, no build step — just `index.html` + JS.

## Team

| Role              | Agent file                         | Owns                        |
| ----------------- | ---------------------------------- | --------------------------- |
| **Team Lead**     | `.claude/agents/team-lead.md`      | Coordination, final review  |
| **Frontend Dev**  | `.claude/agents/frontend-dev.md`   | `index.html`, `styles.css`  |
| **Font Engineer** | `.claude/agents/font-engineer.md`  | `converter.js`              |

## How to Run This Example

### 1. Enable agent teams

```json
// .claude/settings.json (project-level) or ~/.claude/settings.json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

### 2. Launch Claude Code from this directory

```bash
cd examples/agent_teams
claude
```

### 3. Prompt the team

```
Create an agent team of 3 for this font converter project.
Use the agent definitions in .claude/agents/:
- Team Lead (.claude/agents/team-lead.md) — coordinates work
- Frontend Dev (.claude/agents/frontend-dev.md) — builds the UI
- Font Engineer (.claude/agents/font-engineer.md) — builds converter.js

Each teammate should read their agent file for instructions.
Wait for all teammates to finish before reviewing.
```

## Tech Stack

- Vanilla HTML/CSS/JS (no frameworks)
- [woff2-encoder](https://github.com/nicolo-ribaudo/tc39-proposal-wasm-esm) or
  [fonttools via wasm](https://pyodide.org/) — whatever the font engineer picks,
  it must run 100 % client-side
- Modern browsers only (ES2020+)

## Rules

- No server-side code
- No build tools — everything loads from a CDN or is inlined
- Keep it minimal: one HTML file, one CSS file, one JS file
- Each agent owns only the files listed above — no cross-editing

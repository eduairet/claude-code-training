# Output Styles

- Output styles let you change Claude Code's behavior, tone, and response format by modifying the system prompt.
- You can create custom styles or choose from built-in ones to better suit your workflow and preferences.
- Styles are applied globally to all conversations and persist across sessions until changed.

## Built-in Styles

| Style           | Description                                                                                                     |
| --------------- | --------------------------------------------------------------------------------------------------------------- |
| **Default**     | Standard system prompt for software engineering tasks                                                           |
| **Explanatory** | Adds educational "Insights" between tasks — helps you understand implementation choices and codebase patterns   |
| **Learning**    | Collaborative learn-by-doing mode — shares "Insights" and asks you to contribute code via `TODO(human)` markers |

## How They Work

Output styles **modify Claude Code's system prompt** directly:

- All styles exclude "efficient output" instructions (e.g., respond concisely)
- Custom styles exclude coding instructions (e.g., verify with tests) **unless** `keep-coding-instructions: true`
- Style instructions are appended to the end of the system prompt
- Periodic reminders enforce adherence during conversation

## Changing Your Style

### Via menu

Run `/config` → select **Output style**. Saved to `.claude/settings.local.json`.

### Via settings file

```json
{
  "outputStyle": "Explanatory"
}
```

Changes take effect on the **next session** (system prompt is set at session start for prompt caching).

## Creating Custom Styles

Custom styles are Markdown files with frontmatter, saved to:

- **User level:** `~/.claude/output-styles/`
- **Project level:** `.claude/output-styles/`

### Template

```markdown
---
name: My Custom Style
description: A brief description shown in the /config picker
keep-coding-instructions: false
---

# Custom Style Instructions

You are an interactive CLI tool that helps users with...

## Specific Behaviors

[Define how the assistant should behave...]
```

### Frontmatter Options

| Field                      | Purpose                                                 | Default                 |
| -------------------------- | ------------------------------------------------------- | ----------------------- |
| `name`                     | Display name                                            | Inherits from file name |
| `description`              | Shown in `/config` picker                               | None                    |
| `keep-coding-instructions` | Keep Claude Code's default coding-related system prompt | `false`                 |

## Comparisons

| Feature                      | How it differs from Output Styles                                                              |
| ---------------------------- | ---------------------------------------------------------------------------------------------- |
| **CLAUDE.md**                | Does NOT edit the system prompt — added as a user message after it                             |
| **`--append-system-prompt`** | Appends to the system prompt but does NOT remove default instructions                          |
| **Agents**                   | Invoked for specific tasks; can set model, tools, and context — not just the system prompt     |
| **Skills**                   | Task-specific prompts invoked via `/skill-name`; output styles are always active once selected |

## Status Line

The status line is a customizable bar at the bottom of Claude Code that runs any shell script you configure. It receives JSON session data on stdin and displays whatever your script prints.

### Setup

- **Quick:** Use `/statusline` with a natural language description (e.g., `/statusline show model name and context percentage with a progress bar`)
- **Manual:** Add a `statusLine` field to `~/.claude/settings.json`:

```json
{
  "statusLine": {
    "type": "command",
    "command": "~/.claude/statusline.sh",
    "padding": 2
  }
}
```

- `command` can be a script path or inline shell command (e.g., using `jq`)
- `padding` (optional) adds extra horizontal spacing in characters (default: `0`)
- Disable by running `/statusline clear` or removing the `statusLine` field from settings

### When It Updates

- After each new assistant message, permission mode change, or vim mode toggle
- Debounced at 300ms — rapid changes batch together
- If a new update triggers while your script is still running, the in-flight execution is cancelled

### Available Data (JSON via stdin)

| Field                                    | Description                                          |
| ---------------------------------------- | ---------------------------------------------------- |
| `model.id`, `model.display_name`         | Current model identifier and display name            |
| `workspace.current_dir`, `project_dir`   | Current working dir and launch dir                   |
| `cost.total_cost_usd`                    | Total session cost in USD                            |
| `cost.total_duration_ms`                 | Wall-clock time since session start                  |
| `cost.total_api_duration_ms`             | Time spent waiting for API responses                 |
| `cost.total_lines_added/removed`         | Lines of code changed                                |
| `context_window.used_percentage`         | Pre-calculated % of context window used              |
| `context_window.remaining_percentage`    | Pre-calculated % remaining                           |
| `context_window.context_window_size`     | Max context size (200k default, 1M for extended)     |
| `context_window.current_usage`           | Token counts from last API call (null before first)  |
| `session_id`                             | Unique session identifier                            |
| `output_style.name`                      | Current output style name                            |
| `vim.mode`                               | `NORMAL` or `INSERT` (only when vim mode is enabled) |
| `agent.name`                             | Agent name (only with `--agent` flag)                |
| `worktree.*`                             | Worktree name, path, branch (only in `--worktree`)  |

### Script Output Capabilities

- **Multiple lines:** each `echo`/`print` creates a separate row
- **Colors:** ANSI escape codes (e.g., `\033[32m` for green)
- **Clickable links:** OSC 8 escape sequences (requires compatible terminal like iTerm2, Kitty, WezTerm)

### Example: Context Progress Bar (Bash)

```bash
#!/bin/bash
input=$(cat)
MODEL=$(echo "$input" | jq -r '.model.display_name')
PCT=$(echo "$input" | jq -r '.context_window.used_percentage // 0' | cut -d. -f1)
BAR_WIDTH=10
FILLED=$((PCT * BAR_WIDTH / 100))
EMPTY=$((BAR_WIDTH - FILLED))
BAR=""
[ "$FILLED" -gt 0 ] && BAR=$(printf "%${FILLED}s" | tr ' ' '▓')
[ "$EMPTY" -gt 0 ] && BAR="${BAR}$(printf "%${EMPTY}s" | tr ' ' '░')"
echo "[$MODEL] $BAR $PCT%"
```

### Windows

On Windows, Claude Code runs status line commands through Git Bash. You can invoke PowerShell from that shell:

```json
{
  "statusLine": {
    "type": "command",
    "command": "powershell -NoProfile -File C:/Users/username/.claude/statusline.ps1"
  }
}
```

### Tips

- **Test with mock input:** `echo '{"model":{"display_name":"Opus"},"context_window":{"used_percentage":25}}' | ./statusline.sh`
- **Cache slow operations** (like `git status`) to a temp file — your script runs frequently and slow commands cause lag
- **Keep output short** — the status bar has limited width
- Community projects: [ccstatusline](https://github.com/sirmalloc/ccstatusline), [starship-claude](https://github.com/martinemde/starship-claude)

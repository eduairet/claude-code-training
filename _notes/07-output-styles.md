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

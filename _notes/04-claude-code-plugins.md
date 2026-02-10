# Claude Code Plugins

Plugins are **self-contained extension packages** that bundle multiple components to enhance Claude Code. They're shareable across projects and teams, installable from marketplaces, and scoped to user, project, or local levels.

## Plugin Structure

```
my-plugin/
├── .claude-plugin/
│   └── plugin.json        # Manifest (only required field: name)
├── commands/              # Legacy slash commands (.md files)
├── skills/                # Skills (name/SKILL.md structure)
├── agents/                # Subagent definitions (.md files)
├── hooks/
│   └── hooks.json         # Event handler config
├── .mcp.json              # MCP server definitions
├── .lsp.json              # Language server configs
└── scripts/               # Hook/utility scripts
```

Components must live at the plugin root, **not** inside `.claude-plugin/`.

## The 6 Component Types

### 1. Skills (slash commands)

Create `/name` shortcuts invocable by you or Claude. Each skill is a directory with a `SKILL.md` file, optionally with reference files and scripts.

```
skills/
├── pdf-processor/
│   ├── SKILL.md
│   ├── reference.md (optional)
│   └── scripts/ (optional)
└── code-reviewer/
    └── SKILL.md
```

### 2. Agents (subagents)

Specialized subagents for specific tasks. Defined as markdown files with YAML frontmatter (`name`, `description`) and a system prompt body. Claude can invoke them automatically based on context.

```markdown
---
name: agent-name
description: What this agent specializes in and when Claude should invoke it
---

Detailed system prompt for the agent describing its role, expertise, and behavior.
```

### 3. Hooks (event handlers)

Respond to Claude Code lifecycle events. Three hook types:

- **command** — run shell scripts
- **prompt** — evaluate with an LLM (uses `$ARGUMENTS` placeholder)
- **agent** — run an agentic verifier with tools

Available events:

| Event                | When it fires                            |
| -------------------- | ---------------------------------------- |
| `PreToolUse`         | Before Claude uses any tool              |
| `PostToolUse`        | After Claude successfully uses a tool    |
| `PostToolUseFailure` | After tool execution fails               |
| `PermissionRequest`  | When a permission dialog is shown        |
| `UserPromptSubmit`   | When user submits a prompt               |
| `Notification`       | When Claude Code sends notifications     |
| `Stop`               | When Claude attempts to stop             |
| `SubagentStart`      | When a subagent is started               |
| `SubagentStop`       | When a subagent attempts to stop         |
| `SessionStart`       | At the beginning of sessions             |
| `SessionEnd`         | At the end of sessions                   |
| `PreCompact`         | Before conversation history is compacted |
| `TeammateIdle`       | When a teammate is about to go idle      |
| `TaskCompleted`      | When a task is being marked as completed |

Example hook config:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/scripts/format-code.sh"
          }
        ]
      }
    ]
  }
}
```

### 4. MCP Servers

Bundle Model Context Protocol servers to connect Claude with external tools/services. Start automatically when the plugin is enabled, appearing as standard tools in Claude's toolkit.

```json
{
  "mcpServers": {
    "plugin-database": {
      "command": "${CLAUDE_PLUGIN_ROOT}/servers/db-server",
      "args": ["--config", "${CLAUDE_PLUGIN_ROOT}/config.json"],
      "env": {
        "DB_PATH": "${CLAUDE_PLUGIN_ROOT}/data"
      }
    }
  }
}
```

### 5. LSP Servers

Provide Language Server Protocol integration for real-time code intelligence — instant diagnostics, go-to-definition, find references, hover info.

```json
{
  "go": {
    "command": "gopls",
    "args": ["serve"],
    "extensionToLanguage": {
      ".go": "go"
    }
  }
}
```

Required fields: `command`, `extensionToLanguage`. Optional: `args`, `transport`, `env`, `initializationOptions`, `settings`, `restartOnCrash`, `maxRestarts`, timeouts.

Official LSP plugins: **pyright-lsp** (Python), **typescript-lsp**, **rust-lsp**.

### 6. Output Styles

Custom output style files that change how Claude presents its responses. Placed in an `outputStyles/` directory or referenced via `plugin.json`.

## plugin.json Manifest

Optional — if omitted, Claude auto-discovers components in default locations. The only required field is `name`.

```json
{
  "name": "plugin-name",
  "version": "1.2.0",
  "description": "Brief plugin description",
  "author": {
    "name": "Author Name",
    "email": "author@example.com",
    "url": "https://github.com/author"
  },
  "homepage": "https://docs.example.com/plugin",
  "repository": "https://github.com/author/plugin",
  "license": "MIT",
  "keywords": ["keyword1", "keyword2"],
  "commands": ["./custom/commands/special.md"],
  "agents": "./custom/agents/",
  "skills": "./custom/skills/",
  "hooks": "./config/hooks.json",
  "mcpServers": "./mcp-config.json",
  "outputStyles": "./styles/",
  "lspServers": "./.lsp.json"
}
```

Custom paths **supplement** default directories — they don't replace them. All paths must be relative and start with `./`.

The `${CLAUDE_PLUGIN_ROOT}` env var resolves to the plugin's absolute path at runtime.

## Installation & Scopes

```bash
claude plugin install <plugin>@<marketplace> --scope <scope>
```

| Scope     | Settings File                 | Use Case                         |
| --------- | ----------------------------- | -------------------------------- |
| `user`    | `~/.claude/settings.json`     | Personal, all projects (default) |
| `project` | `.claude/settings.json`       | Team-shared via version control  |
| `local`   | `.claude/settings.local.json` | Project-specific, gitignored     |
| `managed` | `managed-settings.json`       | Org-managed (read-only)          |

### CLI Commands

| Command                            | Description                               |
| ---------------------------------- | ----------------------------------------- |
| `claude plugin install <plugin>`   | Install a plugin                          |
| `claude plugin uninstall <plugin>` | Remove a plugin (aliases: `remove`, `rm`) |
| `claude plugin enable <plugin>`    | Enable a disabled plugin                  |
| `claude plugin disable <plugin>`   | Disable without uninstalling              |
| `claude plugin update <plugin>`    | Update to latest version                  |

All accept `--scope` flag (`user`, `project`, `local`).

## Caching & Security

Plugins are **copied to a cache directory** at install time (not used in-place):

- Paths can't traverse outside the plugin root (`../` won't work)
- Symlinks are followed during copy (workaround for external deps)
- For development, use `claude --plugin-dir ./my-plugin` to load from a local directory

Plugin sources can be: relative path, npm, pip, URL (`.git`), or GitHub shorthand (`owner/repo`).

## Official Plugins

13 official plugins from the [Anthropic repo](https://github.com/anthropics/claude-code/tree/main/plugins):

| Plugin                        | Purpose                                                       |
| ----------------------------- | ------------------------------------------------------------- |
| **code-review**               | 5 parallel specialist agents with confidence scoring          |
| **feature-dev**               | 7-phase feature development workflow                          |
| **plugin-dev**                | Plugin creation toolkit (8-phase workflow)                    |
| **pr-review-toolkit**         | 6 specialized review agents (comments, tests, types, quality) |
| **security-guidance**         | PreToolUse hook detecting injection, XSS, eval, etc.          |
| **hookify**                   | Create custom hooks via `/hookify`                            |
| **commit-commands**           | `/commit`, `/commit-push-pr`, `/clean_gone`                   |
| **agent-sdk-dev**             | Agent SDK development kit with `/new-sdk-app`                 |
| **frontend-design**           | Auto-invoked skill for production-grade UI design             |
| **ralph-wiggum**              | Autonomous iteration loops (`/ralph-loop`)                    |
| **explanatory-output-style**  | SessionStart hook for implementation context                  |
| **learning-output-style**     | Interactive learning mode at decision points                  |
| **claude-opus-4-5-migration** | Automated model migration helper                              |

## Debugging

- `claude --debug` (or `/debug` in TUI) — shows plugin loading details, errors, and component registration
- `/plugin` Errors tab — shows LSP and MCP failures
- `claude plugin validate` — checks manifest syntax

### Common Issues

| Issue                      | Solution                                                    |
| -------------------------- | ----------------------------------------------------------- |
| Plugin not loading         | Validate JSON syntax with `claude plugin validate`          |
| Commands not appearing     | Ensure `commands/` is at root, not inside `.claude-plugin/` |
| Hooks not firing           | `chmod +x script.sh` and check event names (case-sensitive) |
| MCP server fails           | Use `${CLAUDE_PLUGIN_ROOT}` for all paths                   |
| LSP "Executable not found" | Install the language server binary separately               |

## Sources

- [Plugins Reference — Official Docs](https://code.claude.com/docs/en/plugins-reference)
- [Plugins README — GitHub](https://github.com/anthropics/claude-code/blob/main/plugins/README.md)
- [Official Plugin Directory — GitHub](https://github.com/anthropics/claude-plugins-official)

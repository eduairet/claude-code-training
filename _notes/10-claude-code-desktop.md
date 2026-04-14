# Claude Code Desktop

The Claude Desktop app provides Claude Code through a graphical interface — no terminal required. It runs the same engine as the CLI but adds visual diff review, live app preview, parallel sessions, PR monitoring, scheduled tasks, and computer use.

## Requirements

- **Platforms**: macOS and Windows only (no Linux).
- **Subscription**: Pro, Max, Team, or Enterprise (free plan excluded).
- **Git**: required for local sessions. On Windows, install [Git for Windows](https://git-scm.com/downloads/win).

## Installation

Download for [macOS](https://claude.ai/api/desktop/darwin/universal/dmg/latest/redirect) or [Windows](https://claude.ai/api/desktop/win32/x64/setup/latest/redirect). Sign in with your Anthropic account. The app includes Claude Code — no need for Node.js or the CLI.

## The Three Tabs

| Tab        | Purpose                                               |
| ---------- | ----------------------------------------------------- |
| **Chat**   | General conversation, no file access (like claude.ai) |
| **Cowork** | Autonomous background agent in a cloud VM             |
| **Code**   | Interactive coding assistant with local file access   |

## Starting a Session (Code Tab)

1. Choose an **environment**: Local, Remote (cloud, persists if you close the app), or SSH.
2. Select a **project folder**.
3. Pick a **model** (locked once the session starts).
4. Set a **permission mode** and type your task.

## Permission Modes

| Mode                          | Behavior                                                               |
| ----------------------------- | ---------------------------------------------------------------------- |
| **Ask permissions** (default) | Asks before every edit or command. You review diffs and accept/reject. |
| **Auto accept edits**         | Auto-accepts file edits; still asks before terminal commands.          |
| **Plan mode**                 | Explores and proposes a plan without editing code.                     |
| **Auto**                      | Executes with background safety checks (Team/Enterprise/API only).     |
| **Bypass permissions**        | No prompts. Only use in sandboxed environments.                        |

## Desktop-Specific Features

- **Visual Diff Review** — Click the `+12 -1` indicator to review changes file by file, comment on lines, or ask Claude to self-review with **Review code**.
- **Live App Preview** — Embedded browser with a dev server. Claude auto-verifies changes by taking screenshots and testing the UI. Config in `.claude/launch.json`.
- **PR Monitoring** — CI status bar with **Auto-fix** (fixes failing checks) and **Auto-merge** (squash-merges when green). Requires `gh` CLI.
- **Parallel Sessions** — Each session gets its own Git worktree for isolation.
- **Computer Use** (Research Preview) — Claude controls your screen: clicks, types, scrolls. For native apps, simulators, or tools without a CLI. Pro/Max only.
- **Scheduled Tasks** — Recurring tasks like daily code reviews or weekly dependency audits.
- **Connectors** — Integrations for Slack, GitHub, Linear, Notion, Google Calendar, and more.
- **Dispatch** — Route tasks from the Cowork tab (or your phone) to Code sessions automatically. Pro/Max only.
- **Continue in Another Surface** — Move a session to Claude Code on the Web or open in your IDE.

## Adding Context

- `@filename` to pull a file into the conversation.
- Drag-and-drop or attach images, PDFs, and other files.
- `/` or **+** → **Slash commands** for skills and plugins.

## Shared Configuration with CLI

Desktop and CLI share: CLAUDE.md files, MCP servers (`~/.claude.json` or `.mcp.json`), hooks, skills, and settings. Run `/desktop` in the CLI to move a session to the desktop app.

> MCP servers in `claude_desktop_config.json` (Chat tab) are separate from Code tab. Use `~/.claude.json` or `.mcp.json` for Claude Code.

## CLI vs Desktop

| Feature                                           | CLI                               | Desktop                          |
| ------------------------------------------------- | --------------------------------- | -------------------------------- |
| Third-party providers (Bedrock, Vertex)           | Yes                               | No                               |
| File attachments (images, PDFs)                   | No                                | Yes                              |
| Visual diff review / Live preview / PR monitoring | No                                | Yes                              |
| Parallel sessions                                 | Separate terminals + `--worktree` | Sidebar tabs with auto worktrees |
| Computer use                                      | macOS only via `/mcp`             | macOS and Windows                |
| Scripting and automation (`--print`, SDK)         | Yes                               | No                               |

## Working from Mobile

The Claude app for [iOS](https://apps.apple.com/us/app/claude-by-anthropic/id6473753684) and [Android](https://play.google.com/store/apps/details?id=com.anthropic.claude) extends your Desktop workflow when you're away from your computer:

- **[Dispatch](https://support.claude.com/en/articles/13947068)** — Message a task from your phone and it spawns a Code session on your Desktop. Push notifications on completion. Pro/Max only.
- **[Remote Control](https://code.claude.com/docs/en/remote-control)** — Steer a running local session from your phone or browser. Start with `claude remote-control`.
- **Cloud Sessions** — Start or monitor remote sessions from the mobile app. Tasks persist if you close the app.

See [Platforms and integrations](https://code.claude.com/docs/en/platforms) for the full comparison of remote access options.

## Troubleshooting

- **403 / auth errors**: sign out and back in; verify paid subscription.
- **Blank screen**: restart the app; check for updates.
- **Tools not found**: check PATH in shell profile; restart the app.
- **Git errors (Windows)**: install [Git for Windows](https://git-scm.com/downloads/win) and restart.

More help: [GitHub Issues](https://github.com/anthropics/claude-code/issues) | [Claude Support](https://support.claude.com/)

## Sources

- [Get started with the desktop app](https://code.claude.com/docs/en/desktop-quickstart)
- [Use Claude Code Desktop](https://code.claude.com/docs/en/desktop)
- [Advanced setup](https://code.claude.com/docs/en/setup)

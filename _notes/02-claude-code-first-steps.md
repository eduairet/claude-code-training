# Claude Code first steps

## Getting started with Claude Code

- Check the [Claude Code official documentation](https://code.claude.com/docs/) for installation and setup instructions.
- You can use it either with a subscription or with an API key, depending on your preference, but if you decide to use an API key, make sure to keep it secure and do not share it publicly, and also set appropriate usage limits to avoid unexpected charges.
- If you're using the CLI, you can start a new project by navigating to your project directory and running:

  ```bash
  cd path/to/your/project
  claude
  ```

- Now you can start claude with your project context loaded.

  ```bash
  /init
  ```

  - This will skim through your project files and build the initial context for your coding session in a `CLAUDE.md` file.

- You can connect Model Context Protocols to your project by following the instructions in the [Claude Code documentation](https://code.claude.com/docs/model-context-protocols/).
  - For example, you can connect the Postman MCP[^1] to your project with:

    ```bash
    claude mcp add --transport http postman https://mcp.postman.com/minimal --header "Authorization: Bearer YOUR_POSTMAN_API_KEY"
    ```

    - If you'd like to install it at user level instead of locally, add the `-s user` flag.
    - To remove it later, use:

      ```bash
      claude mcp remove postman # use -s user/local if you want to select a level
      ```

  - After adding the MCP and restarting Claude Code, it will be able to:
    - Access your Postman workspaces and collections
    - Create and run API tests
    - Manage environments
    - Automate testing workflows
    - Check the documentation for more features!

- Check your connected MCPs with:

  ```bash
  claude mcp list
  ```

  - Or if in the Claude Code REPL:
    ```bash
    /mcp
    ```

## Customizing context

- You can customize the context Claude Code builds by editing the `CLAUDE.md` file generated in your project root or by adding additional context files, most commonly known as "memory files".

- **Memory types in Claude Code:**

  | Memory Type                | Location                               | Scope              | Purpose                                       |
  | -------------------------- | -------------------------------------- | ------------------ | --------------------------------------------- |
  | **User memory**            | `~/.claude/CLAUDE.md`                  | All your projects  | Personal preferences (code style, shortcuts)  |
  | **Project memory**         | `./CLAUDE.md` or `./.claude/CLAUDE.md` | Team (via git)     | Project architecture, coding standards        |
  | **Project rules**          | `./.claude/rules/*.md`                 | Team (via git)     | Modular topic-specific instructions           |
  | **Project memory (local)** | `./CLAUDE.local.md`                    | Just you (project) | Personal sandbox URLs, test data (gitignored) |
  - Use `/memory` to view loaded memory files or edit them directly.
  - See the [official memory documentation](https://code.claude.com/docs/en/memory) for more details.

- The most common way to add context is to create a `.claude` directory in your project root and add markdown files there (e.g., `api_overview.md`, `data_models.md`).
- Another common approach is to create a `memory/` directory to store relevant information that Claude Code can reference during your coding sessions.
- Claude automatically checks all the `CLAUDE.md`, `.claude/`, and `memory/` files when building context for your coding sessions, but you can also specify when to use depending on the task at hand.
  ```bash
  /use CLAUDE.md
  /use .claude/api_overview.md
  /use memory/data_models.md
  ```
- Remember that Claude is going to reference these files when making decisions, so keep them up to date and relevant to your project, and keep them specific to avoid context pollution and costly context usage.

## Plan mode

- You can enable Plan mode in Claude Code to allow it to create a step-by-step plan before executing any code changes.
- To enable Plan mode, use the command:

  ```bash
  /plan
  ```

- This will prompt Claude Code to outline its intended approach before making any modifications to your codebase.
- Sometimes after creating a plan is better to restart the session to ensure Claude Code has a fresh context.

## Selecting models

- You can select different Claude models for your coding sessions depending on your needs.
- To select a model, use the command:

  ```bash
  /model
  ```

  - This will show you a list of available models to choose from.

### Available models

| Model                | Strengths                                                | Best for                                                                                       |
| -------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **Claude Opus 4.5**  | Most capable, strongest reasoning, nuanced understanding | Complex architecture decisions, difficult debugging, multi-file refactoring, agentic workflows |
| **Claude Sonnet 4**  | Balanced performance and speed, reliable coding          | Everyday coding tasks, code reviews, writing tests, documentation                              |
| **Claude Haiku 3.5** | Fastest, most cost-effective                             | Simple queries, quick fixes, syntax questions, small edits                                     |

### When to use each model

- **Opus 4.5**: Choose when tackling complex problems that require deep reasoning—designing system architecture, debugging intricate issues, or when you need Claude to autonomously explore and modify multiple files. It excels at tasks requiring judgment and nuance.

- **Sonnet 4**: The default choice for most coding work. Use it for implementing features, writing and fixing tests, code reviews, and general development tasks. It offers a good balance of capability and responsiveness.

- **Haiku 3.5**: Ideal for quick interactions—asking syntax questions, making small targeted edits, or when you need fast responses and cost efficiency matters. Great for high-volume, straightforward tasks.

## Clean the context

- `/clear` - Resets the conversation completely. This removes all previous messages and context, giving you a fresh start. Useful when you want to begin a new task without any prior conversation history affecting responses.
- `/compact` - Summarizes the current conversation to reduce token usage while preserving important context. The conversation history gets condensed into a summary, freeing up context space. Useful for long sessions where you want to continue working but need to reduce memory usage.
- Key difference: - `/clear` erases everything, while `/compact` preserves essential context in compressed form.

## Create sub-agents

- Sub-agents are specialized Claude instances that run in parallel to handle specific tasks independently from your main conversation.
- They're useful for:
  - Running long tasks in the background while you continue working
  - Exploring different parts of a codebase simultaneously
  - Delegating research or investigation tasks
  - Parallelizing work that doesn't have dependencies

- To view and manage sub-agents, use:

  ```bash
  /agents
  ```

  - This shows all running and completed sub-agents in your session.

- Claude Code automatically creates sub-agents when appropriate (e.g., for complex exploration tasks), but you can also request them explicitly by asking Claude to "run this in the background" or "explore this while I continue working."

- Sub-agents have their own context and return results to the main conversation when complete.

## Configure settings

- Claude Code settings control behavior, permissions, and preferences for your coding sessions.
- To open the settings menu, use:

  ```bash
  /config
  ```

  - This opens an interactive menu to configure various options.

- Settings are stored at different levels:
  - **User level** (`~/.claude/settings.json`): Applies to all your projects
  - **Project level** (`.claude/settings.json`): Applies only to the current project

- Common settings you can configure:
  - **Allowed/disallowed tools**: Control which tools Claude can use automatically
  - **Auto-approval patterns**: Set bash commands that don't require confirmation
  - **Model preferences**: Set your default model
  - **Theme and display options**: Customize the CLI appearance

- You can also edit settings files directly for more control:

  ```bash
  claude config # Opens settings in your default editor
  ```

- To view current configuration:

  ```bash
  /config show
  ```

## Claude hooks

- Hooks are shell commands that automatically execute in response to specific Claude Code events.
- They allow you to customize and extend Claude Code's behavior without modifying core functionality.

- **Available hook events:**
  - `PreToolUse`: Runs before a tool is executed (can block or modify)
  - `PostToolUse`: Runs after a tool completes
  - `Notification`: Runs when Claude sends a notification
  - `Stop`: Runs when Claude stops generating
  - `SubagentStop`: Runs when a sub-agent completes

- Hooks are configured in `~/.claude/settings.json` or `.claude/settings.json`:

  ```json
  {
    "hooks": {
      "PostToolUse": [
        {
          "matcher": "Write",
          "hooks": [
            {
              "type": "command",
              "command": "powershell -Command \"docker run --rm -v \\\"${PWD}/output:/output\\\" color-hook\""
            }
          ]
        },
        {
          "matcher": "Edit",
          "hooks": [
            {
              "type": "command",
              "command": "powershell -Command \"docker run --rm -v \\\"${PWD}/output:/output\\\" color-hook\""
            }
          ]
        }
      ]
    }
  }
  ```

- **Common use cases:**
  - Auto-format files after Claude writes them
  - Run linters before committing code
  - Send notifications when long tasks complete
  - Log tool usage for auditing
  - Block certain operations based on custom rules

- Hooks receive context via environment variables (e.g., `$CLAUDE_FILE_PATH`, `$CLAUDE_TOOL_NAME`).

- If a `PreToolUse` hook exits with a non-zero status, it blocks the tool from executing.

## Rewinding and Checkpointing

- Claude Code automatically tracks file edits as you work, allowing you to undo changes and rewind to previous states.
- Every user prompt creates a new checkpoint, and checkpoints persist across sessions.

- **How to rewind:**
  - Press `Esc` twice (`Esc` + `Esc`) or use the `/rewind` command to open the rewind menu.

- **Restore options:**

  | Option                         | What it does                                       |
  | ------------------------------ | -------------------------------------------------- |
  | **Conversation only**          | Rewind context while keeping code changes          |
  | **Code only**                  | Revert file changes while keeping the conversation |
  | **Both code and conversation** | Full reset to a prior point in the session         |

- **What gets tracked:**
  - File edits via Claude's tools (Edit, Write)
  - New file creation
  - File deletions via edit tools

- **Limitations:**
  - Bash command changes (`rm`, `mv`, `cp`) are **not tracked** and cannot be undone
  - External/manual changes outside Claude Code are not captured
  - Not a replacement for version control (Git) — think of checkpoints as "local undo"

- See the [official checkpointing documentation](https://code.claude.com/docs/en/checkpointing) for more details.

## Custom Commands (Skills)

- Custom commands let you create reusable prompts invoked with `/command-name`.
- **Slash commands have been merged into skills** — existing `.claude/commands/` files still work, but skills add extra features.

### Where to store commands/skills

| Location     | Path                               | Scope             |
| ------------ | ---------------------------------- | ----------------- |
| **Personal** | `~/.claude/skills/<name>/SKILL.md` | All your projects |
| **Project**  | `.claude/skills/<name>/SKILL.md`   | This project only |
| **Legacy**   | `.claude/commands/<name>.md`       | Still works       |

### Creating a skill

1. Create the skill directory:

   ```bash
   mkdir -p ~/.claude/skills/my-skill
   ```

2. Create `SKILL.md` with YAML frontmatter and instructions:

   ```yaml
   ---
   name: fix-issue
   description: Fix a GitHub issue by number
   disable-model-invocation: true
   ---

   Fix GitHub issue $ARGUMENTS:
   1. Read the issue description
   2. Implement the fix
   3. Write tests
   4. Create a commit
   ```

3. Invoke with `/fix-issue 123`

### Key frontmatter options

| Field                      | Purpose                                                    |
| -------------------------- | ---------------------------------------------------------- |
| `name`                     | Becomes the `/slash-command` name                          |
| `description`              | Helps Claude decide when to auto-load the skill            |
| `disable-model-invocation` | Set `true` to prevent Claude from triggering automatically |
| `user-invocable`           | Set `false` to hide from `/` menu (Claude-only)            |
| `allowed-tools`            | Tools Claude can use without permission when skill active  |
| `context`                  | Set to `fork` to run in a subagent                         |

### Using arguments

- `$ARGUMENTS` — All arguments passed to the skill
- `$ARGUMENTS[0]` or `$0` — First argument
- `$ARGUMENTS[1]` or `$1` — Second argument, etc.

### Supporting files

Skills can include multiple files for templates, examples, or scripts:

```
my-skill/
├── SKILL.md           # Main instructions (required)
├── template.md        # Template for Claude to fill in
└── scripts/
    └── helper.py      # Script Claude can execute
```

- See the [official skills documentation](https://code.claude.com/docs/en/skills) for more details.

## Claude Code LSP - Language Server Protocol

- LSP gives Claude real-time code intelligence while working on your codebase.
- Instead of searching files with grep (which can take 45+ seconds), LSP provides instant navigation in ~50ms.

### What LSP provides

- **Instant diagnostics** — Claude sees errors and warnings immediately after each edit
- **Code navigation** — go to definition, find references, hover information
- **Language awareness** — type information and documentation for code symbols

### How to enable LSP

1. **Install the language server binary** for your language (LSP plugins don't include the server):

   | Language   | Install command                                                                              |
   | ---------- | -------------------------------------------------------------------------------------------- |
   | Python     | `pip install pyright` or `npm install -g pyright`                                            |
   | TypeScript | `npm install -g typescript-language-server typescript`                                       |
   | Rust       | [rust-analyzer installation guide](https://rust-analyzer.github.io/manual.html#installation) |
   | Go         | `go install golang.org/x/tools/gopls@latest`                                                 |

2. **Install the LSP plugin** from the marketplace:

   ```bash
   /plugin  # Then search for "lsp" in the Discover tab
   ```

   - You can check installed plugins by navigating with the left and right arrow keys to the Installed tab.

3. **Enable LSP** (if not already enabled):
   ```bash
   ENABLE_LSP_TOOL=1 claude
   ```
   Or add `export ENABLE_LSP_TOOL=1` to your shell profile for permanent enablement.

### Supported languages

Python, TypeScript, Go, Rust, Java, C/C++, C#, PHP, Kotlin, Ruby, HTML/CSS, and more via community plugins.

### Creating custom LSP plugins

If your language isn't covered, create a `.lsp.json` in your plugin:

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

- See the [official plugins reference](https://code.claude.com/docs/en/plugins-reference) for LSP configuration details.

## References

[^1]: [Postman MCP Server Documentation](https://learning.postman.com/docs/developer/postman-api/postman-mcp-server/overview/)

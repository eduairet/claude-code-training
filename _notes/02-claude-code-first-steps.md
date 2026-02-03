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

- You can customize the context Claude Code builds by editing the `CLAUDE.md` file generated in your project root or by adding additional context files.
- The most common way to add context is to create a `.claude` directory in your project root and add markdown files there (e.g., `api_overview.md`, `data_models.md`).
- Another common approach is to create a `memory/` directory to store relevant information that Claude Code can reference during your coding sessions.
- Claude automatically checks all the `CLAUDE.md`, `.claude/`, and `memory/` files when building context for your coding sessions, but you can also specify when to use depending on the task at hand.
  ```bash
  /use CLAUDE.md
  /use .claude/api_overview.md
  /use memory/data_models.md
  ```

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

## References

[^1]: [Postman MCP Server Documentation](https://learning.postman.com/docs/developer/postman-api/postman-mcp-server/overview/)

# Claude Code first steps

## Getting started with Claude Code

- Check the [Claude Code official documentation](https://code.claude.com/docs/) for installation and setup instructions.
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

## Selecting models

- You can select different Claude models for your coding sessions depending on your needs.
- To select a model, use the command:
  ```bash
  /model
  ```

  - This will show you a list of available models to choose from.

[^1]: [Postman MCP Server Documentation](https://learning.postman.com/docs/developer/postman-api/postman-mcp-server/overview/)

# Model Context Protocol (MCP)

- A Model Context Protocol (MCP) is a standardized way to structure and format the context provided to large language models (LLMs) like Claude Code. It ensures that the model receives information in a consistent manner, improving its ability to understand and generate relevant responses.

  ```
  ┌──────────┐ API
  │ Postman  │──────┐
  └──────────┘      │
                  │
  ┌──────────┐ API ┌────────────┐         ┌────────────────┐
  │  Figma   │─────│ MCP Server │────────>│ Agent (client) │
  └──────────┘     └────────────┘ MCP     └────────────────┘
                  │             Protocol
  ┌──────────┐ API  │
  │ Database │──────┘
  └──────────┘
  ```

  - **Software Products** — These are external data sources and tools that expose their functionality through APIs. They hold the data or capabilities the agent needs access to (e.g. Postman for API testing, Figma for design, databases for structured data).
  - **MCP Server** — A lightweight program that acts as a bridge. It wraps the APIs of external tools and translates them into the standardized MCP format, exposing their resources and capabilities in a way the agent can understand like the [Figma MPC Server](https://help.figma.com/hc/en-us/articles/32132100833559-Guide-to-the-Figma-MCP-server) which is very useful to connect Figma with an agent like Claude Code to automate design tasks.
  - **Agent (Client) or commonly known as Host** — The AI application (e.g. Claude Code) that consumes the MCP Server. It discovers what tools and data the server offers, then calls them as needed to complete tasks. The connection between server and client uses the MCP protocol, so the agent doesn't need custom integration code for each tool (e.g. Postman, Figma).

- Benefits of MCP:
  - **Standardization** — Provides a uniform way to access diverse tools, simplifying integration.
  - **Scalability** — New tools can be added by creating MCP servers without changing the agent.
  - **Flexibility** — Agents can dynamically discover and use new capabilities at runtime.
  - **Improved Context Management** — Ensures that the model receives structured and relevant context, enhancing its performance.

- Use Cases:
  - **Automated Workflows** — Agents can orchestrate complex tasks across multiple tools (e.g. fetching data from a database, processing it, and updating a design in Figma).
  - **Dynamic Data Retrieval** — Agents can pull in real-time data from various sources to inform their responses.
  - **Cross-Tool Collaboration** — Enables seamless interaction between different software products through a single agent interface.

## Adding MCP to Claude Code

There are three ways to add an MCP server depending on the transport type:

### 1. Remote HTTP server (recommended for cloud services)

```bash
claude mcp add --transport http <name> <url>

# Example: Connect to Notion
claude mcp add --transport http notion https://mcp.notion.com/mcp
```

### 2. Remote SSE server (deprecated, prefer HTTP)

```bash
claude mcp add --transport sse <name> <url>

# Example: Connect to Asana
claude mcp add --transport sse asana https://mcp.asana.com/sse
```

### 3. Local stdio server (runs as a local process)

```bash
claude mcp add [options] <name> -- <command> [args...]

# Example: Add Airtable server
claude mcp add --transport stdio --env AIRTABLE_API_KEY=YOUR_KEY airtable \
  -- npx -y airtable-mcp-server
```

> **Windows note:** On native Windows (not WSL), wrap `npx` commands with `cmd /c`:
> `claude mcp add --transport stdio my-server -- cmd /c npx -y @some/package`

### Scopes

Use `--scope` to control where the config is stored:

- `local` (default) — Private to you, only in the current project. Stored in `~/.claude.json`.
- `project` — Shared with the team via a `.mcp.json` file at the project root (checked into version control).
- `user` — Available to you across all projects. Stored in `~/.claude.json`.

### Managing servers

```bash
claude mcp list              # List all configured servers
claude mcp get <name>        # Get details for a server
claude mcp remove <name>     # Remove a server
```

Inside Claude Code, use `/mcp` to check server status or authenticate with OAuth-based servers.

- You can use `.mcp.json` files to share MCP configs with your team, here you can define multiple servers and their configurations in a structured way. This is especially useful for project-specific tools that everyone on the team needs access to.

  ```json
  {
    "mcpServers": {
      "notion": {
        "type": "http",
        "url": "https://mcp.notion.com/mcp",
        "headers": {
          "Authorization": "Bearer ${NOTION_API_KEY}"
        }
      }
    }
  }
  ```

- Then run `claude --mcp-config .mcp.json` to load these servers when starting Claude Code, you can use the `--strict-mcp` flag to enforce that only servers defined in the config can be used, which helps maintain consistency across the team.

### Adding from JSON

```bash
claude mcp add-json <name> '<json>'

# Example
claude mcp add-json weather '{"type":"http","url":"https://api.weather.com/mcp"}'
```

### Importing from Claude Desktop

```bash
claude mcp add-from-claude-desktop
```

This reads your existing Claude Desktop config and lets you select which servers to import.

## Optimizing MCP Usage

Every MCP server injects its full tool definitions (name, description, input schema) into the context window. With multiple servers this adds up fast — 5 servers with 58 tools can consume ~55K tokens before any conversation even starts. The strategies below help you keep context lean and tool selection accurate.

### 1. Tool Search (deferred tool loading)

Claude Code automatically activates **Tool Search** when MCP tool definitions exceed 10% of the context window. Instead of loading every tool upfront, tools are marked as _deferred_ and Claude receives a single lightweight `ToolSearch` tool. When it needs a capability, it searches by keyword and only the matching tools (~3-5 results) are loaded on demand.

| Metric                    | Without Tool Search | With Tool Search |
| ------------------------- | ------------------- | ---------------- |
| Token overhead (58 tools) | ~55K tokens         | ~8.5K tokens     |
| Usable context preserved  | 122,800 tokens      | 191,300 tokens   |
| Overall reduction         | —                   | **85%**          |

**Configure the threshold** with the `ENABLE_TOOL_SEARCH` environment variable:

```bash
# Lower threshold to 5% (more aggressive deferral)
ENABLE_TOOL_SEARCH=auto:5 claude

# Always enable regardless of tool count
ENABLE_TOOL_SEARCH=true claude

# Disable (load everything upfront)
ENABLE_TOOL_SEARCH=false claude
```

> **Note:** Tool Search requires Sonnet 4+ or Opus 4+. Haiku models do not support it.

### 2. Disable and filter unused tools

Block tools you don't need so they never consume context or get invoked accidentally.

**`disallowedTools` in settings** — use glob patterns to block specific tools or entire servers:

```json
{
  "permissions": {
    "deny": ["mcp__postgres__*", "mcp__jira__create_issue"]
  }
}
```

**`disabledMcpServers`** — disable entire servers per project in `.claude/settings.local.json`:

```json
{
  "disabledMcpServers": ["heavy-server-not-needed-here"]
}
```

**CLI flags** — for one-off sessions:

```bash
claude --disallowedTools "mcp__dangerous-server__*"
```

### 3. Document MCP tools in CLAUDE.md

Tell Claude _when_ and _how_ to use each MCP server. Reference exact tool names so Tool Search can discover them more reliably:

```markdown
## MCP Servers

### Database MCP

For any database queries, use the `mcp__db__query` tool rather than
running psql commands directly. The MCP server uses a read-only connection.

### Sentry MCP

When investigating production errors, search Sentry via the MCP server
before checking logs manually.
```

### 4. Monitor and diagnose

Claude Code provides built-in commands to understand MCP impact:

| Command    | Purpose                                         |
| ---------- | ----------------------------------------------- |
| `/mcp`     | Check server status, authenticate OAuth servers |
| `/context` | See per-server token consumption                |
| `/doctor`  | Verify Tool Search status and diagnose issues   |

### 5. Control output size

Large MCP tool responses can flood the context. Claude Code warns at 10K tokens and hard-limits at 25K per tool output. Adjust with:

```bash
MAX_MCP_OUTPUT_TOKENS=50000 claude
```

For servers that return large datasets, ask the server author to implement pagination.

### 6. Environment variables in `.mcp.json`

Use variable expansion to keep secrets out of version control:

```json
{
  "mcpServers": {
    "api-server": {
      "type": "http",
      "url": "${API_BASE_URL:-https://api.example.com}/mcp",
      "headers": {
        "Authorization": "Bearer ${API_KEY}"
      }
    }
  }
}
```

Supported syntax: `${VAR}` and `${VAR:-default}`. Works in `command`, `args`, `env`, `url`, and `headers` fields.

### 7. Proxy servers

An MCP proxy sits between Claude Code (stdio) and an upstream MCP server (HTTP), intercepting JSON-RPC messages to **filter tools**, **auto-call setup endpoints**, and **strip verbose descriptions** before Claude ever sees them.

```
Claude Code  <──stdio──>  Proxy Server  <──HTTP──>  Upstream MCP Server
```

**Why proxy?**

- **Filter tools** — expose only the ones you need, reducing context token usage.
- **Auto-initialize** — handle unlock/auth handshakes at startup so those tools never enter context.
- **Strip instructions** — upstream server descriptions aren't forwarded, saving thousands of tokens.
- **Zero dependencies** — can be written in pure Python stdlib.

#### Custom stdio proxy

This repo includes a working example at [`examples/mcp_management/`](../examples/mcp_management/):

- `proxy_config.json` whitelists tools (e.g. only `inspect_contract_code` from Blockscout's 16+ tools)
- `mcp_proxy.py` intercepts `initialize`, `tools/list`, and `tools/call`
- `.mcp.json` defines both the direct and proxy servers; `settings.local.json` enables only the proxy
- The proxy auto-calls `__unlock_blockchain_analysis__` at startup

> **Note:** The tool name prefix changes with the server name — `mcp__blockscout-proxy__<tool>` instead of `mcp__blockscout__<tool>`.

#### Community proxy tools

| Tool                                                             | Use case                                                        |
| ---------------------------------------------------------------- | --------------------------------------------------------------- |
| [mcproxy](https://github.com/team-attention/mcproxy)             | Toggle tools `true`/`false` in a generated `.mcproxy.json` file |
| [MCProxy](https://github.com/igrigorik/MCProxy)                  | Aggregate multiple servers behind one HTTP endpoint (Rust)      |
| [mcp-coordinator](https://github.com/CyberClash/mcp_coordinator) | 3 meta-tools, loads servers on demand (~500 tokens vs ~25K)     |
| [mcp-proxy](https://github.com/sparfenyuk/mcp-proxy)             | Bridge stdio ↔ HTTP/SSE transports                              |

#### When to proxy vs. use built-in features

| Scenario                               | Best approach                             |
| -------------------------------------- | ----------------------------------------- |
| Too many tools eating context          | Built-in Tool Search (automatic)          |
| Hide specific tools                    | `disallowedTools` glob patterns           |
| Server requires unlock/auth at startup | Custom proxy with auto-init               |
| Strip verbose server instructions      | Custom proxy (instructions not forwarded) |
| Aggregate multiple servers into one    | MCProxy or mcp-coordinator                |
| Bridge stdio to HTTP transport         | mcp-proxy                                 |

# Agent Teams

> Beta feature — disabled by default. Requires Claude Code v2.1.32+.

## What Are Agent Teams?

Agent teams coordinate multiple Claude Code instances working together. One session acts as the **team lead** that manages work, while **teammates** (separate Claude Code instances) work independently in their own context windows.

### Agent Teams vs Subagents

|                 | Agent Teams                                  | Subagents                               |
| --------------- | -------------------------------------------- | --------------------------------------- |
| Communication   | Direct between teammates                     | Only report back to parent              |
| Task management | Shared task list with self-coordination      | Parent assigns and collects             |
| Context         | Each has its own full context window         | Run within parent's session             |
| Best for        | Discussion, debate, independent coordination | Quick focused work that reports results |

---

## Enabling Agent Teams

**Option A — settings.json:**

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

**Option B — environment variable:**

```bash
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
```

---

## Team Architecture

| Component     | Role                                                                   |
| ------------- | ---------------------------------------------------------------------- |
| **Team Lead** | Main session that creates the team, spawns teammates, coordinates work |
| **Teammates** | Separate Claude Code instances with their own context                  |
| **Task List** | Shared work items teammates claim and complete                         |
| **Mailbox**   | Messaging system for inter-agent communication                         |

### Constraints

- One team per session
- No nested teams (teammates can't spawn their own teams)
- Fixed leadership (can't promote a teammate to lead)
- Permissions set at spawn (inherits lead's permission mode)

---

## Starting a Team

Describe your task in natural language:

```
I'm designing a CLI tool for tracking TODO comments. Create an agent team to explore
this from different angles: one teammate on UX, one on technical architecture,
one playing devil's advocate.
```

Claude will create the team, spawn teammates, coordinate, synthesize, and clean up.

You can specify team composition:

```
Create a team with 4 teammates to refactor these modules in parallel. Use Sonnet for each.
```

---

## Communication & Coordination

### Messaging

- **Direct messages** to specific teammates
- **Broadcast messages** to all teammates (use sparingly — token cost)
- **Automatic delivery** — no polling needed
- **Idle notifications** when work finishes

### Task List

- Three states: pending → in-progress → completed
- Tasks can have dependencies (blocked tasks auto-unblock when deps complete)
- Teammates self-claim unassigned tasks or get explicitly assigned
- File locking prevents race conditions on claims

### Context

- Each teammate loads project context (CLAUDE.md, MCP servers, skills)
- Teammates receive a **spawn prompt** from the lead
- The lead's conversation history does **not** carry over — include task-specific details in spawn prompts

---

## Display Modes

### In-process mode (default)

All teammates run inside the main terminal. Works in any terminal.

- `Shift+Down` — cycle through teammates
- `Ctrl+T` — toggle task list view
- `Enter` — view a teammate's session
- `Escape` — interrupt teammate's current turn

### Split-pane mode

Each teammate gets its own pane. Requires `tmux` or iTerm2 with `it2` CLI.

Configure in settings.json:

```json
{
  "teammateMode": "tmux"
}
```

Or via CLI flag:

```bash
claude --teammate-mode tmux
```

---

## Use Cases

### Parallel Code Review

```
Create an agent team to review PR #142. Spawn three reviewers:
- Security implications
- Performance impact
- Test coverage
```

### Competing Hypotheses Investigation

```
Users report the app exits after one message. Spawn 5 teammates to investigate
different hypotheses. Have them talk to each other to disprove each other's theories.
```

### Parallel Feature Development

Each teammate owns a separate piece (frontend, backend, database, tests) without file conflicts.

---

## Best Practices

- **Start with 3–5 teammates** for most workflows
- **5–6 tasks per teammate** keeps everyone productive
- **Give enough context** in spawn prompts (teammates don't inherit lead history)
- **Avoid file conflicts** — each teammate should own different files
- **Wait for teammates to finish** before the lead starts its own work
- **Start with research/review tasks** (clearer boundaries)
- **Pre-approve common operations** in permission settings to reduce prompts
- **Use CLAUDE.md** for project guidance visible to all teammates

---

## Token Usage & Cost

Agent teams use significantly more tokens than single sessions (~7x in plan mode) because each teammate runs its own context window.

### Cost Reduction

1. Use **Sonnet for teammates** to balance capability and cost
2. Keep teams **small**
3. Keep spawn prompts **focused**
4. **Clean up teams** when done (idle teammates still consume tokens)
5. Set **team spend limits** via Claude Console

### Rate Limit Guidelines (TPM per user)

| Users   | Recommended TPM |
| ------- | --------------- |
| 1–5     | 200k–300k       |
| 5–20    | 100k–150k       |
| 20–50   | 50k–75k         |
| 50–100  | 25k–35k         |
| 100–500 | 15k–20k         |
| 500+    | 10k–15k         |

---

## Hooks for Quality Gates

Enforce rules when teammates finish work:

```json
{
  "hooks": {
    "TeammateIdle": [
      {
        "type": "command",
        "command": "~/.claude/hooks/check-quality.sh"
      }
    ],
    "TaskCompleted": [
      {
        "type": "command",
        "command": "~/.claude/hooks/validate-task.sh"
      }
    ]
  }
}
```

Exit code **2** prevents idle/completion and sends feedback back to the teammate.

---

## Storage Locations

```
Team config:  ~/.claude/teams/{team-name}/config.json
Task list:    ~/.claude/tasks/{team-name}/
```

---

## Known Limitations (Beta)

| Limitation            | Details                                                         |
| --------------------- | --------------------------------------------------------------- |
| No session resumption | `/resume` and `/rewind` don't restore in-process teammates      |
| Task status can lag   | Teammates sometimes fail to mark tasks complete                 |
| Slow shutdown         | Teammates finish current work before stopping                   |
| Split panes limited   | Not supported in VS Code terminal, Windows Terminal, or Ghostty |

---

## Troubleshooting

| Problem                      | Solution                                                                 |
| ---------------------------- | ------------------------------------------------------------------------ |
| Teammates not appearing      | Check task complexity; `Shift+Down` to cycle; verify tmux for split mode |
| Too many permission prompts  | Pre-approve operations before spawning                                   |
| Teammates stopping on errors | Give instructions directly or spawn replacement                          |
| Lead shuts down early        | Tell it to wait for teammates                                            |
| Orphaned tmux sessions       | `tmux ls` then `tmux kill-session -t <name>`                             |
| Task status stuck            | Manually update task or nudge teammate                                   |

# Agent Skills

Skills extend Claude Code by adding custom instructions via `SKILL.md` files. Claude uses them automatically when relevant, or you invoke them with `/skill-name`. They replace the older `.claude/commands/` system (which still works).

Skills follow the [Agent Skills](https://agentskills.io) open standard.

---

## Bundled Skills

| Skill                       | Purpose                                                                         |
| --------------------------- | ------------------------------------------------------------------------------- |
| `/batch <instruction>`      | Parallel large-scale codebase changes (5-30 agents in isolated worktrees)       |
| `/claude-api`               | Load API/SDK reference for your language. Auto-activates on `anthropic` imports |
| `/debug [description]`      | Enable debug logging and troubleshoot session issues                            |
| `/loop [interval] <prompt>` | Run a prompt repeatedly (default 10m). Poll deploys, babysit PRs                |
| `/simplify [focus]`         | Review changed files for reuse/quality/efficiency, apply fixes                  |

---

## Where Skills Live

| Location   | Path                               | Scope                   |
| ---------- | ---------------------------------- | ----------------------- |
| Personal   | `~/.claude/skills/<name>/SKILL.md` | All your projects       |
| Project    | `.claude/skills/<name>/SKILL.md`   | This project only       |
| Plugin     | `<plugin>/skills/<name>/SKILL.md`  | Where plugin is enabled |
| Enterprise | Managed settings                   | All org users           |

Priority: enterprise > personal > project. Auto-discovers nested `.claude/skills/` in subdirectories (monorepo support).

---

## Creating a Skill

A skill is a directory with a `SKILL.md` entrypoint (+ optional supporting files):

```yaml
---
name: fix-issue
description: Fix a GitHub issue
disable-model-invocation: true
---
Fix GitHub issue $ARGUMENTS following our coding standards.
1. Read the issue
2. Implement the fix
3. Write tests
4. Create a commit
```

**Two parts**: YAML frontmatter (config) + markdown body (instructions).

---

## Key Frontmatter Fields

| Field                            | Effect                                                                             |
| -------------------------------- | ---------------------------------------------------------------------------------- |
| `description`                    | How Claude decides when to auto-load the skill (recommended)                       |
| `disable-model-invocation: true` | Only user can invoke (for side-effect skills like `/deploy`)                       |
| `user-invocable: false`          | Only Claude can invoke (background knowledge)                                      |
| `allowed-tools`                  | Restrict which tools Claude can use (e.g., `Read, Grep, Glob`)                     |
| `context: fork`                  | Run in isolated subagent (no conversation history)                                 |
| `agent`                          | Subagent type for forked context (`Explore`, `Plan`, `general-purpose`, or custom) |
| `model` / `effort`               | Override model or effort level                                                     |
| `paths`                          | Glob patterns limiting when skill activates                                        |

---

## Arguments & Substitutions

| Variable               | Description                       |
| ---------------------- | --------------------------------- |
| `$ARGUMENTS`           | All arguments passed to the skill |
| `$0`, `$1`, `$N`       | Positional arguments (0-based)    |
| `${CLAUDE_SESSION_ID}` | Current session ID                |
| `${CLAUDE_SKILL_DIR}`  | Skill's directory path            |

Example: `/migrate-component SearchBar React Vue` with `Migrate $0 from $1 to $2`.

---

## Advanced Features

- **Dynamic context**: `` !`gh pr diff` `` runs shell commands as preprocessing, output replaces the placeholder
- **Subagent execution**: `context: fork` + `agent: Explore` runs the skill in isolation
- **Permission control**: Deny `Skill` tool entirely, allow/deny specific skills (`Skill(deploy *)`), or use `disable-model-invocation` per-skill
- **Extended thinking**: Include "ultrathink" in skill content to enable it

---

## Tips

- Keep `SKILL.md` under 500 lines; use supporting files for detailed reference
- Write descriptions with keywords users would naturally say
- Use `disable-model-invocation: true` for anything with side effects
- Skill descriptions have a character budget (~2% of context window). Check `/context` for warnings

## References

1. Source: [Claude Code Skills Docs](https://docs.anthropic.com/en/docs/claude-code/skills)

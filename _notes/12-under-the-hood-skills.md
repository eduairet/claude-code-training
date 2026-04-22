# Under the hood - Skills in Deep Agents

Deep Agents stay coherent on long, multi-step work by leaning on four pillars:
**system prompt**, **planning tool**, **subagents**, and **file system /
memory** (see `11-under-the-hood-deep-agents.md`). Skills are the fifth
piece — composable bundles of instructions, scripts, and reference files the
agent can load on demand instead of baking every playbook into the base
prompt. Anthropic made Agent Skills an open standard on 2025-12-18, so the
same skill runs in Claude Code, Claude.ai, the Agent SDK, and the Developer
Platform.

## Why Deep Agents need Skills

A shallow ReAct agent can survive with a fat system prompt. Deep agents
can't — long tasks, compaction, and delegation all punish wasted context.
Skills solve three problems the four pillars don't on their own:

- **Context efficiency** — progressive disclosure keeps skill bodies out of
  context until the agent decides to use them. Only the name + description
  (~50–100 tokens each) sit in the system prompt.
- **Reusable expertise** — a skill is "an onboarding guide for a new hire":
  conventions, checklists, scripts. Deep agents pull it in when relevant
  instead of re-deriving it each run.
- **Composable with the other pillars** — a skill can drive a subagent, write
  to the file system, or seed the planning tool.

## How Skills plug into each pillar

| Pillar        | How Skills extend it                                                                                                                   |
| :------------ | :------------------------------------------------------------------------------------------------------------------------------------- |
| System prompt | Skill metadata is injected automatically. The base prompt stays small; skills carry the specialized guidance.                          |
| Planning tool | Task-oriented skills (e.g. `/deploy`, `/fix-issue`) hand the agent a pre-decomposed checklist that feeds straight into its to-do list. |
| Subagents     | `context: fork` + `agent: Explore \| Plan \| general-purpose` runs the skill in an isolated subagent with its own context window.      |
| File system   | Skills bundle supporting files (`reference.md`, `scripts/*.py`) referenced by `${CLAUDE_SKILL_DIR}` — read or executed only as needed. |

## Progressive disclosure (the deep-agent payoff)

Three load stages — the point is that a deep agent running for hours only
pays for what it uses:

1. **Metadata** — `name`, `description`, `when_to_use`. Always in context.
   Combined text capped at 1,536 chars per skill.
2. **Body** — the rest of `SKILL.md`, injected on invocation. Keep under
   ~500 lines.
3. **Supporting files** — loaded only when `SKILL.md` links to them.

After auto-compaction, Claude Code re-attaches the most recent invocation of
each skill (first 5,000 tokens each, 25,000-token combined budget), so a
deep agent doesn't lose its playbooks when the conversation is summarized.

## Pattern: skill that spawns a subagent

This is the cleanest way to chain the two deep-agent pillars. The skill body
**is** the subagent's task prompt:

```yaml
---
name: deep-research
description: Research a topic thoroughly across the codebase. Use when the user asks to investigate, audit, or map out a subsystem.
context: fork
agent: Explore
---

Research $ARGUMENTS thoroughly:

1. Use Glob and Grep to locate relevant files.
2. Read the code and trace call sites.
3. Return a summary with concrete file:line references.
```

The parent agent delegates; the Explore subagent runs the skill in its own
context window; only the summary comes back. Main context stays clean.

## Pattern: skill that injects live state

Shell preprocessing (`` !`<command>` ``) runs **before** the skill is sent to
the model — the agent sees real data, not instructions to fetch it:

```yaml
---
name: pr-summary
description: Summarize the current pull request.
allowed-tools: Bash(gh *)
---

## PR context
- Diff: !`gh pr diff`
- Comments: !`gh pr view --comments`

## Task
Summarize the change, flag risks, suggest reviewers.
```

Useful for deep agents because the freshly-rendered context is deterministic
and doesn't cost a tool round-trip.

## Frontmatter fields that matter for deep-agent design

- `disable-model-invocation: true` — stops the agent from auto-triggering
  side-effecting skills (`/deploy`, `/commit`).
- `user-invocable: false` — background knowledge the agent can pull in but
  users shouldn't run directly.
- `allowed-tools` — pre-approve tools while the skill is active (e.g.
  `Bash(git add *) Bash(git commit *)`) so the agent doesn't stall on prompts.
- `paths` — glob patterns that scope auto-activation (e.g. only load a
  migration skill when editing `migrations/**`).
- `context: fork` / `agent` — route the skill into a subagent.
- `model` / `effort` — override the active model or effort for the turn.
- `hooks` — lifecycle hooks scoped to the skill.

## Invocation lifecycle inside a deep agent

1. Agent sees all skill metadata at startup (1,536-char cap per entry;
   dynamic budget ~1% of the context window).
2. Either the user types `/skill-name` or the agent decides based on the
   description.
3. `SKILL.md` body is injected **once** into the conversation. Claude does
   not re-read the file on later turns, so write standing instructions, not
   one-shot steps.
4. Supporting files and scripts load only when referenced.
5. On auto-compaction, the latest invocation of each skill is re-attached
   within the 25k-token budget.

## Sources

- [Extend Claude with skills — Claude Code docs](https://code.claude.com/docs/en/skills)
- [Agent Skills — Claude API docs](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview)
- [Skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)
- [Equipping agents for the real world with Agent Skills — Anthropic Engineering](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)
- [anthropics/skills (reference skill repo)](https://github.com/anthropics/skills)

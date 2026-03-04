# Advanced Workflows

## Planning and Deep Thinking

Claude Code can be used for more than just code generation. It can also assist with planning, deep thinking, and complex problem-solving. By leveraging its ability to understand and generate natural language, you can use Claude Code to break down complex problems into smaller, manageable parts, brainstorm solutions, and even create detailed plans for projects.

- To enter plan mode you can use `/plan` command in the chat interface.
- In plan mode, you can ask Claude Code to help you outline a project, create a roadmap, or even generate a detailed project plan with milestones and deadlines.

## Parallel Claude Code Sessions

You can run multiple Claude Code instances at the same time, each in its own terminal. This is useful for splitting work across independent tasks that don't block each other.

**How it works:**

- Open a new terminal tab/window and run `claude` in each one. Every instance operates independently with its own context.
- Each session reads and writes to the filesystem, so they share the same codebase but maintain separate conversation histories.

**Practical examples:**

- **Session A** writes a new API endpoint while **Session B** writes tests for an existing feature.
- One session handles frontend work, another tackles backend changes.
- Use one session for research/exploration and another for implementation.

**Things to watch out for:**

- Avoid having two sessions edit the **same file** simultaneously — this can cause conflicts or overwritten changes.
- Coordinate by splitting work across different files or directories.
- Use git branches if sessions are working on separate features.

**Tip:** Think of each session as a separate team member. Assign them distinct, non-overlapping tasks for the best results.

## Subagents

Subagents are specialized AI agents that Claude Code spawns to handle specific tasks in isolation. Each subagent runs in its own context window with a tailored system prompt and restricted tool access, keeping verbose output (test runs, large searches, logs) out of your main conversation.

**How they work:**

- Claude delegates tasks via the **Task tool**, choosing the right subagent based on its description.
- Subagents can run in the **foreground** (blocking) or **background** (concurrent).
- They cannot spawn other subagents — there's no nested delegation.

**Built-in subagent types:**

| Type                | Purpose                                       |
| ------------------- | --------------------------------------------- |
| **Explore**         | Fast, read-only codebase search and analysis  |
| **Plan**            | Research and design implementation approaches |
| **General-purpose** | Complex multi-step tasks needing all tools    |
| **Bash**            | Run terminal commands in a separate context   |

**Custom subagents** can be defined at three levels:

- **Project-level:** `.claude/agents/*.md` — shared with the team via git.
- **User-level:** `~/.claude/agents/*.md` — personal, across all projects.
- **CLI flag:** `claude --agents '{...}'` — session-only, not persisted.

Custom agents use a Markdown file with YAML frontmatter to configure `tools`, `model`, `permissionMode`, and the system prompt.

**Example — `.claude/agents/rust.md`:**

```markdown
---
name: rust
description: Use for Rust development tasks including writing, reviewing, and debugging Rust code.
tools: Read, Edit, Write, Bash, Grep, Glob
model: sonnet
---

You are a Rust development specialist. Follow these guidelines:

- Write idiomatic Rust — prefer iterators over manual loops, use pattern matching, and leverage the type system.
- Always handle errors with `Result` and `?` — avoid `.unwrap()` in production code.
- Run `cargo clippy` after making changes and fix any warnings.
- Run `cargo test` to verify nothing is broken.
- Prefer `&str` over `String` in function parameters when ownership isn't needed.
- Add doc comments (`///`) to all public items.
```

You would then invoke this agent by telling Claude something like _"use the rust agent to refactor the parser module"_.

**Why use them:**

- **Context isolation** — keeps your main conversation clean and focused.
- **Parallel execution** — run multiple independent research or build tasks at the same time.
- **Tool restrictions** — create read-only reviewers, security checkers, etc.
- **Cost control** — route simple tasks to faster/cheaper models (e.g., `model: haiku`).

## Infinite Subagents

Subagents cannot spawn other subagents — that's a hard limit. But you can work around it by combining **custom agents** with **parallel sessions** and **orchestration prompts** to create workflows that scale beyond a single agent's context window.

**The core idea:**

Instead of nesting agents inside agents, you chain them sequentially or fan them out in parallel, with the main Claude session acting as the orchestrator.

**Pattern 1 — Sequential chaining:**

1. Ask Claude to spawn a **Plan** subagent to research and outline the work.
2. Feed the plan's output into a **General-purpose** subagent that implements step 1.
3. Spawn another subagent for step 2, passing along the prior context.
4. Repeat for as many steps as needed.

Each subagent gets a fresh context window, so you're never limited by a single conversation's length.

**Pattern 2 — Fan-out / fan-in:**

1. Use the main session to break a large task into independent subtasks.
2. Spawn multiple subagents **in the background**, one per subtask.
3. Collect results as each completes, then synthesize in the main session.

This is useful for bulk operations like migrating many files, running analysis across multiple modules, or generating tests for several components at once.

**Pattern 3 — Multi-session orchestration:**

1. Open multiple terminal sessions, each running `claude`.
2. Give each session a different slice of the work (e.g., by directory or feature).
3. Each session can independently spawn its own subagents.

This multiplies your capacity: 3 sessions × multiple subagents each = many tasks progressing simultaneously.

**Key guidelines:**

- Keep each subagent's task **focused and self-contained** — don't rely on shared state between them.
- Pass explicit context (file paths, summaries, decisions) between steps rather than assuming agents remember prior work.
- Use **background execution** for independent tasks and **foreground** when later steps depend on the result.
- Coordinate file access — avoid two subagents editing the same file at the same time.

**Real-world example — Infinite Agentic Loop:**

The [Infinite Agentic Loop](https://github.com/disler/infinite-agentic-loop) project by [@disler](https://github.com/disler) is a proof-of-concept that implements these patterns using a custom slash command (`/project:infinite`). It demonstrates how a single master prompt can orchestrate waves of parallel subagents to generate evolving iterations of content.

The workflow has five phases:

1. **Specification analysis** — read a spec file that defines what to generate.
2. **Directory reconnaissance** — scan existing outputs to find the highest iteration and avoid duplicates.
3. **Iteration strategy** — plan how each new iteration builds on previous ones.
4. **Parallel agent coordination** — spawn batches of 3–5 subagents, each assigned a unique iteration number and creative direction.
5. **Wave management** — once a batch completes, launch the next wave. In "infinite" mode, this repeats until the context window is exhausted.

It supports four execution modes:

| Mode        | Count        | Behavior                                  |
| ----------- | ------------ | ----------------------------------------- |
| Single      | `1`          | One generation pass                       |
| Small batch | `5`          | Five parallel agents at once              |
| Large batch | `20`         | Four waves of five agents                 |
| Infinite    | `"infinite"` | Continuous waves until context limits hit |

The key implementation detail is the **custom slash command** (`.claude/commands/infinite.md`) that acts as the master orchestrator — it parses arguments, reads the spec, checks the output directory, and dispatches subagents with explicit context so each one works independently.

This is a great reference for building your own orchestration commands. You can adapt the pattern for any repetitive-but-varied task: generating test cases, creating component variants, producing documentation across modules, etc.

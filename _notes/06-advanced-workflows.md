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

````markdown
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
````

You would then invoke this agent by telling Claude something like _"use the rust agent to refactor the parser module"_.

**Why use them:**

- **Context isolation** — keeps your main conversation clean and focused.
- **Parallel execution** — run multiple independent research or build tasks at the same time.
- **Tool restrictions** — create read-only reviewers, security checkers, etc.
- **Cost control** — route simple tasks to faster/cheaper models (e.g., `model: haiku`).

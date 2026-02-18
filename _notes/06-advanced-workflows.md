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
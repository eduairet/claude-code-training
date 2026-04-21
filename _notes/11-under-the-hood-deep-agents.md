# Under the hood - Deep Agents

## Agent Taxonomy

### Shallow Agents

- The "classic" ReAct-style agent: prompt in → a few tool calls → answer out.
- Plans only implicitly through chain-of-thought; no persistent memory or explicit to-do list.
- Great for short, well-scoped tasks, but they break down once the task requires many steps or long context.
- Real-life examples:
  - A **customer-support bot** that looks up an order and replies.
  - A **flight-booking agent** that calls a search API and returns options.
  - A **weather assistant** that calls one tool and summarizes the result.

### Deep Agents

- Agents designed for complex, long-running, multi-step tasks.
- Built on four pillars: **explicit planning** (a living to-do list), **subagents** (delegate work with isolated context), **memory / file system** (persist info across steps and sessions), and a **detailed system prompt** guiding behavior.
- Can recover from mistakes, compress history, and run for extended periods without losing track of the goal.
- Real-life examples:
  - **Claude Code** — plans, edits files, spawns subagents, and keeps long engineering tasks coherent.
  - **Deep Research** (ChatGPT / Perplexity) — browses dozens of sources, takes notes, and writes a structured report.
  - **Manus** — autonomous agent that plans and executes projects like building a website end-to-end.

## Deep Agent Flow

```
                         ┌────────────────────────┐
                         │ Instructions / Persona │
                         └───────────┬────────────┘
                                     │
                           ┌─────────┴─────────┐
                           │   System Prompt   │
                           └─────────┬─────────┘
                                     │
                                     ▼
                              ┌────────────┐
        ┌─────────────┐       │            │       ┌─────────────┐       ┌───────────────────┐
        │ Specialized │───────│ Deep Agent │───────│ File System │───────│ Persistent Memory │
        │   Workers   │       │            │       │             │       │  / Shared State   │
        └─────────────┘       └──────┬─────┘       └─────────────┘       └───────────────────┘
               │                     │
               │                     │
         ┌─────┴──────┐              │
         │ Sub Agents │              │
         └────────────┘              │
                                     ▼
                            ┌─────────────────┐
                            │  Planning Tool  │
                            └────────┬────────┘
                                     │
                                     ▼
                        ┌────────────────────────────┐
                        │ To-Do List / Decomposition │
                        └────────────────────────────┘
```

**Four pillars around the Deep Agent:**

- **System Prompt** — the instructions and persona that shape how the agent behaves.
- **Sub Agents** — specialized workers spawned with clean context for focused tasks.
- **File System** — persistent memory and shared state that outlives a single turn.
- **Planning Tool** — produces a to-do list and decomposes the work into steps.

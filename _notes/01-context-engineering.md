# Context engineering

- Every prompt sent to an LLM has a context that's defined by the prompt itself and any additional information provided alongside it.
  - For example, the text editor or IDE where the prompt is entered, any files that are open, and any other metadata about the coding environment can all contribute to the context.
- When an LLM is not fed with the right context, it may produce suboptimal or incorrect results since they're not aware of the full situation, tools, or constraints.

## Context poisoning

- Context poisoning refers to the situation where an LLM is provided with misleading, irrelevant, or harmful context that negatively impacts its performance.
- This can happen intentionally (e.g., an adversary trying to manipulate the model's output) or unintentionally (e.g., providing outdated or incorrect information, asking too much information at once).
- To mitigate context poisoning, it's important to carefully curate the context provided to the LLM, ensuring that it's relevant, accurate, and up-to-date.

## Context engineering principles with Claude Code

1. **Write context**:
   - Claude has a persisting memory architecture:
   - Project memory: `./CLAUDE.md` - Team-shared memory for project-wide context.
   - User memory: `~/.claude/CLAUDE.md` - Personal preferences for all projects.
   - Project memory (local): `./CLAUDE.local.md` - Personal preferences for the current project.
   - We can also use dynamic memory imports to load additional context as needed.

   ```markdown
   @path/to/file.md
   ```

2. **Select context**:
   - Intelligent context retrieval, usually with dynamic context recovery.
   - Claude looks for helpful files in the project directory based on the current task.
   - You can add specific references by using the `#` symbol followed by the file path.

3. **Compress context**:
   - We have built-in compression commands in Claude Code to help manage context size.
     - `/clear` - Removes the history while preserving memory.
     - `/compact` - Compresses the conversation history into essential information.

4. **Context isolation**:
   - Create different specialized sub-agents with isolated contexts for specific tasks.
   - This helps prevent context contamination and ensures that each agent has the relevant information for its task.

## System prompts

- System prompts are used to set the behavior and guidelines for the LLM.
- We need to provide clear instructions on how to handle context, not to vague, not too specific.

## Further reading

- [Effective Context Engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
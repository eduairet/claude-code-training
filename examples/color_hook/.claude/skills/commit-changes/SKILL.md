---
name: commit-changes
description: Commit changes to git after running tests. Only creates a commit if all tests pass. Gathers git context and generates a commit message for user approval.
allowed-tools: Bash, Read, Glob, Grep, AskUserQuestion, Skill
disable-model-invocation: true
---

## Workflow

Follow these steps in order:

### 1. Run Tests First

Invoke the `/test` skill to run the test suite. If any tests fail, stop and report the failures. Do NOT proceed to commit if tests fail.

### 2. Gather Git Context

Run these commands in parallel to understand the current state:

```bash
git status
```

```bash
git branch --show-current
```

```bash
git diff --staged
```

```bash
git diff
```

```bash
git log --oneline -5
```

### 3. Analyze Changes

Based on the git diff output, identify:
- What files were modified, added, or deleted
- The nature of the changes (feature, bugfix, refactor, docs, test, etc.)
- The scope and impact of the changes

### 4. Generate Commit Message

Create a commit message following these conventions:
- Use imperative mood ("Add feature" not "Added feature")
- First line: concise summary under 50 characters
- If needed, add a blank line followed by a detailed description
- Focus on WHY the change was made, not just WHAT changed

### 5. Ask for User Confirmation

Use AskUserQuestion to present the proposed commit message and ask the user to confirm or modify it. Show them:
- The files that will be committed
- The proposed commit message
- Options to approve, edit, or cancel

### 6. Create the Commit

Only after user approval:

1. Stage the appropriate files (prefer specific files over `git add -A`)
2. Create the commit with the approved message
3. Include the co-author trailer:
   ```
   Co-Authored-By: Claude <noreply@anthropic.com>
   ```
4. Run `git status` to confirm the commit was successful

## Important Rules

- NEVER commit if tests fail
- NEVER use `--no-verify` or skip hooks
- NEVER commit files that may contain secrets (.env, credentials, etc.)
- NEVER push to remote unless explicitly requested
- ALWAYS get user confirmation before committing

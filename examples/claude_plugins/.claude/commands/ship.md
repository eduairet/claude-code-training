# Ship: Lint, Format, Test & Commit

Run the full quality pipeline and, if everything passes, create a commit.

## Steps

1. **Lint** — Run `pnpm lint:fix` to auto-fix linting issues. If there are unfixable errors, stop and report them.

2. **Format** — Run `pnpm format` to auto-format all source files.

3. **Test** — Run `pnpm test`. If any test fails, stop and report the failures. Do NOT proceed to commit.

4. **Commit** — Only if all previous steps passed:
   - Run `git status` and `git diff --staged` and `git diff` to review all changes.
   - Stage the relevant changed files (do NOT use `git add -A`; be selective).
   - Write a concise commit message that summarizes **what changed and why**, based on the actual diff — not a generic message.
   - Create the commit.
   - Do NOT push unless explicitly asked.

## Rules

- If any step fails, stop immediately and explain what went wrong.
- Never skip lint or test failures to force a commit.
- Never use `--no-verify` or `--no-gpg-sign`.
- Never amend a previous commit — always create a new one.

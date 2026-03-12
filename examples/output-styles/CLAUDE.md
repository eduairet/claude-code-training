# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

This directory demonstrates Claude Code **output styles** — custom response formats configured via `.claude/settings.json` and defined in `.claude/output-styles/`. It contains a Rust coding challenges sub-project used as a teaching example.

## Output Styles

- Configured in `.claude/settings.json` via the `outputStyle` key (e.g., `"ASCII Art"`, `"yaml"`)
- Style definitions live in `.claude/output-styles/*.md` as markdown prompt files
- The active style controls how Claude formats all responses in this directory

## Rust Challenges Sub-Project

The `rust-challenges/` directory is a learn-by-doing Rust project with its own `CLAUDE.md`. Key rules:

- **Never write solutions** — guide the human with hints and Rust concepts only
- Tests in `tests/challenges.rs` must NOT be modified
- Stubs in `src/lib.rs` have `TODO(human)` markers for the human to fill in

### Commands (run inside Docker container)

```bash
# Build and enter container
docker build -t rust-challenges rust-challenges/
docker run -it --rm -v "$(pwd)/rust-challenges:/app" -w /app rust-challenges bash

# Run all tests
cargo test

# Run a specific challenge's tests
cargo test fizzbuzz
```

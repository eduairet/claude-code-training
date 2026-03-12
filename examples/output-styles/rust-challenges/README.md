# Rust Coding Challenges

A Rust coding challenge — you write the code, tests are provided.

## Challenge

| # | Challenge | Concepts |
|---|-----------|----------|
| 1 | **FizzBuzz Iterator** | `Iterator` trait, `impl`, ownership |

## Getting Started

```bash
# Build the Docker image
docker build -t rust-challenges .

# Start an interactive container (your edits mount live)
docker run -it --rm -v "$(pwd):/app" -w /app rust-challenges bash

# Inside the container — run all tests
cargo test

# Run tests for the FizzBuzz challenge
cargo test fizzbuzz
```

## How to Solve

Open `src/lib.rs` and find the `TODO(human)` markers. Replace each `todo!()` with your implementation. Run `cargo test` inside the container to check your work.

## Output Style

This project is configured with Claude's **Learning** output style — Claude will guide you with hints and explanations without giving away solutions.

# Rust Coding Challenges

5 progressively interesting Rust challenges — you write the code, tests are provided.

## Challenges

| # | Challenge | Concepts |
|---|-----------|----------|
| 1 | **FizzBuzz Iterator** | `Iterator` trait, `impl`, ownership |
| 2 | **MinStack** | Generics, trait bounds (`Ord + Clone`), O(1) design |
| 3 | **Roman Numerals** | Pattern matching, lookup tables, string building |
| 4 | **Balanced Brackets** | `HashMap`, `Vec` as stack, `char` matching |
| 5 | **Flatten Nested Vec** | Recursive enums, pattern matching, recursion |

## Getting Started

```bash
# Build the Docker image
docker build -t rust-challenges .

# Start an interactive container (your edits mount live)
docker run -it --rm -v "$(pwd):/app" -w /app rust-challenges bash

# Inside the container — run all tests
cargo test

# Run tests for a specific challenge
cargo test fizzbuzz
cargo test minstack
cargo test roman
cargo test balanced
cargo test flatten
```

## How to Solve

Open `src/lib.rs` and find the `TODO(human)` markers. Replace each `todo!()` with your implementation. Run `cargo test` inside the container to check your work.

## Output Style

This project is configured with Claude's **Learning** output style — Claude will guide you with hints and explanations without giving away solutions.

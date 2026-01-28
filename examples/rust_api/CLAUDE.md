# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands

All development is Docker-based (no local Rust installation required).

```bash
# Build and run
docker-compose up --build

# Run in background
docker-compose up -d --build

# Stop
docker-compose down

# Run tests
docker-compose run --rm api cargo test

# Format code
docker-compose run --rm api cargo fmt

# Lint
docker-compose run --rm api cargo clippy

# Interactive shell
docker-compose run --rm api bash
```

Test the server:

```bash
curl http://localhost:3000/health
```

## Architecture

This is a minimal Rust REST API using:

- **Axum 0.7** - Async web framework (created by Tokio team)
- **Tokio** - Async runtime with full features
- **Serde** - JSON serialization

### Code Structure

Single-file architecture in `src/main.rs`:

- Response structs derive `Serialize` for automatic JSON conversion
- Async handler functions return `Json<T>` wrappers
- Router-based routing with `Router::new().route()`
- Server binds to `0.0.0.0:3000` via `TcpListener`

### Adding New Endpoints

Follow this pattern:

```rust
#[derive(Serialize)]
struct MyResponse {
    field: String,
}

async fn my_handler() -> Json<MyResponse> {
    Json(MyResponse { field: "value".to_string() })
}

// Add to router:
Router::new()
    .route("/health", get(health_check))
    .route("/my-endpoint", get(my_handler))
```

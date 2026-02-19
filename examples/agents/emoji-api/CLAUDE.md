# Emoji Lookup API

Single-endpoint Rust API that maps text queries to the closest emoji using fuzzy matching.

## Build & Run

```bash
# Docker
docker-compose up --build

# Local (requires Rust toolchain)
cargo run --release
```

Server starts on `http://localhost:3000`.

## Endpoints

- `GET /emoji?q=<query>` — returns closest emoji match
- `GET /swagger-ui` — interactive Swagger UI
- `GET /api-docs/openapi.json` — OpenAPI spec

## Architecture

Single-file Axum app (`src/main.rs`):
- Static emoji map (~200 keyword-emoji pairs) via `LazyLock`
- 3-pass matching: exact → substring → Jaro-Winkler similarity
- OpenAPI docs via utoipa + utoipa-swagger-ui

## Testing

```bash
curl "http://localhost:3000/emoji?q=taco"
curl "http://localhost:3000/emoji?q=tacoo"   # fuzzy match
curl "http://localhost:3000/emoji?q="         # 400 error
```

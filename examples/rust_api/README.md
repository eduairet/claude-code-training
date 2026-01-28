# Rust API

A simple REST API built with Axum, a modern Rust web framework.

## Prerequisites

- [Docker](https://www.docker.com/get-started)

No local Rust installation required - all Rust commands run inside Docker containers.

## Getting Started

### Build and run the server

```bash
docker-compose up --build
```

The server will start on `http://localhost:3000`.

Run in background:

```bash
docker-compose up -d --build
```

Stop the server:

```bash
docker-compose down
```

## Endpoints

### Health Check

- **URL:** `/health`
- **Method:** `GET`
- **Response:**

  ```json
  {
    "status": "ok",
    "message": "API is running"
  }
  ```

### Example Request

```bash
curl http://localhost:3000/health
```

## Development

### Run tests

```bash
docker-compose run --rm api cargo test
```

### Run in release mode

```bash
docker-compose run --rm -p 3000:3000 api cargo run --release
```

### Format code

```bash
docker-compose run --rm api cargo fmt
```

### Run linter

```bash
docker-compose run --rm api cargo clippy
```

### Interactive shell

- Open a shell inside the container:

  ```bash
  docker-compose run --rm api bash
  ```

- Once inside, you can run any Rust commands directly:

  ```bash
  cargo build
  cargo run
  cargo test
  ```

- Exit the shell with `exit`.

FROM rust:1.83-slim

WORKDIR /app

# Copy manifests first for layer caching
COPY Cargo.toml ./

# Copy source and tests
COPY src/ src/
COPY tests/ tests/

# Pre-compile dependencies (will be cached if Cargo.toml unchanged)
RUN cargo build --tests 2>/dev/null || true

CMD ["bash"]

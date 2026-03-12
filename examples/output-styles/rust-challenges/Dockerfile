FROM alpine:3.21

RUN apk add --no-cache bash curl gcc musl-dev

# Install Rust via rustup
ENV RUSTUP_HOME=/usr/local/rustup \
    CARGO_HOME=/usr/local/cargo \
    PATH="/usr/local/cargo/bin:$PATH"

RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain stable --profile minimal

WORKDIR /app

# Copy manifests first for layer caching
COPY Cargo.toml ./

# Copy source and tests
COPY src/ src/
COPY tests/ tests/

# Pre-compile dependencies (will be cached if Cargo.toml unchanged)
RUN cargo build --tests 2>/dev/null || true

CMD ["bash"]

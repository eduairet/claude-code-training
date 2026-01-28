FROM rust:latest

WORKDIR /app

RUN rustup component add rustfmt clippy
EXPOSE 3000

CMD ["cargo", "run"]

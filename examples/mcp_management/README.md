# MCP Management — Hardhat Project

A Solidity smart contract project using Hardhat, fully containerized with Docker.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/) (included with Docker Desktop)

## Build

```sh
docker compose build
```

## Test

```sh
docker compose run --rm hardhat
```

## Compile Contracts

```sh
docker compose run --rm hardhat npx hardhat compile
```

## Run Any Hardhat Command

```sh
docker compose run --rm hardhat npx hardhat <command>
```

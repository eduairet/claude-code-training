# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Solidity smart contract project using Hardhat, fully containerized with Docker. Targets Solidity 0.8.28 with TypeScript tooling.

## Commands

All commands run through Docker — no local Node.js install needed.

```sh
# Build the Docker image
docker compose build

# Run tests (default command)
docker compose run --rm hardhat

# Compile contracts
docker compose run --rm hardhat npx hardhat compile

# Run any Hardhat command
docker compose run --rm hardhat npx hardhat <command>
```

If working inside the container or with a local Node.js environment:

```sh
npm ci --legacy-peer-deps   # install dependencies (--legacy-peer-deps is required)
npx hardhat test             # run tests
npx hardhat compile          # compile contracts
```

## Architecture

- **contracts/** — Solidity source files
- **test/** — TypeScript tests using Chai + Ethers.js via `@nomicfoundation/hardhat-toolbox`
- **hardhat.config.ts** — Hardhat configuration (Solidity 0.8.28, hardhat-toolbox plugin)
- **Dockerfile** — Node 22-slim based image; runs `npx hardhat test` by default

## MCP Servers

A Blockscout MCP proxy (`mcp_proxy.py`) filters the upstream server to expose only selected tools, reducing context token usage. Python stdlib only, no deps.

- `proxy_config.json` — set `allowed_tools` to control which tools are loaded
- `.mcp.json` — defines both `blockscout` (direct) and `blockscout-proxy` (filtered); only the proxy is enabled
- The proxy auto-calls `__unlock_blockchain_analysis__` at startup — no need to expose it
- Tool prefix is `mcp__blockscout-proxy__<tool>` (not `mcp__blockscout__`)

## Key Details

- TypeScript strict mode is enabled
- Dependencies install requires `--legacy-peer-deps` flag
- Tests deploy contracts to a local Hardhat network and assert using Chai `expect`

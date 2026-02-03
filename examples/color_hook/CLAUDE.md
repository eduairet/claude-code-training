# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Docker-based Python tool that generates random color images. Designed to run exclusively via Docker, not locally.

## Build and Run Commands

```bash
# Build Docker image (required before running)
docker build -t color-hook .

# Run container (Unix/macOS)
docker run --rm -v "$(pwd)/output:/output" color-hook

# Run container (Windows PowerShell)
docker run --rm -v "${PWD}/output:/output" color-hook
```

## Claude Code Hook

This project includes a PostToolUse hook that automatically generates a color image whenever Write or Edit tools are used. The hook configuration is in `.claude/settings.local.json`.

On Windows, the hook uses PowerShell syntax for Docker volume mounting.

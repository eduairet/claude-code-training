# Color Hook

A simple Python script that generates a random color image. This project is designed to run exclusively via Docker.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) installed on your system

## Usage

### Build the image

```bash
docker build -t color-hook .
```

### Run the container

```bash
docker run --rm -v "$(pwd)/output:/output" color-hook
```

On Windows (PowerShell):

```powershell
docker run --rm -v "${PWD}/output:/output" color-hook
```

On Windows (CMD):

```cmd
docker run --rm -v "%cd%/output:/output" color-hook
```

### Output

The script will:

1. Generate a random RGB color
2. Create a 200x200 PNG image filled with that color
3. Save it to the `output/` directory with a filename like `color_ff5733.png`

Example output:

```
Color: #ff5733
RGB: (255, 87, 51)
Saved to: /output/color_ff5733.png
```

## Claude Code Hook Integration

This project includes a pre-configured hook in `.claude/settings.local.json` that generates a color image whenever Claude Code makes code changes (using `Write` or `Edit` tools).

### Setup

1. Build the Docker image first:
   ```bash
   docker build -t color-hook .
   ```

2. Run Claude Code from this directory so the hook is picked up

### Hook Configuration

The hook is configured in `.claude/settings.local.json`:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write",
        "command": "docker run --rm -v \"%cd%/output:/output\" color-hook"
      },
      {
        "matcher": "Edit",
        "command": "docker run --rm -v \"%cd%/output:/output\" color-hook"
      }
    ]
  }
}
```

On Unix/macOS, replace `%cd%` with `$(pwd)`:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write",
        "command": "docker run --rm -v \"$(pwd)/output:/output\" color-hook"
      },
      {
        "matcher": "Edit",
        "command": "docker run --rm -v \"$(pwd)/output:/output\" color-hook"
      }
    ]
  }
}
```

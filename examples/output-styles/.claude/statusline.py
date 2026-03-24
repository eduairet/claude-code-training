#!/usr/bin/env python3
"""Status line: shows the last ASCII art rendered in the current Claude session.

Reads the session data from ~/.claude/projects/<slug>/<session>.jsonl,
finds assistant messages containing ASCII art (block chars in code fences),
and outputs "Last ASCII:" followed by the actual art block.

Works cross-platform (Windows/macOS/Linux) by matching the project directory
against session metadata rather than deriving the slug format.
"""

import json
import os
import re
import sys
import glob

CLAUDE_DIR = os.path.join(os.path.expanduser("~"), ".claude")
PROJECT_DIR = os.path.normpath(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
)


def get_current_session():
    """Return (session_id, project_slug) for the current session, or (None, None)."""
    sessions_dir = os.path.join(CLAUDE_DIR, "sessions")
    if not os.path.isdir(sessions_dir):
        return None, None

    session_files = glob.glob(os.path.join(sessions_dir, "*.json"))
    if not session_files:
        return None, None

    latest = max(session_files, key=os.path.getmtime)
    try:
        with open(latest, encoding="utf-8") as f:
            content = f.read().strip()
            decoder = json.JSONDecoder()
            data, _ = decoder.raw_decode(content)
            session_id = data.get("sessionId")
    except (json.JSONDecodeError, OSError):
        return None, None

    if not session_id:
        return None, None

    projects_dir = os.path.join(CLAUDE_DIR, "projects")
    if not os.path.isdir(projects_dir):
        return None, None

    jsonl_name = f"{session_id}.jsonl"
    for slug in os.listdir(projects_dir):
        candidate = os.path.join(projects_dir, slug, jsonl_name)
        if os.path.isfile(candidate):
            project_leaf = os.path.basename(PROJECT_DIR)
            if project_leaf.lower() in slug.lower():
                return session_id, slug

    # Fallback: if only one project has this session, use it
    matches = []
    for slug in os.listdir(projects_dir):
        candidate = os.path.join(projects_dir, slug, jsonl_name)
        if os.path.isfile(candidate):
            matches.append(slug)
    if len(matches) == 1:
        return session_id, matches[0]

    return None, None


def find_last_ascii_art(session_id, project_slug):
    """Scan the session JSONL for the last ASCII art block and return it."""
    jsonl_path = os.path.join(CLAUDE_DIR, "projects", project_slug, f"{session_id}.jsonl")

    if not os.path.isfile(jsonl_path):
        return None

    last_block = None

    with open(jsonl_path, encoding="utf-8", errors="replace") as f:
        for line in f:
            try:
                obj = json.loads(line)
            except json.JSONDecodeError:
                continue

            if obj.get("type") == "assistant":
                content = obj.get("message", {}).get("content", [])
                for item in content:
                    if item.get("type") != "text":
                        continue
                    text = item["text"]
                    # Extract code-fenced ASCII art blocks
                    for match in re.finditer(r"```[^\n]*\n(.*?)```", text, re.DOTALL):
                        block = match.group(1).rstrip()
                        # Remove leading blank lines but preserve leading spaces on content lines
                        block = block.lstrip('\n')
                        if "\u2588" in block and "\u2557" in block:
                            last_block = block

    return last_block


def main():
    # Ensure UTF-8 output on all platforms
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    session_id, project_slug = get_current_session()
    if not session_id or not project_slug:
        print("No ASCII art generated yet")
        return

    block = find_last_ascii_art(session_id, project_slug)
    if block:
        lines = block.split('\n')
        # Strip existing borders to avoid double-bordering
        lines = [l for l in lines if l.strip() and not all(c == '·' for c in l.strip())]
        # Remove side dot borders from each line
        cleaned = []
        for l in lines:
            if l.startswith('·'):
                l = l[1:]
            if l.endswith('·'):
                l = l[:-1]
            cleaned.append(l)
        lines = cleaned
        # Find the max line width for right-side border alignment
        max_width = max(len(line) for line in lines)
        border = '·' * (max_width + 2)
        print("Last ASCII:")
        print(" ")
        print(border)
        for line in lines:
            padded = line.ljust(max_width)
            print(f"·{padded}·")
        print(border)
    else:
        print("No ASCII art generated yet")


if __name__ == "__main__":
    main()

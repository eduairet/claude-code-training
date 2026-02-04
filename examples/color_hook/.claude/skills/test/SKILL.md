---
name: test
description: Run the project's pytest test suite via Docker. Use when the user asks to run tests, verify code changes, or check if tests pass.
allowed-tools: Bash
---

Run the pytest test suite using Docker Compose:

```bash
docker compose run --rm test
```

If tests fail, analyze the output and report which tests failed and why. Suggest fixes if the failures are related to recent code changes.

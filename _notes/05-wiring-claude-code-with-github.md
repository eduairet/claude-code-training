# Wiring Claude Code with GitHub

- To connect Claude Code with GitHub, you can use the "/install-github-app" command in the Claude Code interface. This will guide you through the process of installing the GitHub App for Claude Code, which allows you to integrate your GitHub repositories with Claude Code for code generation and management.
  - You'll need GitHub CLI installed on your machine to use this feature effectively. You can install it from [GitHub CLI](https://cli.github.com/).
- When you run the "/install-github-app" command, Claude Code will prompt you to authenticate with your GitHub account and select the repositories you want to connect. Once connected, you can use various commands to interact with your GitHub repositories directly from Claude Code, such as creating pull requests, managing issues, and generating code based on your repository's context.
- One interesting use case is to use Claude Code to review pull requests via GitHub actions. You can set up a GitHub Action that triggers on pull request events and uses Claude Code to analyze the changes, provide feedback, and even suggest code improvements. This can help streamline the code review process and ensure that your codebase maintains high quality.

  ```yaml
  # .github/workflows/claude.yml
  name: Claude Code

  on:
    issue_comment:
      types: [created]
    pull_request_review_comment:
      types: [created]
    issues:
      types: [opened, assigned]
    pull_request_review:
      types: [submitted]

  jobs:
    claude:
      # Only run when @claude is mentioned
      if: |
        (github.event_name == 'issue_comment' && contains(github.event.comment.body, '@claude')) ||
        (github.event_name == 'pull_request_review_comment' && contains(github.event.comment.body, '@claude')) ||
        (github.event_name == 'pull_request_review' && contains(github.event.review.body, '@claude')) ||
        (github.event_name == 'issues' && (contains(github.event.issue.body, '@claude') || contains(github.event.issue.title, '@claude')))
      runs-on: ubuntu-latest
      permissions:
        contents: write
        pull-requests: write
        issues: write
        id-token: write
        actions: read
      steps:
        - name: Checkout repository
          uses: actions/checkout@v6
          with:
            fetch-depth: 1

        - name: Run Claude Code
          id: claude
          uses: anthropics/claude-code-action@v1
          with:
            anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}

            # Optional: Customize the trigger phrase (default: @claude)
            # trigger_phrase: "/claude"

            # Optional: Trigger when specific user is assigned to an issue
            # assignee_trigger: "claude-bot"

            # Optional: Configure Claude's behavior
            # claude_args: |
            #   --model claude-opus-4-6
            #   --max-turns 10
            #   --allowedTools "Bash(npm install),Bash(npm run build),Bash(npm run test:*)"
  ```

  **How it works:**
  - Mention `@claude` in a PR comment, review, or issue to trigger a review.
  - Claude reads the PR diff, analyzes the changes, and posts feedback as a comment.
  - It can also push commits directly (e.g., fixing lint errors or applying suggestions).

  **Setup steps:**
  1. Run `/install-github-app` in Claude Code to install the GitHub App.
  2. Add your `ANTHROPIC_API_KEY` to your repo's **Settings > Secrets and variables > Actions**.
  3. Copy the workflow YAML above into `.github/workflows/claude.yml`.
  4. Open a PR and comment `@claude review this` to trigger a review.

  **References:**
  - [Official claude-code-action repo](https://github.com/anthropics/claude-code-action)
  - [Claude Code GitHub Actions docs](https://code.claude.com/docs/en/github-actions)

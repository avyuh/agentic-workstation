# telegram-bot

Telegram bot for agent management on the agentic workstation. This is a skeleton — the real implementation gets built by Claude Code on the VPS as a first exercise.

## What to Build

A TypeScript bot using [grammY](https://grammy.dev/) that lets you control and observe Claude Code agents running on the VPS from your phone.

### Commands

| Command | Description |
|---------|-------------|
| `/run <task>` | Kick off a new Claude Code agent with the given task description |
| `/status` | Show all running agents (worktrees, uptime, current step) |
| `/log [id]` | Tail the last N lines from an agent's log |
| `/diff [id]` | Show the git diff for an agent's worktree |
| `/stop <id>` | Send SIGTERM to a running agent |
| `/approve <id>` | Approve a HumanLayer checkpoint so an agent can proceed |
| `/worktree` | List all active git worktrees and their associated agents |

### Proactive Notifications

The bot should push messages to you without prompting:

- **Agent finished** — summary of what it did + diff stat
- **Agent error** — last log lines + exit code
- **HumanLayer approval needed** — prompt text with approve/deny buttons
- **Daily summary** — tasks completed, tokens used, any open worktrees

### Stack

- **Runtime**: Node.js (TypeScript)
- **Bot framework**: [grammY](https://grammy.dev/)
- **Config**: dotenv (`BOT_TOKEN`, `ALLOWED_USER_ID`)
- **Process management**: pm2 or systemd on the VPS

## Build Instructions (for Claude Code)

This project is the first real exercise for the agentic workstation setup. Run Claude Code inside this directory and give it this README as the spec.

Suggested first prompt:

> "Implement the telegram-bot described in README.md. Start with /status and /log, then add proactive notifications by watching a log directory. Use grammY, TypeScript, and dotenv."

## Environment Variables

```
BOT_TOKEN=        # from @BotFather
ALLOWED_USER_ID=  # your numeric Telegram user ID (bot rejects all other users)
LOG_DIR=          # path on VPS where agent logs are written
WORKTREE_BASE=    # base path for git worktrees
```

## Running

```bash
npm install
npm run dev      # ts-node watch mode
npm run build    # compile to dist/
npm start        # run compiled output
```

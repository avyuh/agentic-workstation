# peon

> "Something need doing?" — Warcraft III Peon

Telegram bot for managing agents on the agentic workstation. Send commands from your phone, get notified when agents finish or fail.

## Commands

| Command | Description |
|---------|-------------|
| `/run <project> <task>` | Start a Claude Code agent on a project |
| `/status` | Show all running agent sessions |
| `/log <session> [lines]` | Tail recent log output from an agent |
| `/diff <session>` | Show git diff for a project/worktree |
| `/stop <session>` | Stop a running agent |
| `/help` | List commands |

## Proactive Notifications

The bot watches `~/.agent-logs/` and pushes messages when:
- An agent finishes successfully
- An agent exits with an error

## Setup

```bash
cp .env.example .env
# Fill in BOT_TOKEN and ALLOWED_USER_ID
npm install
npm run build
npm start
```

## Environment Variables

```
BOT_TOKEN=        # from @BotFather
ALLOWED_USER_ID=  # your numeric Telegram user ID
```

## Running in production

```bash
tmux new -s peon
npm start
# Ctrl+B D to detach
```

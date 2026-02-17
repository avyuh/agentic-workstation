# agentic-workstation

Bootstrap a Hetzner VPS (Ubuntu 24.04) into a solo agentic coding environment.

One script. Clone, run, iterate. No Docker, no cloud-init — a real VM with tmux, persistent filesystem, and Claude Code CLI running headless agents.

## Quick Start

```bash
# On a fresh Hetzner CX42 (or any Ubuntu 24.04 VPS), as root:
git clone https://github.com/yourusername/agentic-workstation.git
cd agentic-workstation
./bootstrap.sh
```

The script will:
1. Create a `dev` user (if run as root) with your SSH keys
2. Install tools: tmux, Node.js 22, GitHub CLI, ripgrep, bat, Claude Code CLI
3. Harden SSH (key-only, no root login)
4. Set up directory structure, configs, and global Claude skills
5. Prompt for Anthropic API key and git identity

**After bootstrap, test SSH as `dev` in a NEW terminal before closing root.**

## Architecture

```
┌─────────────────────────────────────┐
│            Hetzner CX42             │
│                                     │
│  tmux: "projA-auth"                 │
│  └─ git worktree + Claude Code CLI  │
│                                     │
│  tmux: "projA-frontend"             │
│  └─ git worktree + Claude Code CLI  │
│                                     │
│  tmux: "projB-api"                  │
│  └─ git worktree + Claude Code CLI  │
│                                     │
│  Telegram bot (~300 LOC skeleton)   │
│  └─ receives commands, sends alerts │
│                                     │
└──────────────┬──────────────────────┘
               │
       ┌───────┴───────┐
       │               │
  SSH/Termius     Telegram
  (full terminal)  (quick commands)
```

## What's Included

### `bootstrap.sh`
Idempotent setup script. Safe to run repeatedly — each section is guarded by existence checks.

### `config/`
- **tmux.conf** — 50k scrollback, mouse support, status bar
- **bashrc.append** — PATH, nvm, env sourcing, aliases
- **global-claude.md** — Global Claude Code preferences (`~/.claude/CLAUDE.md`)

### `skills/`
Global Claude Code skills installed to `~/.claude/skills/`:
- **plan.md** — Research-then-plan workflow with task files
- **review.md** — Self-review checklist before completing
- **fix-from-test.md** — TDD: write failing test first, then fix

### `templates/project/`
Scaffold for new projects (used by `bin/new-project`):
- `CLAUDE.md` — Per-project agent instructions (table-of-contents pattern)
- `.claude/settings.local.json` — Hooks: verify_fast on every Write/Edit
- `scripts/verify_fast.sh` — Lint + typecheck + affected tests (<30s)
- `scripts/verify.sh` — Full test suite + build
- `docs/` — architecture.md, conventions.md, priorities.md, decisions/

### `bin/`
Helper scripts added to PATH:

| Script | Purpose |
|--------|---------|
| `new-project <name>` | Scaffold from template + git init |
| `clone-project <url>` | Clone repo + add agent infra (non-destructive) |
| `new-worktree <project> <branch>` | Git worktree + dedicated tmux session |
| `agent-run <project> "<prompt>"` | Start Claude Code headless in tmux |
| `agent-status` | List sessions: RUNNING / DONE / ERROR |
| `agent-log <project>` | Tail agent output |
| `agent-stop <project>` | Graceful stop (Ctrl+C then kill) |

### `telegram-bot/`
Skeleton for a Telegram notification bot. Build it on the VPS with Claude Code as a practical first exercise.

## Philosophy

1. **Human time is the scarcest resource.** Optimize for less waiting, more agents working.
2. **Verification is non-negotiable.** `verify.sh` outside the agent catches garbage.
3. **Context is a production dependency.** CLAUDE.md is a map (~100 lines), not an encyclopedia.
4. **Overnight agents are free leverage.** Queue work for when you sleep.
5. **Simplicity compounds.** tmux that just works beats orchestration you maintain.

## Scaling Path

| Stage | What Changes |
|-------|-------------|
| Solo + 1 agent | CLAUDE.md + verify.sh + good prompts |
| Solo + 3-4 concurrent | Git worktrees + tmux + planning skill |
| Solo + overnight | Hooks for auto-verify + cron for maintenance |
| Solo + mobile | This VPS + Telegram bot |
| Outgrew one box | Graduate to Fly.io "droids" pattern |

## License

MIT

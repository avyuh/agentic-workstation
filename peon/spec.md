# Peon Spec

> "Something need doing?" — Warcraft III Peon

Telegram bot for managing agents on the agentic workstation.

## Layers

| Layer | What it adds | Status |
|-------|-------------|--------|
| v1 — Logging Foundation | Echo "Work Work!", `/stats`, JSONL logging with trace IDs, console one-liners | **current** |
| v2 — Agent Management | `/run`, `/status`, `/stop`, `/log`, `/diff` via tmux sessions | planned |
| v3 — Watcher | Proactive notifications when agents finish or error | planned |
| v4 — Conversation | Forward free-text to `claude -p`, message queue, `/new` | planned |

## v1 Scope

### Commands
- `/stats` — CPU, memory, disk, uptime (formatted for Telegram)
- Any other text → replies "Work Work!"

### Auth
- Single allowed user ID from `ALLOWED_USER_ID` env var
- Unauthorized users get "Me not that kind of orc!"

### Logging
- Every message in and out is logged as JSONL to `~/.peon/logs/peon.jsonl`
- Each request gets a `trace_id` (time-base36 + random hex)
- Input and output are separate log entries sharing the same trace_id
- Human-readable one-liners to stdout for tmux visibility
- Errors logged with trace_id and stack trace

### Log Entry Schema
```json
{
  "ts": "ISO 8601 UTC",
  "trace_id": "m1x7k2p-a3f1c9d2",
  "event": "input|output|error",
  "command": "/stats|null",
  "user_id": 1100218513,
  "chat_id": 1100218513,
  "msg_id": 42,
  "text": "hello",
  "latency_ms": null,
  "ok": true
}
```

## Environment Variables
```
BOT_TOKEN=        # from @BotFather
ALLOWED_USER_ID=  # numeric Telegram user ID
```

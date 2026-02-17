# [Project Name]

[One sentence: what this is, who it's for]

Tech: [language] [version] + [framework] [version] + [database]

## Architecture
See docs/architecture.md for module boundaries and dependency rules.
- [2-3 key architectural constraints]
- Forbidden: [things that cause the most damage]

## Where to Look
- Architecture & domains: docs/architecture.md
- Conventions: docs/conventions.md
- Current priorities: docs/priorities.md
- Design decisions: docs/decisions/
- Skills: .claude/skills/

## How to Verify
- Quick check: `./scripts/verify_fast.sh` (lint + typecheck + affected tests, <30s)
- Full suite: `./scripts/verify.sh` (all tests + build)
- Run verify_fast after every significant change
- Run verify before considering any task done

## Working Rules
- Never weaken or delete tests to make them pass
- When you hit an edge case with multiple valid approaches, stop and surface options
- When uncertain, say so — don't guess silently
- Keep changes small and independently verifiable
- Never remove code you don't understand as a side effect

## Conventions
See docs/conventions.md for full details.
- [Naming pattern]
- [Error handling pattern]
- [Commit format]

## Known Pitfalls
[Grows iteratively — add after each agent correction]

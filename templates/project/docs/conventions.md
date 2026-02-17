# Conventions

## Naming
- Files: [e.g., kebab-case.ts]
- Functions: [e.g., camelCase]
- Types/Classes: [e.g., PascalCase]
- Constants: [e.g., UPPER_SNAKE_CASE]
- Database tables: [e.g., snake_case, plural]

## File Organization
[Where new files go, how to structure modules]

## Error Handling
[Pattern for errors: throw, return Result, error codes — pick one and stick to it]

## Logging
[Structured logging pattern, log levels, what to log vs not]

## Testing
- Test files live: [e.g., next to source as *.test.ts, or in tests/]
- Naming: [e.g., describe("ModuleName") > it("does specific thing")]
- Coverage target: [e.g., 80% lines]

## Commits
- Format: `type: short description` (e.g., `fix: handle null user in auth middleware`)
- Types: feat, fix, refactor, test, docs, chore
- Keep commits atomic — one logical change per commit

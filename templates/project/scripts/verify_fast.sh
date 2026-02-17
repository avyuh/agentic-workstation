#!/bin/bash
set -e

# Fast verification: lint + typecheck + affected tests
# Target: <30s. Runs automatically via Claude Code hooks on Write|Edit.
# Customize the commands below for your project's toolchain.

echo "=== Lint ==="
# Examples (uncomment one):
# npx eslint . --max-warnings 0
# npx biome check .
# ruff check .
echo "(no linter configured — add your linter command here)"

echo "=== Typecheck ==="
# Examples (uncomment one):
# npx tsc --noEmit
# pyright
echo "(no typecheck configured — add your typecheck command here)"

echo "=== Affected Tests ==="
# Examples (uncomment one):
# npx vitest run --changed
# npx jest --changedSince=HEAD
# pytest --lf
echo "(no test runner configured — add your test command here)"

echo "=== Fast verify passed ==="

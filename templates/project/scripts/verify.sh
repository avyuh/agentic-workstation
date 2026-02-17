#!/bin/bash
set -e

# Full verification: lint + typecheck + all tests + build
# Run before merge, before considering any task done.
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

echo "=== Full Test Suite ==="
# Examples (uncomment one):
# npx vitest run --coverage
# npx jest --coverage
# pytest --cov
echo "(no test runner configured — add your test command here)"

echo "=== Build ==="
# Examples (uncomment one):
# npm run build
# python -m build
# go build ./...
echo "(no build command configured — add your build command here)"

echo "=== All green ==="

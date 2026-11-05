#!/usr/bin/env bash
# Every check the project has; the pre-commit hook and CI run this. Fails on the first problem.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "== secrets"
uv run python -m tools.secrets_scan --also web/dist

echo "== python"
uv run ruff check .
uv run ruff format --check .
uv run mypy
uv run python scripts/complexity.py
uv run pytest -q

echo "== shell"
shellcheck --severity=style scripts/*.sh .githooks/*

echo "== web"
(cd web && npm run --silent check)
echo "hygiene: ok"

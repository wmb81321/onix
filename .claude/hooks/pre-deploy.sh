#!/bin/bash
# Event: PreToolUse (Bash commands matching railway deploy or mainnet)
# Blocks Railway deploys if agent tests are failing.
# Solidity/forge checks removed — no custom contracts in this project.

if echo "$CLAUDE_TOOL_INPUT" | grep -qE "railway (up|deploy)|--mainnet"; then
  echo "[hook] Deploy detected — running agent tests first..."
  ROOT="$(git rev-parse --show-toplevel 2>/dev/null || echo .)"

  cd "$ROOT/agent" && pnpm test --run || { echo "[hook] BLOCKED: Agent tests failed"; exit 1; }

  echo "[hook] Tests passed — deploy allowed"
fi

#!/bin/bash
# Event: PostToolUse (file edits)
# Runs agent unit tests when agent source changes.
# No Solidity contracts in this project — all escrow is Tempo Virtual Addresses.

CHANGED_FILE="${CLAUDE_TOOL_RESULT:-}"

if [[ "$CHANGED_FILE" == *"/agent/src/"* ]]; then
  echo "[hook] Agent source changed — running unit tests..."
  cd "$(git rev-parse --show-toplevel 2>/dev/null || echo .)/agent" && pnpm test --run 2>&1 | tail -20
fi

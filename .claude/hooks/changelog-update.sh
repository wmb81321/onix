#!/bin/bash
# Event: Stop (after Claude finishes a task)
# What: Reminds Claude to update CHANGELOG.md if files were changed
# Disable: Remove this file

if git diff --name-only 2>/dev/null | grep -qv "CHANGELOG.md"; then
  echo "[hook] Code changed — don't forget to update CHANGELOG.md"
fi

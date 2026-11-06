#!/usr/bin/env bash
# =============================================================================
#  Medicus Care — Automated Git Push Script
#
#  Usage:
#    ./push.sh                  # Auto-commits and pushes all changes
#    ./push.sh "Commit message" # Pushes with a custom commit message
#    ./push.sh --watch          # Watch mode: auto-pushes whenever files change
# =============================================================================

set -e

# Change to repository root
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$REPO_DIR"

# Color helpers
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

do_push() {
  local msg="$1"
  local current_branch
  current_branch=$(git branch --show-current 2>/dev/null || echo "main")

  # Add all files (including new, modified, and deleted)
  git add -A

  # Check if there are any changes to commit
  if git diff --cached --quiet; then
    echo -e "${YELLOW}ℹ No new changes to commit.${NC}"
  else
    if [ -z "$msg" ]; then
      msg="Auto-update: $(date '+%Y-%m-%d %H:%M:%S')"
    fi

    echo -e "${CYAN}📦 Committing changes with message:${NC} \"$msg\""
    git commit -m "$msg"
  fi

  echo -e "${CYAN}🚀 Pushing to origin/${current_branch}...${NC}"
  if git push origin "$current_branch"; then
    echo -e "${GREEN}✓ Successfully pushed all code to origin/${current_branch}!${NC}"
  else
    echo -e "${RED}✗ Git push failed. Please check your network or repository permissions.${NC}"
    return 1
  fi
}

# -----------------------------------------------------------------------------
# Watch Mode: Continuously monitors repo and auto-pushes on file changes
# -----------------------------------------------------------------------------
if [ "${1:-}" = "--watch" ]; then
  echo -e "${CYAN}👀 Watch mode active: auto-pushing on file changes (press Ctrl+C to stop)...${NC}"
  while true; do
    if [ -n "$(git status --porcelain)" ]; then
      echo -e "\n${YELLOW}Detected changes in repository...${NC}"
      sleep 2 # Debounce bursts of rapid saves
      do_push "Auto-save: $(date '+%Y-%m-%d %H:%M:%S')"
    fi
    sleep 3
  done
fi

# -----------------------------------------------------------------------------
# Single Push Mode
# -----------------------------------------------------------------------------
CUSTOM_MSG="${1:-}"
do_push "$CUSTOM_MSG"


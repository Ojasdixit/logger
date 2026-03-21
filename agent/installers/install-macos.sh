#!/bin/bash
# ──────────────────────────────────────────────────────────────────────
#  Employee Monitor Agent — macOS Installer
#  Run with: curl -fsSL <your-server>/install/macos | bash
# ──────────────────────────────────────────────────────────────────────

set -e

INSTALL_DIR="$HOME/.employee-monitor-agent"
REPO_URL="${AGENT_DOWNLOAD_URL:-https://your-server.com/downloads/agent-latest.tar.gz}"
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║   Employee Monitor Agent — macOS Installer   ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# ── Check Node.js ─────────────────────────────────────────────────────
if ! command -v node &> /dev/null; then
  echo -e "${YELLOW}Node.js not found. Installing via Homebrew...${NC}"
  if ! command -v brew &> /dev/null; then
    echo -e "${RED}Error: Homebrew is required to install Node.js.${NC}"
    echo "Install it from https://brew.sh then re-run this script."
    exit 1
  fi
  brew install node
fi

NODE_VERSION=$(node -v)
echo -e "${GREEN}✓${NC} Node.js ${NODE_VERSION} found"

# ── Download agent ────────────────────────────────────────────────────
if [ -d "$INSTALL_DIR" ]; then
  echo -e "${YELLOW}Existing installation found at ${INSTALL_DIR}${NC}"
  echo -n "  Overwrite? (y/n): "
  read -r OVERWRITE
  if [ "$OVERWRITE" != "y" ]; then
    echo "Aborted."
    exit 0
  fi
  rm -rf "$INSTALL_DIR"
fi

echo "Downloading agent..."

# If a local agent directory exists (dev mode), copy it
SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
if [ -f "$SCRIPT_DIR/package.json" ]; then
  echo "  (Using local source from ${SCRIPT_DIR})"
  mkdir -p "$INSTALL_DIR"
  cp -R "$SCRIPT_DIR/src" "$INSTALL_DIR/src"
  cp "$SCRIPT_DIR/package.json" "$INSTALL_DIR/package.json"
  [ -f "$SCRIPT_DIR/config.json" ] && cp "$SCRIPT_DIR/config.json" "$INSTALL_DIR/config.json"
else
  # Production: download tarball
  mkdir -p "$INSTALL_DIR"
  curl -fsSL "$REPO_URL" | tar -xz -C "$INSTALL_DIR" --strip-components=1
fi

# ── Install dependencies ──────────────────────────────────────────────
echo "Installing dependencies..."
cd "$INSTALL_DIR"
npm install --production --silent 2>&1 | tail -1

echo -e "${GREEN}✓${NC} Agent installed at ${INSTALL_DIR}"

# ── Run setup wizard ──────────────────────────────────────────────────
echo ""
echo "─── Running setup wizard ───"
echo ""
node src/setup.js

echo ""
echo -e "${GREEN}✓ Installation complete!${NC}"
echo ""
echo "  Agent location: ${INSTALL_DIR}"
echo "  Start manually: cd ${INSTALL_DIR} && npm start"
echo "  View logs:      cat ${INSTALL_DIR}/agent.log"
echo "  Uninstall:      cd ${INSTALL_DIR} && npm run uninstall-service && rm -rf ${INSTALL_DIR}"
echo ""

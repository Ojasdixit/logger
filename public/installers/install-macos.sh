#!/bin/bash
# ──────────────────────────────────────────────────────────────────────
#  Employee Monitor Agent — macOS Installer
#  Run with: curl -fsSL <installer-url>/installers/install-macos.sh | \
#    EMPLOYEE_ID="..." API_URL="..." API_KEY="..." bash
# ──────────────────────────────────────────────────────────────────────

set -e

INSTALL_DIR="$HOME/.employee-monitor-agent"
GITHUB_REPO="https://github.com/Ojasdixit/logger"
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
  echo -e "${YELLOW}Existing installation found. Overwriting...${NC}"
  rm -rf "$INSTALL_DIR"
fi

echo "Downloading agent from GitHub..."
mkdir -p "$INSTALL_DIR"
curl -fsSL "$GITHUB_REPO/archive/refs/heads/main.tar.gz" | tar -xz -C "$INSTALL_DIR" --strip-components=2 "logger-main/agent"

# ── Install dependencies ──────────────────────────────────────────────
echo "Installing dependencies..."
cd "$INSTALL_DIR"
npm install --production --silent 2>&1 | tail -1

echo -e "${GREEN}✓${NC} Agent installed at ${INSTALL_DIR}"

# ── Run setup wizard ──────────────────────────────────────────────────
echo ""
echo "─── Running setup wizard ───"
echo ""
EMPLOYEE_ID="$EMPLOYEE_ID" API_URL="$API_URL" API_KEY="$API_KEY" AUTO_START="y" node src/setup.js < /dev/tty

echo ""
echo -e "${GREEN}✓ Installation complete!${NC}"
echo ""
echo "  Agent location: ${INSTALL_DIR}"
echo "  Start manually: cd ${INSTALL_DIR} && npm start"
echo "  View logs:      cat ${INSTALL_DIR}/agent.log"
echo "  Uninstall:      cd ${INSTALL_DIR} && npm run uninstall-service && rm -rf ${INSTALL_DIR}"
echo ""

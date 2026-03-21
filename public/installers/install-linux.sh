#!/bin/bash
# ──────────────────────────────────────────────────────────────────────
#  Employee Monitor Agent — Linux Installer
#  Run with: curl -fsSL <your-server>/install/linux | bash
# ──────────────────────────────────────────────────────────────────────

set -e

INSTALL_DIR="$HOME/.employee-monitor-agent"
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║   Employee Monitor Agent — Linux Installer   ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# ── Check Node.js ─────────────────────────────────────────────────────
if ! command -v node &> /dev/null; then
  echo -e "${YELLOW}Node.js not found. Installing via NodeSource...${NC}"
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

NODE_VERSION=$(node -v)
echo -e "${GREEN}✓${NC} Node.js ${NODE_VERSION} found"

# ── Screenshot dependencies (X11) ────────────────────────────────────
if ! command -v import &> /dev/null && ! command -v scrot &> /dev/null; then
  echo -e "${YELLOW}Installing screenshot dependencies...${NC}"
  sudo apt-get install -y scrot 2>/dev/null || echo "  scrot not available, screenshots may not work"
fi

# ── Download agent ────────────────────────────────────────────────────
if [ -d "$INSTALL_DIR" ]; then
  echo -e "${YELLOW}Existing installation found. Overwriting...${NC}"
  rm -rf "$INSTALL_DIR"
fi

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
if [ -f "$SCRIPT_DIR/package.json" ]; then
  echo "  (Using local source from ${SCRIPT_DIR})"
  mkdir -p "$INSTALL_DIR"
  cp -R "$SCRIPT_DIR/src" "$INSTALL_DIR/src"
  cp "$SCRIPT_DIR/package.json" "$INSTALL_DIR/package.json"
  [ -f "$SCRIPT_DIR/config.json" ] && cp "$SCRIPT_DIR/config.json" "$INSTALL_DIR/config.json"
else
  mkdir -p "$INSTALL_DIR"
  curl -fsSL "${AGENT_DOWNLOAD_URL}" | tar -xz -C "$INSTALL_DIR" --strip-components=1
fi

# ── Install dependencies ──────────────────────────────────────────────
echo "Installing dependencies..."
cd "$INSTALL_DIR"
npm install --production --silent 2>&1 | tail -1

echo -e "${GREEN}✓${NC} Agent installed at ${INSTALL_DIR}"

# ── Run setup wizard ──────────────────────────────────────────────────
echo ""
node src/setup.js

echo ""
echo -e "${GREEN}✓ Installation complete!${NC}"
echo ""
echo "  Manage service:   systemctl --user [start|stop|status] employee-monitor-agent"
echo "  View logs:        journalctl --user -u employee-monitor-agent -f"
echo "  Uninstall:        cd ${INSTALL_DIR} && npm run uninstall-service && rm -rf ${INSTALL_DIR}"
echo ""

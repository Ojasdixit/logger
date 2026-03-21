#!/usr/bin/env node
/**
 * Registers/unregisters the agent as a startup service.
 *   macOS   → ~/Library/LaunchAgents plist
 *   Linux   → ~/.config/systemd/user unit
 *   Windows → HKCU\...\Run registry key
 *
 * Usage:
 *   node service.js install
 *   node service.js uninstall
 */
const fs = require("fs");
const path = require("path");
const os = require("os");
const { execSync } = require("child_process");

const AGENT_DIR = path.resolve(__dirname, "..");
const NODE_PATH = process.execPath;
const ENTRY = path.join(AGENT_DIR, "src", "index.js");
const LABEL = "com.employee-monitor.agent";
const LOG_PATH = path.join(AGENT_DIR, "agent.log");

// ── macOS: LaunchAgent plist ─────────────────────────────────────────

function macosInstall() {
  const plistDir = path.join(os.homedir(), "Library", "LaunchAgents");
  const plistPath = path.join(plistDir, `${LABEL}.plist`);

  if (!fs.existsSync(plistDir)) fs.mkdirSync(plistDir, { recursive: true });

  const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${LABEL}</string>
  <key>ProgramArguments</key>
  <array>
    <string>${NODE_PATH}</string>
    <string>${ENTRY}</string>
  </array>
  <key>WorkingDirectory</key>
  <string>${AGENT_DIR}</string>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>${LOG_PATH}</string>
  <key>StandardErrorPath</key>
  <string>${LOG_PATH}</string>
</dict>
</plist>`;

  fs.writeFileSync(plistPath, plist);
  execSync(`launchctl load -w "${plistPath}"`);
  console.log(`  ✓ macOS LaunchAgent installed → ${plistPath}`);
  console.log("    Agent will start on login and restart if it crashes.");
}

function macosUninstall() {
  const plistPath = path.join(
    os.homedir(),
    "Library",
    "LaunchAgents",
    `${LABEL}.plist`
  );
  if (fs.existsSync(plistPath)) {
    try {
      execSync(`launchctl unload "${plistPath}"`);
    } catch {
      // may already be unloaded
    }
    fs.unlinkSync(plistPath);
    console.log("  ✓ macOS LaunchAgent removed.");
  } else {
    console.log("  No LaunchAgent found — nothing to remove.");
  }
}

// ── Linux: systemd user unit ─────────────────────────────────────────

function linuxInstall() {
  const unitDir = path.join(os.homedir(), ".config", "systemd", "user");
  const unitPath = path.join(unitDir, "employee-monitor-agent.service");

  if (!fs.existsSync(unitDir)) fs.mkdirSync(unitDir, { recursive: true });

  const unit = `[Unit]
Description=Employee Monitor Agent
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
WorkingDirectory=${AGENT_DIR}
ExecStart=${NODE_PATH} ${ENTRY}
Restart=always
RestartSec=10

[Install]
WantedBy=default.target
`;

  fs.writeFileSync(unitPath, unit);
  execSync("systemctl --user daemon-reload");
  execSync("systemctl --user enable employee-monitor-agent.service");
  execSync("systemctl --user start employee-monitor-agent.service");
  console.log(`  ✓ systemd user service installed → ${unitPath}`);
  console.log("    Agent will start on login and restart if it crashes.");
}

function linuxUninstall() {
  try {
    execSync("systemctl --user stop employee-monitor-agent.service");
    execSync("systemctl --user disable employee-monitor-agent.service");
  } catch {
    // ignore if not running
  }
  const unitPath = path.join(
    os.homedir(),
    ".config",
    "systemd",
    "user",
    "employee-monitor-agent.service"
  );
  if (fs.existsSync(unitPath)) {
    fs.unlinkSync(unitPath);
    execSync("systemctl --user daemon-reload");
  }
  console.log("  ✓ systemd user service removed.");
}

// ── Windows: Registry Run key ────────────────────────────────────────

function windowsInstall() {
  const cmd = `"${NODE_PATH}" "${ENTRY}"`;
  try {
    execSync(
      `reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" /v EmployeeMonitorAgent /t REG_SZ /d "${cmd}" /f`
    );
    console.log("  ✓ Windows startup registry key added.");
    console.log("    Agent will start on login.");
  } catch (err) {
    throw new Error("Failed to write registry key: " + err.message);
  }
}

function windowsUninstall() {
  try {
    execSync(
      `reg delete "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" /v EmployeeMonitorAgent /f`
    );
    console.log("  ✓ Windows startup registry key removed.");
  } catch {
    console.log("  No registry key found — nothing to remove.");
  }
}

// ── Dispatcher ───────────────────────────────────────────────────────

function installService() {
  const platform = process.platform;
  console.log(`\n  Installing auto-start service (${platform})...`);
  if (platform === "darwin") macosInstall();
  else if (platform === "linux") linuxInstall();
  else if (platform === "win32") windowsInstall();
  else throw new Error(`Unsupported platform: ${platform}`);
}

function uninstallService() {
  const platform = process.platform;
  console.log(`\n  Removing auto-start service (${platform})...`);
  if (platform === "darwin") macosUninstall();
  else if (platform === "linux") linuxUninstall();
  else if (platform === "win32") windowsUninstall();
  else throw new Error(`Unsupported platform: ${platform}`);
}

// CLI entry point
if (require.main === module) {
  const action = process.argv[2];
  if (action === "install") installService();
  else if (action === "uninstall") uninstallService();
  else console.log("Usage: node service.js [install|uninstall]");
}

module.exports = { installService, uninstallService };

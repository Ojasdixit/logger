#!/usr/bin/env node
/**
 * Interactive first-run setup wizard.
 * Walks the user through configuring the agent, writes config.json,
 * and optionally registers the agent as a startup service.
 */
const fs = require("fs");
const path = require("path");
const readline = require("readline");
const axios = require("axios");

const CONFIG_PATH = path.join(__dirname, "..", "config.json");

const DEFAULTS = {
  apiUrl: "http://localhost:4000/api",
  apiKey: "agent-secret-key-2026",
  userId: "",
  screenshotIntervalMs: 600000,
  activityTrackIntervalMs: 10000,
  activityFlushIntervalMs: 60000,
  idleThresholdMs: 120000,
  screenshot: { width: 1280, quality: 60 },
};

// ── Helpers ──────────────────────────────────────────────────────────

function ask(rl, question, defaultVal) {
  const prompt = defaultVal ? `${question} [${defaultVal}]: ` : `${question}: `;
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer.trim() || defaultVal || "");
    });
  });
}

function banner() {
  console.log("");
  console.log("╔══════════════════════════════════════════════╗");
  console.log("║       Employee Monitor Agent — Setup         ║");
  console.log("╚══════════════════════════════════════════════╝");
  console.log("");
}

// ── Main setup flow ──────────────────────────────────────────────────

async function main() {
  banner();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  // Load existing config if re-running setup
  let existing = { ...DEFAULTS };
  if (fs.existsSync(CONFIG_PATH)) {
    try {
      existing = { ...DEFAULTS, ...JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8")) };
      console.log("  Found existing config.json — press Enter to keep current values.\n");
    } catch {
      // ignore parse errors
    }
  }

  // Step 1: Server connection
  console.log("─── Step 1: Server Connection ───\n");
  const apiUrl = await ask(rl, "  Backend API URL", existing.apiUrl);
  const apiKey = await ask(rl, "  Agent API Key", existing.apiKey);

  // Validate connection
  console.log("\n  Testing connection...");
  try {
    const res = await axios.get(`${apiUrl}/health`, { timeout: 5000 });
    if (res.data.status === "ok") {
      console.log("  ✓ Connected to backend successfully\n");
    }
  } catch {
    console.log("  ⚠ Could not reach the backend. Make sure it's running.");
    console.log("    You can fix this later in config.json\n");
  }

  // Step 2: Employee identity
  console.log("─── Step 2: Employee Identity ───\n");
  const userId = await ask(rl, "  Employee User ID (UUID from admin)", existing.userId);

  if (!userId) {
    console.log("\n  ⚠ No User ID provided. The agent won't work without one.");
    console.log("    Ask your admin for your Employee ID from the dashboard.\n");
  }

  // Step 3: Monitoring settings
  console.log("─── Step 3: Monitoring Settings ───\n");
  const ssIntervalMin = await ask(
    rl,
    "  Screenshot interval (minutes)",
    String(existing.screenshotIntervalMs / 60000)
  );
  const idleMin = await ask(
    rl,
    "  Idle timeout (minutes)",
    String(existing.idleThresholdMs / 60000)
  );

  // Step 4: Auto-start
  console.log("\n─── Step 4: Auto-Start ───\n");
  const autoStart = await ask(rl, "  Start agent on system boot? (y/n)", "y");

  rl.close();

  // ── Write config ───────────────────────────────────────────────────
  const config = {
    apiUrl,
    apiKey,
    userId,
    screenshotIntervalMs: parseFloat(ssIntervalMin) * 60000,
    activityTrackIntervalMs: 10000,
    activityFlushIntervalMs: 60000,
    idleThresholdMs: parseFloat(idleMin) * 60000,
    screenshot: { width: 1280, quality: 60 },
  };

  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + "\n");
  console.log(`\n  ✓ Config saved to ${CONFIG_PATH}`);

  // ── Register auto-start service ────────────────────────────────────
  if (autoStart.toLowerCase() === "y") {
    try {
      const { installService } = require("./service");
      await installService();
    } catch (err) {
      console.log(`  ⚠ Could not register auto-start: ${err.message}`);
      console.log("    You can register it manually with: npm run install-service");
    }
  }

  console.log("\n╔══════════════════════════════════════════════╗");
  console.log("║              Setup Complete!                  ║");
  console.log("╠══════════════════════════════════════════════╣");
  console.log("║  Start the agent:    npm start               ║");
  console.log("║  Re-run setup:       npm run setup            ║");
  console.log("║  Remove auto-start:  npm run uninstall-service║");
  console.log("╚══════════════════════════════════════════════╝\n");
}

main().catch(console.error);

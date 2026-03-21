#!/usr/bin/env node
const screenshot = require("screenshot-desktop");
const sharp = require("sharp");
const axios = require("axios");
const FormData = require("form-data");
const path = require("path");
const fs = require("fs");
const notifier = require("node-notifier");
const { trackActivity, flushActivities } = require("./activity");

// ── Load config ──────────────────────────────────────────────────────
const CONFIG_PATH = path.join(__dirname, "..", "config.json");

if (!fs.existsSync(CONFIG_PATH)) {
  console.error("No config.json found. Run setup first: npm run setup");
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));

if (!config.userId) {
  console.error("No userId in config.json. Run setup first: npm run setup");
  process.exit(1);
}

const api = axios.create({
  baseURL: config.apiUrl,
  headers: { "x-api-key": config.apiKey },
  timeout: 30000,
});

// ── Notify helper (system tray notification) ─────────────────────────
function notify(title, message) {
  notifier.notify({
    title: `Employee Monitor — ${title}`,
    message,
    sound: false,
  });
}

// ── Screenshot capture & upload ──────────────────────────────────────
let screenshotCount = 0;
let uploadErrors = 0;

async function captureAndUpload() {
  try {
    const imgBuffer = await screenshot({ format: "png" });

    const compressed = await sharp(imgBuffer)
      .resize({ width: config.screenshot.width })
      .jpeg({ quality: config.screenshot.quality })
      .toBuffer();

    const sizeBefore = (imgBuffer.length / 1024).toFixed(0);
    const sizeAfter = (compressed.length / 1024).toFixed(0);
    console.log(
      `[${ts()}] Screenshot captured (${sizeBefore}KB → ${sizeAfter}KB)`
    );

    await uploadWithRetry(compressed);
    screenshotCount++;
  } catch (err) {
    console.error(`[${ts()}] Screenshot capture error:`, err.message);
  }
}

async function uploadWithRetry(buffer, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const form = new FormData();
      form.append("screenshot", buffer, {
        filename: `screenshot-${Date.now()}.jpg`,
        contentType: "image/jpeg",
      });
      form.append("user_id", config.userId);

      await api.post("/upload-screenshot", form, {
        headers: form.getHeaders(),
        maxContentLength: 10 * 1024 * 1024,
      });

      console.log(`  → Uploaded (attempt ${attempt})`);
      uploadErrors = 0;
      return;
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      console.error(`  → Upload attempt ${attempt}/${retries} failed: ${msg}`);
      if (attempt < retries) {
        await sleep(attempt * 2000);
      }
    }
  }
  uploadErrors++;
  // Notify user after 3 consecutive failures
  if (uploadErrors >= 3) {
    notify("Connection Issue", "Cannot reach the server. Screenshots are being skipped.");
    uploadErrors = 0;
  }
}

// ── Activity flush (send batched logs to backend) ────────────────────
async function flushToServer() {
  const activities = flushActivities();
  if (activities.length === 0) return;

  try {
    await api.post("/log-activity", {
      user_id: config.userId,
      activities,
    });
    console.log(`[${ts()}] Flushed ${activities.length} activity logs`);
  } catch (err) {
    console.error(
      `[${ts()}] Activity flush error:`,
      err.response?.data?.error || err.message
    );
  }
}

// ── Helpers ──────────────────────────────────────────────────────────
function ts() {
  return new Date().toISOString();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Main ─────────────────────────────────────────────────────────────
async function main() {
  console.log("═══════════════════════════════════════════════");
  console.log("  Employee Monitor Agent v1.0.0");
  console.log(`  User: ${config.userId}`);
  console.log(`  API:  ${config.apiUrl}`);
  console.log(`  Screenshots every ${config.screenshotIntervalMs / 60000} min`);
  console.log("═══════════════════════════════════════════════\n");

  // System notification on start
  notify("Started", "Monitoring is active.");

  // Take initial screenshot
  await captureAndUpload();

  // Periodic tasks
  setInterval(captureAndUpload, config.screenshotIntervalMs);
  setInterval(() => trackActivity(config.idleThresholdMs), config.activityTrackIntervalMs);
  setInterval(flushToServer, config.activityFlushIntervalMs);

  // Graceful shutdown
  for (const sig of ["SIGINT", "SIGTERM"]) {
    process.on(sig, async () => {
      console.log(`\n[${ts()}] Shutting down (${sig})...`);
      await flushToServer(); // flush any remaining activity
      notify("Stopped", "Monitoring paused.");
      process.exit(0);
    });
  }
}

main().catch(console.error);

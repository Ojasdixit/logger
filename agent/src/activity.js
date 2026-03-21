let activityBuffer = [];
let lastInputTime = Date.now();
let lastWindowTitle = "";

// Track the currently active window and idle state
async function trackActivity(idleThresholdMs) {
  try {
    // Dynamic import because active-win is ESM-only in v8+
    const activeWin = (await import("active-win")).default;
    const win = await activeWin();

    const now = Date.now();
    const isIdle = now - lastInputTime > idleThresholdMs;

    // Update last input time if the window changed (indicates user activity)
    if (win && win.title !== lastWindowTitle) {
      lastInputTime = now;
      lastWindowTitle = win.title || "";
    }

    const entry = {
      app_name: win?.owner?.name || "Unknown",
      window_title: win?.title || "",
      status: isIdle ? "idle" : "active",
      timestamp: new Date().toISOString(),
    };

    activityBuffer.push(entry);
  } catch (err) {
    // Silently handle — active-win can fail if no focused window
    activityBuffer.push({
      app_name: "Unknown",
      window_title: "",
      status: "idle",
      timestamp: new Date().toISOString(),
    });
  }
}

// Return buffered activities and clear the buffer
function flushActivities() {
  const batch = [...activityBuffer];
  activityBuffer = [];
  return batch;
}

module.exports = { trackActivity, flushActivities };

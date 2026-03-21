require("dotenv").config();
const express = require("express");
const cors = require("cors");

const screenshotRoutes = require("./routes/screenshots");
const activityRoutes = require("./routes/activity");
const employeeRoutes = require("./routes/employees");

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "10mb" }));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api", screenshotRoutes);
app.use("/api", activityRoutes);
app.use("/api", employeeRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Employee Monitor API running on port ${PORT}`);
});

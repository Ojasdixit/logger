const express = require("express");
const supabase = require("../config/supabase");
const { agentAuth, adminAuth } = require("../middleware/auth");

const router = express.Router();

// POST /api/log-activity — agent sends activity data (batch)
router.post("/log-activity", agentAuth, async (req, res) => {
  try {
    const { user_id, activities } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: "user_id is required" });
    }
    if (!activities || !Array.isArray(activities) || activities.length === 0) {
      return res.status(400).json({ error: "activities array is required" });
    }

    // Map and validate each activity
    const records = activities.map((a) => ({
      user_id,
      app_name: a.app_name || "Unknown",
      window_title: a.window_title || "",
      status: a.status === "idle" ? "idle" : "active",
      timestamp: a.timestamp || new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from("activity_logs")
      .insert(records)
      .select();

    if (error) {
      console.error("Supabase activity insert error:", error);
      return res.status(500).json({ error: "Failed to log activity" });
    }

    res.status(201).json({
      message: `${data.length} activity logs saved`,
      count: data.length,
    });
  } catch (err) {
    console.error("Log activity error:", err);
    res.status(500).json({ error: "Failed to log activity" });
  }
});

// GET /api/employee/:id/activity — admin fetches activity for an employee
router.get("/employee/:id/activity", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { date, status, page = 1, limit = 50 } = req.query;

    const offset = (page - 1) * limit;

    let query = supabase
      .from("activity_logs")
      .select("*", { count: "exact" })
      .eq("user_id", id)
      .order("timestamp", { ascending: false })
      .range(offset, offset + limit - 1);

    if (date) {
      query = query
        .gte("timestamp", `${date}T00:00:00.000Z`)
        .lte("timestamp", `${date}T23:59:59.999Z`);
    }

    if (status && (status === "active" || status === "idle")) {
      query = query.eq("status", status);
    }

    const { data, error, count } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({
      activities: data,
      total: count,
      page: Number(page),
      totalPages: Math.ceil(count / limit),
    });
  } catch (err) {
    console.error("Fetch activity error:", err);
    res.status(500).json({ error: "Failed to fetch activity" });
  }
});

module.exports = router;

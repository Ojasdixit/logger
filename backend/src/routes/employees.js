const express = require("express");
const supabase = require("../config/supabase");
const { adminAuth } = require("../middleware/auth");

const router = express.Router();

// GET /api/employees — list all employees with latest activity summary
router.get("/employees", adminAuth, async (req, res) => {
  try {
    const { data: employees, error } = await supabase
      .from("employees")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Fetch latest activity and screenshot count for each employee
    const enriched = await Promise.all(
      employees.map(async (emp) => {
        // Latest activity
        const { data: latestActivity } = await supabase
          .from("activity_logs")
          .select("app_name, status, timestamp")
          .eq("user_id", emp.id)
          .order("timestamp", { ascending: false })
          .limit(1)
          .single();

        // Today's screenshot count
        const today = new Date().toISOString().split("T")[0];
        const { count: screenshotCount } = await supabase
          .from("screenshots")
          .select("*", { count: "exact", head: true })
          .eq("user_id", emp.id)
          .gte("timestamp", `${today}T00:00:00.000Z`);

        return {
          ...emp,
          last_active: latestActivity?.timestamp || null,
          current_status: latestActivity?.status || "offline",
          current_app: latestActivity?.app_name || null,
          today_screenshots: screenshotCount || 0,
        };
      })
    );

    res.json({ employees: enriched });
  } catch (err) {
    console.error("Fetch employees error:", err);
    res.status(500).json({ error: "Failed to fetch employees" });
  }
});

// POST /api/employees — register new employee
router.post("/employees", adminAuth, async (req, res) => {
  try {
    const { name, email, department } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: "name and email are required" });
    }

    const { data, error } = await supabase
      .from("employees")
      .insert({ name, email, department })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return res.status(409).json({ error: "Employee with this email already exists" });
      }
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json({ employee: data });
  } catch (err) {
    console.error("Create employee error:", err);
    res.status(500).json({ error: "Failed to create employee" });
  }
});

// GET /api/employee/:id — get single employee details
router.get("/employee/:id", adminAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .eq("id", req.params.id)
      .single();

    if (error) {
      return res.status(404).json({ error: "Employee not found" });
    }

    res.json({ employee: data });
  } catch (err) {
    console.error("Fetch employee error:", err);
    res.status(500).json({ error: "Failed to fetch employee" });
  }
});

module.exports = router;

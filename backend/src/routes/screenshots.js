const express = require("express");
const multer = require("multer");
const cloudinary = require("../config/cloudinary");
const supabase = require("../config/supabase");
const { agentAuth, adminAuth } = require("../middleware/auth");

const router = express.Router();

// Store uploads in memory for streaming to Cloudinary
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

// POST /api/upload-screenshot — agent uploads a screenshot
router.post(
  "/upload-screenshot",
  agentAuth,
  upload.single("screenshot"),
  async (req, res) => {
    try {
      const { user_id } = req.body;

      if (!user_id) {
        return res.status(400).json({ error: "user_id is required" });
      }
      if (!req.file) {
        return res.status(400).json({ error: "screenshot file is required" });
      }

      // Build Cloudinary folder path: employee_id/YYYY-MM-DD
      const today = new Date().toISOString().split("T")[0];
      const folder = `employee-monitor/${user_id}/${today}`;

      // Upload to Cloudinary via buffer stream
      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: "image",
            transformation: [{ quality: "auto", fetch_format: "auto" }],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(req.file.buffer);
      });

      // Build thumbnail URL using Cloudinary transformations
      const thumbnailUrl = cloudinary.url(uploadResult.public_id, {
        width: 400,
        height: 250,
        crop: "fill",
        quality: "auto",
        fetch_format: "auto",
      });

      // Save record in Supabase
      const { data, error } = await supabase
        .from("screenshots")
        .insert({
          user_id,
          image_url: uploadResult.secure_url,
          thumbnail_url: thumbnailUrl,
        })
        .select()
        .single();

      if (error) {
        console.error("Supabase insert error:", error);
        return res.status(500).json({ error: "Failed to save screenshot record" });
      }

      res.status(201).json({
        message: "Screenshot uploaded",
        screenshot: data,
      });
    } catch (err) {
      console.error("Screenshot upload error:", err);
      res.status(500).json({ error: "Screenshot upload failed" });
    }
  }
);

// GET /api/employee/:id/screenshots — admin fetches screenshots for an employee
router.get("/employee/:id/screenshots", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { date, page = 1, limit = 20 } = req.query;

    const offset = (page - 1) * limit;

    let query = supabase
      .from("screenshots")
      .select("*", { count: "exact" })
      .eq("user_id", id)
      .order("timestamp", { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by date if provided
    if (date) {
      const startOfDay = `${date}T00:00:00.000Z`;
      const endOfDay = `${date}T23:59:59.999Z`;
      query = query.gte("timestamp", startOfDay).lte("timestamp", endOfDay);
    }

    const { data, error, count } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({
      screenshots: data,
      total: count,
      page: Number(page),
      totalPages: Math.ceil(count / limit),
    });
  } catch (err) {
    console.error("Fetch screenshots error:", err);
    res.status(500).json({ error: "Failed to fetch screenshots" });
  }
});

module.exports = router;

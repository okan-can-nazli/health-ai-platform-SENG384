import { Router } from "express";
import { pool } from "../config/db.js";
import authRoutes from "./authRoutes.js";
import postRoutes from "./postRoutes.js";
import meetingRoutes from "./meetingRoutes.js";
import adminRoutes from "./adminRoutes.js";
import notificationRoutes from "./notificationRoutes.js";

const router = Router();

router.get("/health", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW() AS now");
    res.json({
      ok: true,
      message: "Server is running.",
      databaseTime: result.rows[0].now
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: "Database connection failed.",
      error: error.message
    });
  }
});

router.use("/auth", authRoutes);
router.use("/posts", postRoutes);
router.use("/meetings", meetingRoutes);
router.use("/admin", adminRoutes);
router.use("/notifications", notificationRoutes);

export default router;

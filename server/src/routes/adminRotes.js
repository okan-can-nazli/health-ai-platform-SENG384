import { Router } from "express";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { requireRole } from "../middlewares/roleMiddleware.js";
import {
  getAdminUsers,
  updateUserStatus,
  getAdminPosts,
  deletePostAsAdmin,
  getActivityLogs,
  exportActivityLogsCsv
} from "../controllers/adminController.js";

const router = Router();

router.use(requireAuth);
router.use(requireRole("admin"));

router.get("/users", getAdminUsers);
router.patch("/users/:id/status", updateUserStatus);

router.get("/posts", getAdminPosts);
router.delete("/posts/:id", deletePostAsAdmin);

router.get("/logs", getActivityLogs);
router.get("/logs/export/csv", exportActivityLogsCsv);

export default router;

import { Router } from "express";
import { requireAuth } from "../middlewares/authMiddleware.js";
import {
  getMyNotifications,
  markNotificationAsRead
} from "../controllers/notificationController.js";

const router = Router();

router.use(requireAuth);

router.get("/", getMyNotifications);
router.patch("/:id/read", markNotificationAsRead);

export default router;

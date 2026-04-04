import { Router } from "express";
import { requireAuth } from "../middlewares/authMiddleware.js";
import {
  createMeetingRequest,
  getMeetingRequests,
  updateMeetingRequestStatus
} from "../controllers/meetingController.js";

const router = Router();

router.use(requireAuth);

router.get("/", getMeetingRequests);
router.post("/", createMeetingRequest);
router.patch("/:id/status", updateMeetingRequestStatus);

export default router;

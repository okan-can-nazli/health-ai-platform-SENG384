import { Router } from "express";
import {
  register,
  verifyEmail,
  login,
  getCurrentUser
} from "../controllers/authController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";

const router = Router();

router.post("/register", register);
router.post("/verify-email", verifyEmail);
router.post("/login", login);
router.get("/me", requireAuth, getCurrentUser);

export default router;

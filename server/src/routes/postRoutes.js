import { Router } from "express";
import { requireAuth } from "../middlewares/authMiddleware.js";
import {
  createPost,
  getAllPosts,
  getPostById,
  updatePost,
  updatePostStatus
} from "../controllers/postController.js";

const router = Router();

router.use(requireAuth);

router.get("/", getAllPosts);
router.get("/:id", getPostById);
router.post("/", createPost);
router.put("/:id", updatePost);
router.patch("/:id/status", updatePostStatus);

export default router;

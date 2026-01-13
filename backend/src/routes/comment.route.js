import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { dislikeComment, likeComment, replyToComment } from "../controllers/comment.controller.js";

const router = express.Router();

router.route("/:id/like").get(isAuthenticated, likeComment);
router.route("/:id/dislike").get(isAuthenticated, dislikeComment);
router.route("/:id/reply").post(isAuthenticated, replyToComment);

export default router;

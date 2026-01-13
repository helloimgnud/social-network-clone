import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import upload from "../middlewares/multer.js";
import {
    createStory,
    getFollowingStories,
    getUserStories,
    getMyStories,
    markStoryViewed,
    deleteStory
} from "../controllers/story.controller.js";

const router = express.Router();

router.route("/create").post(isAuthenticated, upload.single('media'), createStory);
router.route("/feed").get(isAuthenticated, getFollowingStories);
router.route("/user/:id").get(isAuthenticated, getUserStories);
router.route("/my").get(isAuthenticated, getMyStories);
router.route("/:id/view").post(isAuthenticated, markStoryViewed);
router.route("/delete/:id").delete(isAuthenticated, deleteStory);

export default router;

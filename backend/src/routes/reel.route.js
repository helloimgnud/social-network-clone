import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import upload from "../middlewares/multer.js";
import {
    createReel,
    getAllReels,
    getUserReels,
    likeReel,
    dislikeReel,
    addReelComment,
    deleteReel,
    incrementView,
    bookmarkReel,
    getSavedReels
} from "../controllers/reel.controller.js";

const router = express.Router();

router.route("/addreel").post(isAuthenticated, upload.single('video'), createReel);
router.route("/all").get(isAuthenticated, getAllReels);
router.route("/saved").get(isAuthenticated, getSavedReels);
router.route("/user/:id").get(isAuthenticated, getUserReels);
router.route("/:id/like").get(isAuthenticated, likeReel);
router.route("/:id/dislike").get(isAuthenticated, dislikeReel);
router.route("/:id/comment").post(isAuthenticated, addReelComment);
router.route("/:id/bookmark").get(isAuthenticated, bookmarkReel);
router.route("/delete/:id").delete(isAuthenticated, deleteReel);
router.route("/:id/view").post(isAuthenticated, incrementView);

export default router;

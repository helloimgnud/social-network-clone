import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import upload from "../middlewares/multer.js";
import {
    addComment,
    addNewPost,
    bookmarkPost,
    deletePost,
    dislikePost,
    getAllPost,
    getCommentsOfPost,
    getUserPost,
    likePost,
    repost,
    archivePost,
    getArchivedPosts,
    getPostById
} from "../controllers/post.controller.js";

const router = express.Router();

router.route("/addpost").post(isAuthenticated, upload.single('image'), addNewPost);
router.route("/all").get(isAuthenticated, getAllPost);
router.route("/userpost/all").get(isAuthenticated, getUserPost);
router.route("/:id/like").get(isAuthenticated, likePost);
router.route("/:id/dislike").get(isAuthenticated, dislikePost);
router.route("/:id/comment").post(isAuthenticated, addComment);
router.route("/:id/comment/all").get(isAuthenticated, getCommentsOfPost);
router.route("/delete/:id").delete(isAuthenticated, deletePost);
router.route("/:id/bookmark").get(isAuthenticated, bookmarkPost);
router.route("/:id/repost").post(isAuthenticated, repost);
router.route("/archive/:id").get(isAuthenticated, archivePost);
router.route("/archived/all").get(isAuthenticated, getArchivedPosts);
router.route("/get/:id").get(isAuthenticated, getPostById); // fetching single post

export default router;
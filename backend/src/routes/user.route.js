import express from "express";
import {
    editProfile,
    followOrUnfollow,
    getProfile,
    getSuggestedUsers,
    login,
    logout,
    register,
    searchUsers,
    forgotPassword,
    resetPassword,
    hidePost,
    changePassword,
    changeEmail
} from "../controllers/user.controller.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import upload from "../middlewares/multer.js";

const router = express.Router();

router.route('/register').post(register);
router.route('/login').post(login);
router.route('/logout').get(logout);
router.route('/search').get(isAuthenticated, searchUsers);
router.route('/:id/profile').get(isAuthenticated, getProfile);
router.route('/profile/edit').post(isAuthenticated, upload.single('profilePhoto'), editProfile);
router.route('/suggested').get(isAuthenticated, getSuggestedUsers);
router.route('/followorunfollow/:id').post(isAuthenticated, followOrUnfollow);
router.route('/forgot-password').post(forgotPassword);
router.route('/reset-password/:token').post(resetPassword);
router.route('/hide/:id').post(isAuthenticated, hidePost);
router.route('/account/password').post(isAuthenticated, changePassword);
router.route('/account/email').post(isAuthenticated, changeEmail);

export default router;

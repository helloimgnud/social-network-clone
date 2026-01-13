import express from "express";
import { getNotifications, markAsRead, deleteNotifications } from "../controllers/notification.controller.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";

const router = express.Router();

router.route("/").get(isAuthenticated, getNotifications);
router.route("/read").put(isAuthenticated, markAsRead);
router.route("/").delete(isAuthenticated, deleteNotifications);

export default router;

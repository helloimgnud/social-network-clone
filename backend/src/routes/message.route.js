// backend/src/routes/message.route.js
import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { getMessage, sendMessage, getConversations, getMessageRequests, acceptMessageRequest, declineMessageRequest, getBlockedConversations, unblockConversation } from "../controllers/message.controller.js";

import upload from "../middlewares/multer.js";

const router = express.Router();

router.route('/send/:id').post(isAuthenticated, upload.single('image'), sendMessage);
router.route('/all/:id').get(isAuthenticated, getMessage);
router.route('/conversations').get(isAuthenticated, getConversations);
router.route('/requests').get(isAuthenticated, getMessageRequests);
router.route('/requests/:id/accept').post(isAuthenticated, acceptMessageRequest);
router.route('/requests/:id/decline').post(isAuthenticated, declineMessageRequest);
router.route('/blocked').get(isAuthenticated, getBlockedConversations);
router.route('/blocked/:id/unblock').post(isAuthenticated, unblockConversation);

export default router;
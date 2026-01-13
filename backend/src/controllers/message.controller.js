// backend/src/controllers/message.controller.js
import { Conversation } from "../models/conversation.model.js";
import { Message } from "../models/message.model.js";
import { User } from "../models/user.model.js";
import { getReceiverSocketId, io } from "../socket/socket.js";
import getDataUri from "../utils/datauri.js";
import cloudinary from "../utils/cloudinary.js";

export const sendMessage = async (req, res) => {
    try {
        const senderId = req.id;
        const receiverId = req.params.id;
        const { textMessage } = req.body;
        const file = req.file;

        let imageUrl = "";

        if (file) {
            const fileUri = getDataUri(file);
            const cloudResponse = await cloudinary.uploader.upload(fileUri);
            imageUrl = cloudResponse.secure_url;
        }

        // Validate that either text or image is present
        if (!textMessage && !imageUrl) {
            return res.status(400).json({
                message: 'Message content required (text or image)',
                success: false
            });
        }

        // Get sender info for socket events
        const sender = await User.findById(senderId).select('username profilePicture following');
        const receiver = await User.findById(receiverId).select('following');

        if (!sender || !receiver) {
            return res.status(404).json({
                message: 'User not found',
                success: false
            });
        }

        // Check if receiver follows sender (determines if message is a request)
        const receiverFollowsSender = receiver.following?.includes(senderId);

        // Check if there's an existing conversation that was declined
        let conversation = await Conversation.findOne({
            participants: { $all: [senderId, receiverId] }
        });

        // If conversation exists and was declined by the receiver, block the message
        if (conversation && conversation.isDeclined && conversation.declinedBy?.toString() === receiverId) {
            return res.status(403).json({
                success: false,
                isDeclined: true,
                message: 'Người này đã từ chối tin nhắn của bạn'
            });
        }

        const isNewConversation = !conversation;

        // establish the conversation if not started yet
        if (!conversation) {
            conversation = await Conversation.create({
                participants: [senderId, receiverId],
                isRequest: !receiverFollowsSender // Mark as request if receiver doesn't follow sender
            });
        }

        const newMessage = await Message.create({
            senderId,
            receiverId,
            message: textMessage || "",
            image: imageUrl
        });

        if (newMessage) conversation.messages.push(newMessage._id);

        await Promise.all([conversation.save(), newMessage.save()]);

        // implement socket io for real time data transfer
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            // Send the new message
            io.to(receiverSocketId).emit('newMessage', {
                ...newMessage.toObject(),
                senderId: senderId.toString(), // Ensure string for frontend consistency
                senderInfo: {
                    _id: sender._id,
                    username: sender.username,
                    profilePicture: sender.profilePicture
                }
            });

            // If this is a new conversation, notify receiver to update their list
            if (isNewConversation) {
                io.to(receiverSocketId).emit('newConversation', {
                    user: {
                        _id: sender._id,
                        username: sender.username,
                        profilePicture: sender.profilePicture
                    },
                    lastMessage: textMessage || (imageUrl ? "Sent an image" : ""),
                    lastMessageTime: newMessage.createdAt,
                    conversationId: conversation._id,
                    isRequest: !receiverFollowsSender
                });
            }
        }

        return res.status(201).json({
            success: true,
            newMessage
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Internal server error',
            success: false
        });
    }
}

export const getMessage = async (req, res) => {
    try {
        const senderId = req.id;
        const receiverId = req.params.id;

        const conversation = await Conversation.findOne({
            participants: { $all: [senderId, receiverId] }
        }).populate('messages');

        if (!conversation) {
            return res.status(200).json({
                success: true,
                messages: [],
                isDeclined: false,
                declinedBy: null
            });
        }

        return res.status(200).json({
            success: true,
            messages: conversation?.messages,
            isDeclined: conversation.isDeclined || false,
            declinedBy: conversation.declinedBy || null
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Internal server error',
            success: false
        });
    }
}

export const getConversations = async (req, res) => {
    try {
        const userId = req.id;

        // Find all conversations where the user is a participant and NOT a request
        const conversations = await Conversation.find({
            participants: userId,
            isRequest: { $ne: true } // Exclude message requests
        })
            .populate({
                path: 'participants',
                select: 'username profilePicture bio'
            })
            .populate({
                path: 'messages',
                options: { sort: { createdAt: -1 }, limit: 1 }
            })
            .sort({ updatedAt: -1 });

        // Extract the other user from each conversation
        const conversationUsers = conversations.map(conv => {
            const otherUser = conv.participants.find(p => p._id.toString() !== userId);
            const lastMessage = conv.messages[0];
            return {
                user: otherUser,
                lastMessage: lastMessage?.message || '',
                lastMessageTime: lastMessage?.createdAt || conv.updatedAt,
                conversationId: conv._id
            };
        }).filter(c => c.user); // Filter out any null users

        return res.status(200).json({
            success: true,
            conversations: conversationUsers
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Failed to fetch conversations',
            success: false
        });
    }
}

export const getMessageRequests = async (req, res) => {
    try {
        const userId = req.id;

        // Find all conversations where the user is a participant AND is a request
        const requests = await Conversation.find({
            participants: userId,
            isRequest: true
        })
            .populate({
                path: 'participants',
                select: 'username profilePicture bio'
            })
            .populate({
                path: 'messages',
                options: { sort: { createdAt: -1 }, limit: 1 }
            })
            .sort({ updatedAt: -1 });

        // Extract the other user from each conversation (the sender)
        const requestUsers = requests.map(conv => {
            const otherUser = conv.participants.find(p => p._id.toString() !== userId);
            const lastMessage = conv.messages[0];
            return {
                user: otherUser,
                lastMessage: lastMessage?.message || '',
                lastMessageTime: lastMessage?.createdAt || conv.updatedAt,
                conversationId: conv._id
            };
        }).filter(c => c.user);

        return res.status(200).json({
            success: true,
            requests: requestUsers
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Failed to fetch message requests',
            success: false
        });
    }
}

export const acceptMessageRequest = async (req, res) => {
    try {
        const userId = req.id;
        const conversationId = req.params.id;

        const conversation = await Conversation.findById(conversationId);

        if (!conversation) {
            return res.status(404).json({
                message: 'Conversation not found',
                success: false
            });
        }

        // Verify user is a participant
        if (!conversation.participants.includes(userId)) {
            return res.status(403).json({
                message: 'Unauthorized',
                success: false
            });
        }

        // Mark as no longer a request
        conversation.isRequest = false;
        await conversation.save();

        return res.status(200).json({
            success: true,
            message: 'Message request accepted'
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Failed to accept message request',
            success: false
        });
    }
}

export const declineMessageRequest = async (req, res) => {
    try {
        const userId = req.id;
        const conversationId = req.params.id;

        const conversation = await Conversation.findById(conversationId);

        if (!conversation) {
            return res.status(404).json({
                message: 'Conversation not found',
                success: false
            });
        }

        // Verify user is a participant
        if (!conversation.participants.includes(userId)) {
            return res.status(403).json({
                message: 'Unauthorized',
                success: false
            });
        }

        // Mark as declined
        conversation.isDeclined = true;
        conversation.declinedBy = userId;
        conversation.isRequest = false; // No longer a request
        await conversation.save();

        // Find the other participant (the sender who was declined)
        const declinedUserId = conversation.participants.find(
            p => p.toString() !== userId
        );

        // Notify the declined user via socket if they're online
        if (declinedUserId) {
            const declinedUserSocketId = getReceiverSocketId(declinedUserId.toString());
            if (declinedUserSocketId) {
                io.to(declinedUserSocketId).emit('messageRequestDeclined', {
                    conversationId: conversation._id,
                    declinedBy: userId
                });
            }
        }

        return res.status(200).json({
            success: true,
            message: 'Message request declined'
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Failed to decline message request',
            success: false
        });
    }
}

export const getBlockedConversations = async (req, res) => {
    try {
        const userId = req.id;

        // Find all conversations that this user has declined/blocked
        const blockedConversations = await Conversation.find({
            participants: userId,
            isDeclined: true,
            declinedBy: userId // Only show conversations that THIS user declined
        })
            .populate({
                path: 'participants',
                select: 'username profilePicture bio'
            })
            .populate({
                path: 'messages',
                options: { sort: { createdAt: -1 }, limit: 1 }
            })
            .sort({ updatedAt: -1 });

        // Extract the other user from each conversation (the blocked person)
        const blockedUsers = blockedConversations.map(conv => {
            const otherUser = conv.participants.find(p => p._id.toString() !== userId);
            const lastMessage = conv.messages[0];
            return {
                user: otherUser,
                lastMessage: lastMessage?.message || '',
                lastMessageTime: lastMessage?.createdAt || conv.updatedAt,
                conversationId: conv._id
            };
        }).filter(c => c.user);

        return res.status(200).json({
            success: true,
            blocked: blockedUsers
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Failed to fetch blocked conversations',
            success: false
        });
    }
}

export const unblockConversation = async (req, res) => {
    try {
        const userId = req.id;
        const conversationId = req.params.id;

        const conversation = await Conversation.findById(conversationId);

        if (!conversation) {
            return res.status(404).json({
                message: 'Conversation not found',
                success: false
            });
        }

        // Verify user is the one who blocked
        if (conversation.declinedBy?.toString() !== userId) {
            return res.status(403).json({
                message: 'You can only unblock conversations you blocked',
                success: false
            });
        }

        // Remove the block
        conversation.isDeclined = false;
        conversation.declinedBy = null;
        conversation.isRequest = false; // Make it a normal conversation
        await conversation.save();

        // Find the other participant to notify them via socket
        const unblockedUserId = conversation.participants.find(
            p => p.toString() !== userId
        );

        if (unblockedUserId) {
            const unblockedUserSocketId = getReceiverSocketId(unblockedUserId.toString());
            if (unblockedUserSocketId) {
                io.to(unblockedUserSocketId).emit('conversationUnblocked', {
                    conversationId: conversation._id,
                    unblockedBy: userId
                });
            }
        }

        return res.status(200).json({
            success: true,
            message: 'Conversation unblocked successfully'
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Failed to unblock conversation',
            success: false
        });
    }
}
import { Comment } from "../models/comment.model.js";
import { Post } from "../models/post.model.js";
import { User } from "../models/user.model.js";
import { Notification } from "../models/notification.model.js";
import { getReceiverSocketId, io } from "../socket/socket.js";

export const likeComment = async (req, res) => {
    try {
        const commentId = req.params.id;
        const userId = req.id;

        const comment = await Comment.findById(commentId);
        if (!comment) return res.status(404).json({ message: 'Comment not found', success: false });

        await comment.updateOne({ $addToSet: { likes: userId } });
        await comment.save();

        // Notification logic
        const commentOwnerId = comment.author.toString();
        if (commentOwnerId !== userId) {
            const notification = await Notification.create({
                sender: userId,
                recipient: commentOwnerId,
                type: 'like',
                comment: commentId
            });
            const populatedNotification = await notification.populate([
                { path: 'sender', select: 'username profilePicture' }
            ]);
            const receiverSocketId = getReceiverSocketId(commentOwnerId);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('notification', populatedNotification);
            }
        }

        return res.status(200).json({ message: 'Comment liked', success: true });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Internal server error', success: false });
    }
};

export const dislikeComment = async (req, res) => {
    try {
        const commentId = req.params.id;
        const userId = req.id;

        const comment = await Comment.findById(commentId);
        if (!comment) return res.status(404).json({ message: 'Comment not found', success: false });

        await comment.updateOne({ $pull: { likes: userId } });
        await comment.save();

        return res.status(200).json({ message: 'Comment disliked', success: true });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Internal server error', success: false });
    }
};

export const replyToComment = async (req, res) => {
    try {
        const parentCommentId = req.params.id;
        const userId = req.id;
        const { text } = req.body;

        if (!text) return res.status(400).json({ message: 'Text is required', success: false });

        let parentComment = await Comment.findById(parentCommentId);
        if (!parentComment) return res.status(404).json({ message: 'Parent comment not found', success: false });

        // Flatten reply structure: if replying to a reply, use the top-level comment as parent
        // ALSO: Capture the user we are replying to. 
        // If parentComment was a reply (has parentComment), we reply to its author.
        // If parentComment was top-level (no parentComment), we reply to its author.
        // The logic below already possibly reassigned `parentComment` to the top-level one.
        // So we need to be careful. Let's capture the target user BEFORE reassigning parentComment.

        let targetUser = parentComment.author; // Default to author of the comment we clicked "Reply" on

        if (parentComment.parentComment) {
            // We are replying to a nested reply.
            // targetUser is correct (author of that nested reply).
            // But we need to reassign parentComment to the top-level one for the structure.
            parentComment = await Comment.findById(parentComment.parentComment);
        }

        const replyRaw = await Comment.create({
            text,
            author: userId,
            post: parentComment.post,
            parentComment: parentComment._id,
            replyToUser: targetUser
        });

        const reply = await replyRaw.populate([
            {
                path: 'author',
                select: 'username profilePicture'
            },
            {
                path: 'replyToUser',
                select: 'username'
            }
        ]);

        parentComment.replies.push(reply._id);
        await parentComment.save();

        // Also add to post's comments array so it counts towards total comments
        // Note: Logic depends on if Post.comments should include replies. 
        // Usually yes for total count, but getCommentsOfPost should filter top-level.
        const post = await Post.findById(parentComment.post);
        if (post) {
            post.comments.push(reply._id);
            await post.save();

            // Create Notification for post owner
            const postOwnerId = post.author.toString();
            const commentKrneWalaUserKiId = userId; // Renaming for clarity based on the provided snippet
            const postId = post._id; // Renaming for clarity based on the provided snippet

            if (postOwnerId !== commentKrneWalaUserKiId) {
                const notification = await Notification.create({
                    sender: commentKrneWalaUserKiId,
                    recipient: postOwnerId,
                    type: 'comment', // Changed to 'reply' if notifying the original comment author, but keeping 'comment' for post owner as per instruction
                    post: postId,
                    comment: reply._id // This is the reply, not the original comment
                });
                const populatedNotification = await notification.populate([
                    { path: 'sender', select: 'username profilePicture' },
                    { path: 'post', select: 'image' }
                ]);
                const receiverSocketId = getReceiverSocketId(postOwnerId);
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit('notification', populatedNotification);
                }
            }
        }

        return res.status(201).json({
            message: 'Reply added',
            reply,
            success: true
        });

        // Notification for the user being replied to
        const receiverId = targetUser.toString();
        if (receiverId !== userId) {
            const notification = await Notification.create({
                sender: userId,
                recipient: receiverId,
                type: 'comment',
                post: parentComment.post,
                comment: reply._id
            });
            const populatedNotification = await notification.populate([
                { path: 'sender', select: 'username profilePicture' },
                { path: 'post', select: 'image' }
            ]);
            const receiverSocketId = getReceiverSocketId(receiverId);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('notification', populatedNotification);
            }
        }

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Internal server error', success: false });
    }
};

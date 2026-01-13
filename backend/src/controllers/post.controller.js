// backend/src/controllers/post.controller.js
import sharp from "sharp";
import cloudinary from "../utils/cloudinary.js";
import { Post } from "../models/post.model.js";
import { User } from "../models/user.model.js";
import { Comment } from "../models/comment.model.js";
import { Notification } from "../models/notification.model.js";
import { getReceiverSocketId, io } from "../socket/socket.js";

export const addNewPost = async (req, res) => {
    try {
        const { caption } = req.body;
        const media = req.file;
        const authorId = req.id;

        if (!media) {
            return res.status(400).json({
                message: 'Image or video required',
                success: false
            });
        }

        const isVideo = media.mimetype.startsWith('video/');
        let cloudResponse;

        if (isVideo) {
            // Video upload to Cloudinary (no sharp processing)
            const base64Video = media.buffer.toString('base64');
            const dataUri = `data:${media.mimetype};base64,${base64Video}`;

            cloudResponse = await cloudinary.uploader.upload(dataUri, {
                resource_type: 'video',
                folder: 'posts'
            });
        } else {
            // Image upload and optimization
            const optimizedImageBuffer = await sharp(media.buffer)
                .resize({ width: 800, height: 800, fit: 'inside' })
                .toFormat('jpeg', { quality: 80 })
                .toBuffer();

            const fileUri = `data:image/jpeg;base64,${optimizedImageBuffer.toString('base64')}`;
            cloudResponse = await cloudinary.uploader.upload(fileUri, {
                folder: 'posts'
            });
        }

        const post = await Post.create({
            caption,
            image: cloudResponse.secure_url,
            mediaType: isVideo ? 'video' : 'image',
            author: authorId
        });

        const user = await User.findById(authorId);
        if (user) {
            user.posts.push(post._id);
            await user.save();
        }

        await post.populate({ path: 'author', select: '-password' });

        return res.status(201).json({
            message: 'New post added',
            post,
            success: true,
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Failed to create post',
            success: false
        });
    }
}

export const repost = async (req, res) => {
    try {
        const originalPostId = req.params.id;
        const authorId = req.id;

        const originalPost = await Post.findById(originalPostId);
        if (!originalPost) {
            return res.status(404).json({
                message: 'Original post not found',
                success: false
            });
        }

        const newPost = await Post.create({
            caption: originalPost.caption,
            image: originalPost.image,
            mediaType: originalPost.mediaType,
            author: authorId,
            originalPost: originalPostId
        });

        const user = await User.findById(authorId);
        if (user) {
            user.posts.push(newPost._id);
            await user.save();
        }

        await newPost.populate({ path: 'author', select: '-password' });

        return res.status(201).json({
            message: 'Reposted successfully',
            post: newPost,
            success: true
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Failed to repost',
            success: false
        });
    }
}

// backend/src/controllers/post.controller.js

export const getAllPost = async (req, res) => {
    try {
        const userId = req.id; // Logged-in user ID
        const user = await User.findById(userId);
        const hiddenPostIds = user ? user.hiddenPosts : [];

        const posts = await Post.find({
            isArchived: false, // Exclude archived posts
            _id: { $nin: hiddenPostIds } // Exclude hidden posts
        })
            .sort({ createdAt: -1 })
            .populate({ path: 'author', select: 'username profilePicture' })
            .populate({
                path: 'comments',
                options: { sort: { createdAt: -1 } },
                populate: {
                    path: 'author',
                    select: 'username profilePicture'
                }
            });

        return res.status(200).json({
            posts,
            success: true
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Failed to fetch posts',
            success: false
        });
    }
};

export const getUserPost = async (req, res) => {
    try {
        const authorId = req.id;

        const posts = await Post.find({ author: authorId, isArchived: false })
            .sort({ createdAt: -1 })
            .populate({
                path: 'author',
                select: 'username profilePicture'
            })
            .populate({
                path: 'comments',
                options: { sort: { createdAt: -1 } },
                populate: {
                    path: 'author',
                    select: 'username profilePicture'
                }
            });

        return res.status(200).json({
            posts,
            success: true
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Failed to fetch user posts',
            success: false
        });
    }
}

export const likePost = async (req, res) => {
    try {
        const likeKrneWalaUserKiId = req.id;
        const postId = req.params.id;

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({
                message: 'Post not found',
                success: false
            });
        }

        // Like logic
        await post.updateOne({ $addToSet: { likes: likeKrneWalaUserKiId } });
        await post.save();

        // Implement socket.io for real-time notification
        const user = await User.findById(likeKrneWalaUserKiId)
            .select('username profilePicture');

        const postOwnerId = post.author.toString();
        if (postOwnerId !== likeKrneWalaUserKiId) {
            // Create Notification in DB
            const notification = await Notification.create({
                sender: likeKrneWalaUserKiId,
                recipient: postOwnerId,
                type: 'like',
                post: postId
            });

            // Populate for socket
            const populatedNotification = await notification.populate([
                { path: 'sender', select: 'username profilePicture' },
                { path: 'post', select: 'image' }
            ]);

            const postOwnerSocketId = getReceiverSocketId(postOwnerId);
            if (postOwnerSocketId) {
                io.to(postOwnerSocketId).emit('notification', populatedNotification);
            }
        }

        return res.status(200).json({
            message: 'Post liked',
            success: true
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Failed to like post',
            success: false
        });
    }
}

export const archivePost = async (req, res) => {
    try {
        const postId = req.params.id;
        const authorId = req.id;

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({
                message: 'Post not found',
                success: false
            });
        }

        if (post.author.toString() !== authorId) {
            return res.status(403).json({
                message: 'Unauthorized',
                success: false
            });
        }

        // Toggle archive status
        post.isArchived = !post.isArchived;
        await post.save();

        return res.status(200).json({
            message: post.isArchived ? 'Post archived' : 'Post unarchived',
            success: true,
            isArchived: post.isArchived
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Failed to archive post',
            success: false
        });
    }
}

export const getArchivedPosts = async (req, res) => {
    try {
        const authorId = req.id;

        const posts = await Post.find({ author: authorId, isArchived: true })
            .sort({ createdAt: -1 })
            .populate({ path: 'author', select: 'username profilePicture' })
            .populate({
                path: 'comments',
                options: { sort: { createdAt: -1 } },
                populate: {
                    path: 'author',
                    select: 'username profilePicture'
                }
            });

        return res.status(200).json({
            posts,
            success: true
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Failed to fetch archived posts',
            success: false
        });
    }
}

export const dislikePost = async (req, res) => {
    try {
        const likeKrneWalaUserKiId = req.id;
        const postId = req.params.id;

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({
                message: 'Post not found',
                success: false
            });
        }

        // Dislike logic
        await post.updateOne({ $pull: { likes: likeKrneWalaUserKiId } });
        await post.save();

        // Implement socket.io for real-time notification
        const user = await User.findById(likeKrneWalaUserKiId)
            .select('username profilePicture');

        const postOwnerId = post.author.toString();
        if (postOwnerId !== likeKrneWalaUserKiId) {
            // Emit a notification event
            const notification = {
                type: 'dislike',
                userId: likeKrneWalaUserKiId,
                userDetails: user,
                postId,
                message: 'Post was unliked'
            };
            const postOwnerSocketId = getReceiverSocketId(postOwnerId);
            if (postOwnerSocketId) {
                io.to(postOwnerSocketId).emit('notification', notification);
            }
        }

        return res.status(200).json({
            message: 'Post disliked',
            success: true
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Failed to dislike post',
            success: false
        });
    }
}

export const addComment = async (req, res) => {
    try {
        const postId = req.params.id;
        const commentKrneWalaUserKiId = req.id;
        const { text } = req.body;

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({
                message: 'Post not found',
                success: false
            });
        }

        if (!text) {
            return res.status(400).json({
                message: 'Text is required',
                success: false
            });
        }

        const comment = await Comment.create({
            text,
            author: commentKrneWalaUserKiId,
            post: postId
        });

        await comment.populate({
            path: 'author',
            select: 'username profilePicture'
        });

        post.comments.push(comment._id);
        await post.save();

        return res.status(201).json({
            message: 'Comment Added',
            comment,
            success: true
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Failed to add comment',
            success: false
        });
    }
};

export const getCommentsOfPost = async (req, res) => {
    try {
        const postId = req.params.id;

        const comments = await Comment.find({ post: postId, parentComment: null })
            .populate('author', 'username profilePicture')
            .populate({
                path: 'replies',
                populate: [
                    {
                        path: 'author',
                        select: 'username profilePicture'
                    },
                    {
                        path: 'replyToUser',
                        select: 'username'
                    }
                ]
            })
            .sort({ createdAt: -1 });

        if (!comments || comments.length === 0) {
            return res.status(200).json({
                message: 'No comments found for this post',
                success: true,
                comments: []
            });
        }

        return res.status(200).json({
            success: true,
            comments
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Failed to fetch comments',
            success: false
        });
    }
}

export const deletePost = async (req, res) => {
    try {
        const postId = req.params.id;
        const authorId = req.id;

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({
                message: 'Post not found',
                success: false
            });
        }

        // Check if the logged-in user is the owner of the post
        if (post.author.toString() !== authorId) {
            return res.status(403).json({
                message: 'Unauthorized',
                success: false
            });
        }

        // Delete post
        await Post.findByIdAndDelete(postId);

        // Remove the post id from the user's posts
        let user = await User.findById(authorId);
        user.posts = user.posts.filter(id => id.toString() !== postId);
        await user.save();

        // Delete associated comments
        await Comment.deleteMany({ post: postId });

        return res.status(200).json({
            success: true,
            message: 'Post deleted'
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Failed to delete post',
            success: false
        });
    }
}

export const bookmarkPost = async (req, res) => {
    try {
        const postId = req.params.id;
        const authorId = req.id;

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({
                message: 'Post not found',
                success: false
            });
        }

        const user = await User.findById(authorId);

        if (user.bookmarks.includes(post._id)) {
            // Already bookmarked -> remove from bookmark
            await user.updateOne({ $pull: { bookmarks: post._id } });
            await user.save();
            return res.status(200).json({
                type: 'unsaved',
                message: 'Post removed from bookmark',
                success: true
            });
        } else {
            // Bookmark post
            await user.updateOne({ $addToSet: { bookmarks: post._id } });
            await user.save();
            return res.status(200).json({
                type: 'saved',
                message: 'Post bookmarked',
                success: true
            });
        }

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Failed to bookmark post',
            success: false
        });
    }
}

export const getPostById = async (req, res) => {
    try {
        const postId = req.params.id;

        const post = await Post.findById(postId)
            .populate({ path: 'author', select: 'username profilePicture' })
            .populate({
                path: 'comments',
                options: { sort: { createdAt: -1 } },
                populate: {
                    path: 'author',
                    select: 'username profilePicture'
                }
            });

        if (!post) {
            return res.status(404).json({
                message: 'Post not found',
                success: false
            });
        }

        return res.status(200).json({
            post,
            success: true
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Failed to fetch post',
            success: false
        });
    }
}
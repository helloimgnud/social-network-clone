// backend/src/controllers/reel.controller.js
import cloudinary from "../utils/cloudinary.js";
import { Reel } from "../models/reel.model.js";
import { User } from "../models/user.model.js";
import { Comment } from "../models/comment.model.js";
import { getReceiverSocketId, io } from "../socket/socket.js";

// Max duration for reels: 60 seconds
const MAX_REEL_DURATION = 60;

export const createReel = async (req, res) => {
    try {
        const { caption, duration } = req.body;
        const video = req.file;
        const authorId = req.id;

        if (!video) {
            return res.status(400).json({
                message: 'Video required',
                success: false
            });
        }

        // Check video duration limit
        const videoDuration = parseFloat(duration) || 0;
        if (videoDuration > MAX_REEL_DURATION) {
            return res.status(400).json({
                message: `Video duration cannot exceed ${MAX_REEL_DURATION} seconds`,
                success: false
            });
        }

        // Upload video to Cloudinary
        const base64Video = video.buffer.toString('base64');
        const dataUri = `data:${video.mimetype};base64,${base64Video}`;

        const cloudResponse = await cloudinary.uploader.upload(dataUri, {
            resource_type: 'video',
            folder: 'reels'
        });

        const reel = await Reel.create({
            caption,
            video: cloudResponse.secure_url,
            author: authorId,
            duration: videoDuration,
            thumbnail: cloudResponse.secure_url.replace(/\.[^.]+$/, '.jpg') // Generate thumbnail
        });

        await reel.populate({ path: 'author', select: '-password' });

        return res.status(201).json({
            message: 'Reel created successfully',
            reel,
            success: true,
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Failed to create reel',
            success: false
        });
    }
}

export const getAllReels = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const reels = await Reel.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate({ path: 'author', select: 'username profilePicture' })
            .populate({
                path: 'comments',
                options: { sort: { createdAt: -1 }, limit: 3 },
                populate: {
                    path: 'author',
                    select: 'username profilePicture'
                }
            });

        const total = await Reel.countDocuments();

        return res.status(200).json({
            reels,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            },
            success: true
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Failed to fetch reels',
            success: false
        });
    }
};

export const getUserReels = async (req, res) => {
    try {
        const userId = req.params.id;

        const reels = await Reel.find({ author: userId })
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
            reels,
            success: true
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Failed to fetch user reels',
            success: false
        });
    }
}

export const likeReel = async (req, res) => {
    try {
        const userId = req.id;
        const reelId = req.params.id;

        const reel = await Reel.findById(reelId);
        if (!reel) {
            return res.status(404).json({
                message: 'Reel not found',
                success: false
            });
        }

        await reel.updateOne({ $addToSet: { likes: userId } });

        // Real-time notification
        const user = await User.findById(userId).select('username profilePicture');
        const reelOwnerId = reel.author.toString();

        if (reelOwnerId !== userId) {
            const notification = {
                type: 'like',
                userId,
                userDetails: user,
                reelId,
                message: 'Your reel was liked'
            };
            const ownerSocketId = getReceiverSocketId(reelOwnerId);
            if (ownerSocketId) {
                io.to(ownerSocketId).emit('notification', notification);
            }
        }

        return res.status(200).json({
            message: 'Reel liked',
            success: true
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Failed to like reel',
            success: false
        });
    }
}

export const dislikeReel = async (req, res) => {
    try {
        const userId = req.id;
        const reelId = req.params.id;

        const reel = await Reel.findById(reelId);
        if (!reel) {
            return res.status(404).json({
                message: 'Reel not found',
                success: false
            });
        }

        await reel.updateOne({ $pull: { likes: userId } });

        return res.status(200).json({
            message: 'Reel unliked',
            success: true
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Failed to unlike reel',
            success: false
        });
    }
}

export const addReelComment = async (req, res) => {
    try {
        const reelId = req.params.id;
        const userId = req.id;
        const { text } = req.body;

        const reel = await Reel.findById(reelId);
        if (!reel) {
            return res.status(404).json({
                message: 'Reel not found',
                success: false
            });
        }

        if (!text) {
            return res.status(400).json({
                message: 'Comment text is required',
                success: false
            });
        }

        const comment = await Comment.create({
            text,
            author: userId,
            post: reelId // Reusing Comment model
        });

        await comment.populate({
            path: 'author',
            select: 'username profilePicture'
        });

        reel.comments.push(comment._id);
        await reel.save();

        return res.status(201).json({
            message: 'Comment added',
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

export const deleteReel = async (req, res) => {
    try {
        const reelId = req.params.id;
        const authorId = req.id;

        const reel = await Reel.findById(reelId);
        if (!reel) {
            return res.status(404).json({
                message: 'Reel not found',
                success: false
            });
        }

        if (reel.author.toString() !== authorId) {
            return res.status(403).json({
                message: 'Unauthorized',
                success: false
            });
        }

        await Reel.findByIdAndDelete(reelId);
        await Comment.deleteMany({ post: reelId });

        return res.status(200).json({
            success: true,
            message: 'Reel deleted'
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Failed to delete reel',
            success: false
        });
    }
}

export const incrementView = async (req, res) => {
    try {
        const reelId = req.params.id;

        const reel = await Reel.findByIdAndUpdate(
            reelId,
            { $inc: { views: 1 } },
            { new: true }
        );

        if (!reel) {
            return res.status(404).json({
                message: 'Reel not found',
                success: false
            });
        }

        return res.status(200).json({
            views: reel.views,
            success: true
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Failed to update view count',
            success: false
        });
    }
}

export const bookmarkReel = async (req, res) => {
    try {
        const userId = req.id;
        const reelId = req.params.id;

        const reel = await Reel.findById(reelId);
        if (!reel) {
            return res.status(404).json({
                message: 'Reel not found',
                success: false
            });
        }

        const user = await User.findById(userId);

        if (user.bookmarkedReels.includes(reelId)) {
            // Already bookmarked -> remove from bookmark
            await user.updateOne({ $pull: { bookmarkedReels: reelId } });
            return res.status(200).json({
                type: 'unsaved',
                message: 'Reel removed from bookmarks',
                success: true
            });
        } else {
            // Add to bookmark
            await user.updateOne({ $addToSet: { bookmarkedReels: reelId } });
            return res.status(200).json({
                type: 'saved',
                message: 'Reel saved',
                success: true
            });
        }

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Failed to bookmark reel',
            success: false
        });
    }
}

export const getSavedReels = async (req, res) => {
    try {
        const userId = req.id;

        const user = await User.findById(userId).populate({
            path: 'bookmarkedReels',
            populate: {
                path: 'author',
                select: 'username profilePicture'
            }
        });

        if (!user) {
            return res.status(404).json({
                message: 'User not found',
                success: false
            });
        }

        return res.status(200).json({
            reels: user.bookmarkedReels || [],
            success: true
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Failed to fetch saved reels',
            success: false
        });
    }
}

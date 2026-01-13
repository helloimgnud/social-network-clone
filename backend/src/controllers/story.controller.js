// backend/src/controllers/story.controller.js
import sharp from "sharp";
import cloudinary from "../utils/cloudinary.js";
import { Story } from "../models/story.model.js";
import { User } from "../models/user.model.js";

// Max duration for stories: 15 seconds
const MAX_STORY_DURATION = 15;

export const createStory = async (req, res) => {
    try {
        const { duration } = req.body;
        const media = req.file;
        const authorId = req.id;

        if (!media) {
            return res.status(400).json({
                message: 'Media file required',
                success: false
            });
        }

        const isVideo = media.mimetype.startsWith('video/');

        // Check video duration limit
        if (isVideo) {
            const videoDuration = parseFloat(duration) || 0;
            if (videoDuration > MAX_STORY_DURATION) {
                return res.status(400).json({
                    message: `Video duration cannot exceed ${MAX_STORY_DURATION} seconds`,
                    success: false
                });
            }
        }

        let cloudResponse;

        if (isVideo) {
            // Upload video to Cloudinary
            const base64Video = media.buffer.toString('base64');
            const dataUri = `data:${media.mimetype};base64,${base64Video}`;

            cloudResponse = await cloudinary.uploader.upload(dataUri, {
                resource_type: 'video',
                folder: 'stories'
            });
        } else {
            // Optimize and upload image
            const optimizedImageBuffer = await sharp(media.buffer)
                .resize({ width: 1080, height: 1920, fit: 'inside' })
                .toFormat('jpeg', { quality: 80 })
                .toBuffer();

            const fileUri = `data:image/jpeg;base64,${optimizedImageBuffer.toString('base64')}`;
            cloudResponse = await cloudinary.uploader.upload(fileUri, {
                folder: 'stories'
            });
        }

        const story = await Story.create({
            mediaUrl: cloudResponse.secure_url,
            mediaType: isVideo ? 'video' : 'image',
            author: authorId,
            duration: isVideo ? parseFloat(duration) : null,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        });

        await story.populate({ path: 'author', select: '-password' });

        return res.status(201).json({
            message: 'Story created successfully',
            story,
            success: true,
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Failed to create story',
            success: false
        });
    }
}

export const getFollowingStories = async (req, res) => {
    try {
        const userId = req.id;

        // Get current user's following list
        const currentUser = await User.findById(userId);
        const followingIds = [...currentUser.following, userId]; // Include own stories

        // Get stories from followed users that haven't expired
        const stories = await Story.find({
            author: { $in: followingIds },
            expiresAt: { $gt: new Date() }
        })
            .sort({ createdAt: -1 })
            .populate({ path: 'author', select: 'username profilePicture' });

        // Group stories by user
        const groupedStories = stories.reduce((acc, story) => {
            const authorId = story.author._id.toString();
            if (!acc[authorId]) {
                acc[authorId] = {
                    userId: authorId,
                    username: story.author.username,
                    avatar: story.author.profilePicture,
                    stories: [],
                    hasUnseenStories: false
                };
            }
            const hasViewed = story.viewers.some(v => v.toString() === userId);
            if (!hasViewed) {
                acc[authorId].hasUnseenStories = true;
            }
            acc[authorId].stories.push({
                _id: story._id,
                mediaUrl: story.mediaUrl,
                mediaType: story.mediaType,
                duration: story.duration,
                createdAt: story.createdAt,
                seen: hasViewed
            });
            return acc;
        }, {});

        // Convert to array and sort (current user first, then unseen, then seen)
        const storyFeed = Object.values(groupedStories).sort((a, b) => {
            if (a.userId === userId) return -1;
            if (b.userId === userId) return 1;
            if (a.hasUnseenStories && !b.hasUnseenStories) return -1;
            if (!a.hasUnseenStories && b.hasUnseenStories) return 1;
            return 0;
        });

        return res.status(200).json({
            stories: storyFeed,
            success: true
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Failed to fetch stories',
            success: false
        });
    }
};

export const getUserStories = async (req, res) => {
    try {
        const userId = req.params.id;
        const currentUserId = req.id;

        const stories = await Story.find({
            author: userId,
            expiresAt: { $gt: new Date() }
        })
            .sort({ createdAt: -1 })
            .populate({
                path: 'author',
                select: 'username profilePicture'
            });

        const storiesWithSeenStatus = stories.map(story => ({
            ...story.toObject(),
            seen: story.viewers.some(v => v.toString() === currentUserId)
        }));

        return res.status(200).json({
            stories: storiesWithSeenStatus,
            success: true
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Failed to fetch user stories',
            success: false
        });
    }
}

export const getMyStories = async (req, res) => {
    try {
        const userId = req.id;

        const stories = await Story.find({
            author: userId,
            expiresAt: { $gt: new Date() }
        })
            .sort({ createdAt: -1 })
            .populate({
                path: 'author',
                select: 'username profilePicture'
            })
            .populate({
                path: 'viewers',
                select: 'username profilePicture'
            });

        return res.status(200).json({
            stories,
            success: true
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Failed to fetch your stories',
            success: false
        });
    }
}

export const markStoryViewed = async (req, res) => {
    try {
        const storyId = req.params.id;
        const userId = req.id;

        const story = await Story.findById(storyId);
        if (!story) {
            return res.status(404).json({
                message: 'Story not found',
                success: false
            });
        }

        // Add viewer if not already viewed
        await story.updateOne({ $addToSet: { viewers: userId } });

        return res.status(200).json({
            message: 'Story marked as viewed',
            success: true
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Failed to mark story as viewed',
            success: false
        });
    }
}

export const deleteStory = async (req, res) => {
    try {
        const storyId = req.params.id;
        const authorId = req.id;

        const story = await Story.findById(storyId);
        if (!story) {
            return res.status(404).json({
                message: 'Story not found',
                success: false
            });
        }

        if (story.author.toString() !== authorId) {
            return res.status(403).json({
                message: 'Unauthorized',
                success: false
            });
        }

        await Story.findByIdAndDelete(storyId);

        return res.status(200).json({
            success: true,
            message: 'Story deleted'
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Failed to delete story',
            success: false
        });
    }
}

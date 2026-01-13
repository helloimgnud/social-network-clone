import mongoose from "mongoose";

const storySchema = new mongoose.Schema({
    mediaUrl: {
        type: String,
        required: true
    },
    mediaType: {
        type: String,
        enum: ['image', 'video'],
        required: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    viewers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    duration: {
        type: Number, // Duration in seconds (for videos)
        max: 15 // Max 15 seconds for stories
    },
    expiresAt: {
        type: Date,
        required: true,
        default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from creation
    }
}, { timestamps: true });

// Index for automatic expiration (TTL index)
storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Story = mongoose.model('Story', storySchema);

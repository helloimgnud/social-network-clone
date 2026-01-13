import mongoose from "mongoose";

const reelSchema = new mongoose.Schema({
    video: {
        type: String,
        required: true
    },
    caption: {
        type: String,
        default: ''
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment'
    }],
    views: {
        type: Number,
        default: 0
    },
    duration: {
        type: Number, // Duration in seconds
        max: 60 // Max 60 seconds for reels
    },
    thumbnail: {
        type: String,
        default: ''
    }
}, { timestamps: true });

export const Reel = mongoose.model('Reel', reelSchema);

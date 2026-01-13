import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    profilePicture: {
        type: String,
        default: 'https://res.cloudinary.com/dva00tzke/image/upload/v1768276886/user_curjop.png?v=2'
    },
    bio: {
        type: String,
        default: ''
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'Other'],
        default: 'Other'
    },
    followers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    following: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    posts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post'
    }],
    hiddenPosts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post'
    }],
    bookmarks: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post'
    }],
    bookmarkedReels: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Reel'
    }],
    resetPasswordToken: String,
    resetPasswordExpire: Date
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);
import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    messages: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    }],
    isRequest: {
        type: Boolean,
        default: false
    },
    isDeclined: {
        type: Boolean,
        default: false
    },
    declinedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }
}, { timestamps: true });

export const Conversation = mongoose.model('Conversation', conversationSchema);
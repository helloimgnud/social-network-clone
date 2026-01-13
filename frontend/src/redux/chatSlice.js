import { createSlice } from "@reduxjs/toolkit";

const chatSlice = createSlice({
    name: "chat",
    initialState: {
        onlineUsers: [],
        messages: [],
        allConversations: {}, // Store messages by recipientId
        messageRequests: [], // Messages from non-followed users
        unreadCounts: {}, // Track unread message counts by recipientId
        conversationStatus: { isDeclined: false, declinedBy: null }, // Track current conversation status
    },
    reducers: {
        setOnlineUsers: (state, action) => {
            state.onlineUsers = action.payload;
        },
        setMessages: (state, action) => {
            state.messages = action.payload;
        },
        setConversationStatus: (state, action) => {
            state.conversationStatus = action.payload;
        },
        addMessage: (state, action) => {
            const { message, recipientId } = action.payload;
            // Add to current messages if it belongs to current conversation
            state.messages.push(message);

            // Also store in allConversations
            if (!state.allConversations[recipientId]) {
                state.allConversations[recipientId] = [];
            }
            state.allConversations[recipientId].push(message);
        },
        addIncomingMessage: (state, action) => {
            const { message, senderId, selectedUserId } = action.payload;

            // Ensure state properties exist
            if (!state.unreadCounts) state.unreadCounts = {};
            if (!state.allConversations) state.allConversations = {};

            // Only add to current messages if the sender is the selected user
            if (senderId === selectedUserId) {
                state.messages.push(message);
            } else {
                // Increment unread count for this sender
                state.unreadCounts[senderId] = (state.unreadCounts[senderId] || 0) + 1;
            }

            // Store in allConversations by sender
            if (!state.allConversations[senderId]) {
                state.allConversations[senderId] = [];
            }
            state.allConversations[senderId].push(message);
        },
        setMessageRequests: (state, action) => {
            state.messageRequests = action.payload;
        },
        addMessageRequest: (state, action) => {
            if (!state.messageRequests) state.messageRequests = [];
            const exists = state.messageRequests.find(r => r.senderId === action.payload.senderId);
            if (!exists) {
                state.messageRequests.push(action.payload);
            }
        },
        acceptMessageRequest: (state, action) => {
            if (!state.messageRequests) state.messageRequests = [];
            state.messageRequests = state.messageRequests.filter(
                r => r.senderId !== action.payload
            );
        },
        clearUnreadCount: (state, action) => {
            if (!state.unreadCounts) state.unreadCounts = {};
            const recipientId = action.payload;
            if (recipientId) {
                state.unreadCounts[recipientId] = 0;
            }
        },
        clearMessages: (state) => {
            state.messages = [];
            state.conversationStatus = { isDeclined: false, declinedBy: null };
        }
    }
});

export const {
    setOnlineUsers,
    setMessages,
    setConversationStatus,
    addMessage,
    addIncomingMessage,
    setMessageRequests,
    addMessageRequest,
    acceptMessageRequest,
    clearUnreadCount,
    clearMessages
} = chatSlice.actions;

export default chatSlice.reducer;
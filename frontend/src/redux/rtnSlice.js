import { createSlice } from "@reduxjs/toolkit";

const rtnSlice = createSlice({
    name: 'realTimeNotification',
    initialState: {
        notifications: [],
    },
    reducers: {
        setNotifications: (state, action) => {
            state.notifications = action.payload;
        },
        addNotification: (state, action) => {
            if (action.payload.type === 'dislike') {
                // Remove the like notification if it exists (local optimistic update)
                state.notifications = state.notifications.filter((item) =>
                    !(item.type === 'like' && item.sender._id === action.payload.userId && item.post === action.payload.postId)
                );
            } else {
                state.notifications.unshift(action.payload);
            }
        }
    }
});
export const { setNotifications, addNotification } = rtnSlice.actions;
export default rtnSlice.reducer;
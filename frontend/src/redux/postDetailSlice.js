import { createSlice } from "@reduxjs/toolkit";

const postDetailSlice = createSlice({
    name: "postDetail",
    initialState: {
        isOpen: false,
        selectedPost: null,
    },
    reducers: {
        setPostDetailOpen: (state, action) => {
            state.isOpen = action.payload;
            if (!action.payload) {
                state.selectedPost = null;
            }
        },
        setSelectedPost: (state, action) => {
            state.selectedPost = action.payload;
            state.isOpen = true;
        }
    }
});

export const { setPostDetailOpen, setSelectedPost } = postDetailSlice.actions;
export default postDetailSlice.reducer;

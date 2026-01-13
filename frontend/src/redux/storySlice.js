import { createSlice } from "@reduxjs/toolkit";

const storySlice = createSlice({
    name: 'story',
    initialState: {
        stories: [], // Array of user story groups
        currentStoryUser: null,
        currentStoryIndex: 0,
        isViewerOpen: false,
        loading: false
    },
    reducers: {
        setStories: (state, action) => {
            state.stories = action.payload;
        },
        addStory: (state, action) => {
            const { userId, story } = action.payload;
            const userGroup = state.stories.find(s => s.userId === userId);
            if (userGroup) {
                userGroup.stories.unshift(story);
                userGroup.hasUnseenStories = true;
            } else {
                // Create new user group
                state.stories.unshift({
                    userId,
                    username: story.author?.username,
                    avatar: story.author?.profilePicture,
                    stories: [story],
                    hasUnseenStories: true
                });
            }
        },
        markViewed: (state, action) => {
            const { userId, storyId } = action.payload;
            const userGroup = state.stories.find(s => s.userId === userId);
            if (userGroup) {
                const story = userGroup.stories.find(s => s._id === storyId);
                if (story) {
                    story.seen = true;
                }
                // Update hasUnseenStories
                userGroup.hasUnseenStories = userGroup.stories.some(s => !s.seen);
            }
        },
        setCurrentStoryUser: (state, action) => {
            state.currentStoryUser = action.payload;
        },
        setCurrentStoryIndex: (state, action) => {
            state.currentStoryIndex = action.payload;
        },
        setViewerOpen: (state, action) => {
            state.isViewerOpen = action.payload;
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        removeStory: (state, action) => {
            const storyId = action.payload;
            state.stories = state.stories.map(userGroup => ({
                ...userGroup,
                stories: userGroup.stories.filter(s => s._id !== storyId)
            })).filter(userGroup => userGroup.stories.length > 0);
        }
    }
});

export const {
    setStories,
    addStory,
    markViewed,
    setCurrentStoryUser,
    setCurrentStoryIndex,
    setViewerOpen,
    setLoading,
    removeStory
} = storySlice.actions;

export default storySlice.reducer;

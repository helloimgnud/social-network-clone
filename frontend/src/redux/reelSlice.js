import { createSlice } from "@reduxjs/toolkit";

const reelSlice = createSlice({
    name: 'reel',
    initialState: {
        reels: [],
        currentReelIndex: 0,
        loading: false,
        pagination: {
            page: 1,
            limit: 10,
            total: 0,
            pages: 0
        }
    },
    reducers: {
        setReels: (state, action) => {
            state.reels = action.payload;
        },
        addReel: (state, action) => {
            state.reels = [action.payload, ...state.reels];
        },
        addMoreReels: (state, action) => {
            state.reels = [...state.reels, ...action.payload];
        },
        removeReel: (state, action) => {
            state.reels = state.reels.filter(reel => reel._id !== action.payload);
        },
        setCurrentReelIndex: (state, action) => {
            state.currentReelIndex = action.payload;
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        setPagination: (state, action) => {
            state.pagination = action.payload;
        },
        updateReelLikes: (state, action) => {
            const { reelId, likes } = action.payload;
            const reel = state.reels.find(r => r._id === reelId);
            if (reel) {
                reel.likes = likes;
            }
        },
        updateReelComments: (state, action) => {
            const { reelId, comments } = action.payload;
            const reel = state.reels.find(r => r._id === reelId);
            if (reel) {
                reel.comments = comments;
            }
        }
    }
});

export const {
    setReels,
    addReel,
    addMoreReels,
    removeReel,
    setCurrentReelIndex,
    setLoading,
    setPagination,
    updateReelLikes,
    updateReelComments
} = reelSlice.actions;

export default reelSlice.reducer;

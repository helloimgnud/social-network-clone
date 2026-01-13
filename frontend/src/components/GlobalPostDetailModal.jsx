import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PostDetailModal from './PostDetailModal';
import { setPostDetailOpen } from '@/redux/postDetailSlice';

// A wrapper component that connects Redux state to PostDetailModal
const GlobalPostDetailModal = () => {
    const { isOpen, selectedPost } = useSelector(store => store.postDetail);
    const dispatch = useDispatch();

    const handleClose = () => {
        dispatch(setPostDetailOpen(false));
    };

    if (!isOpen || !selectedPost) return null;

    return (
        <PostDetailModal
            post={selectedPost}
            isOpen={isOpen}
            onClose={handleClose}
        />
    );
};

export default GlobalPostDetailModal;

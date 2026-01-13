import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setReels, setLoading, setPagination, updateReelLikes, updateReelComments } from '@/redux/reelSlice';
import axios from 'axios';
import { toast } from 'sonner';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Volume2, VolumeX, Play, Pause, X, Plus } from 'lucide-react';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent } from './ui/dialog';
import { Link } from 'react-router-dom';
import CreateReel from './CreateReel';

const API_URL = import.meta.env.VITE_API_URL;
const DEFAULT_AVATAR = 'https://res.cloudinary.com/dva00tzke/image/upload/v1768276886/user_curjop.png?v=2';

// Comment Overlay Component
const ReelCommentOverlay = ({ isOpen, onClose, reel, onCommentAdded }) => {
    const [text, setText] = useState('');
    const [comments, setComments] = useState(reel?.comments || []);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const { user } = useSelector(store => store.auth);

    useEffect(() => {
        if (isOpen && reel?._id) {
            fetchComments();
        }
    }, [isOpen, reel?._id]);

    const fetchComments = async () => {
        try {
            setLoading(true);
            // Use the comments already attached to the reel or fetch if needed
            setComments(reel?.comments || []);
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitComment = async (e) => {
        e.preventDefault();
        if (!text.trim()) return;

        try {
            setSubmitting(true);
            const res = await axios.post(
                `${API_URL}/api/v1/reel/${reel._id}/comment`,
                { text },
                { withCredentials: true }
            );

            if (res.data.success) {
                const newComment = res.data.comment;
                setComments(prev => [newComment, ...prev]);
                setText('');
                onCommentAdded?.(newComment);
                toast.success('Comment added');
            }
        } catch (error) {
            toast.error('Failed to add comment');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-end justify-center md:items-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/90 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Comment Panel */}
            <div className="relative w-full max-w-lg bg-gray-900 rounded-t-2xl md:rounded-2xl max-h-[70vh] flex flex-col animate-slide-up">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-800">
                    <h3 className="text-white font-semibold text-lg">Comments</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Comments List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[200px]">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                        </div>
                    ) : comments.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500">No comments yet</p>
                            <p className="text-gray-600 text-sm mt-1">Be the first to comment!</p>
                        </div>
                    ) : (
                        comments.map((comment, idx) => (
                            <div key={comment._id || idx} className="flex gap-3">
                                <Link to={`/profile/${comment.author?._id}`}>
                                    <Avatar className="w-9 h-9 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity">
                                        <AvatarImage src={comment.author?.profilePicture || DEFAULT_AVATAR} />
                                        <AvatarFallback className="bg-gray-700 text-white text-xs">
                                            <img src={DEFAULT_AVATAR} alt="def" className="w-full h-full object-cover" />
                                        </AvatarFallback>
                                    </Avatar>
                                </Link>
                                <div className="flex-1">
                                    <p className="text-white text-sm">
                                        <Link
                                            to={`/profile/${comment.author?._id}`}
                                            className="font-semibold mr-2 hover:underline cursor-pointer"
                                        >
                                            {comment.author?.username}
                                        </Link>
                                        {comment.text}
                                    </p>
                                    <p className="text-gray-500 text-xs mt-1">
                                        {new Date(comment.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Comment Input */}
                <form onSubmit={handleSubmitComment} className="p-4 border-t border-gray-800">
                    <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8 flex-shrink-0">
                            <AvatarImage src={user?.profilePicture || DEFAULT_AVATAR} />
                            <AvatarFallback className="bg-gray-700 text-white text-xs">
                                <img src={DEFAULT_AVATAR} alt="def" className="w-full h-full object-cover" />
                            </AvatarFallback>
                        </Avatar>
                        <Input
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Add a comment..."
                            className="flex-1 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus-visible:ring-0"
                        />
                        <Button
                            type="submit"
                            disabled={!text.trim() || submitting}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4"
                        >
                            {submitting ? '...' : 'Post'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ReelCard = ({ reel, isActive, onView, onOpenComments }) => {
    const videoRef = useRef(null);
    const hasViewedRef = useRef(false); // Track if we've already registered a view
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(reel.likes?.length || 0);
    const [commentCount, setCommentCount] = useState(reel.comments?.length || 0);
    const [saved, setSaved] = useState(false);
    const { user } = useSelector(store => store.auth);

    useEffect(() => {
        setLiked(reel.likes?.includes(user?._id) || false);
        // Check if reel is bookmarked
        setSaved(user?.bookmarkedReels?.includes(reel._id) || false);
    }, [reel.likes, user?._id]);

    useEffect(() => {
        if (videoRef.current) {
            if (isActive) {
                videoRef.current.play().catch(() => { });
                setIsPlaying(true);

                // Only register view once per reel when it becomes active
                if (!hasViewedRef.current) {
                    hasViewedRef.current = true;
                    onView?.();
                }
            } else {
                videoRef.current.pause();
                videoRef.current.currentTime = 0;
                setIsPlaying(false);
                // Reset the view tracking when scrolling away
                hasViewedRef.current = false;
            }
        }
    }, [isActive]); // Remove onView from dependencies to prevent multiple calls

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const toggleMute = (e) => {
        e.stopPropagation();
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const handleLike = async (e) => {
        e.stopPropagation();
        try {
            const action = liked ? 'dislike' : 'like';
            const res = await axios.get(`${API_URL}/api/v1/reel/${reel._id}/${action}`, {
                withCredentials: true
            });
            if (res.data.success) {
                const newLikeCount = liked ? likeCount - 1 : likeCount + 1;
                setLikeCount(newLikeCount);
                setLiked(!liked);
            }
        } catch (error) {
            console.log(error);
        }
    };

    const handleCommentClick = (e) => {
        e.stopPropagation();
        onOpenComments?.(reel);
    };

    const handleCommentAdded = () => {
        setCommentCount(prev => prev + 1);
    };

    const handleBookmark = async (e) => {
        e.stopPropagation();
        try {
            const res = await axios.get(`${API_URL}/api/v1/reel/${reel._id}/bookmark`, {
                withCredentials: true
            });
            if (res.data.success) {
                setSaved(res.data.type === 'saved');
                toast.success(res.data.message);
            }
        } catch (error) {
            console.log(error);
            toast.error('Failed to bookmark reel');
        }
    };

    return (
        <div className="reel-card relative h-full w-full flex items-center justify-center bg-black snap-start snap-always">
            <video
                ref={videoRef}
                src={reel.video}
                className="h-full w-full object-contain max-w-[400px]"
                loop
                muted={isMuted}
                playsInline
                onClick={togglePlay}
            />

            {/* Play/Pause overlay */}
            {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-black/30 rounded-full p-4">
                        <Play className="w-12 h-12 text-white" fill="white" />
                    </div>
                </div>
            )}

            {/* Mute button */}
            <button
                onClick={toggleMute}
                className="absolute bottom-24 right-4 bg-black/50 rounded-full p-2 hover:bg-black/70 transition-colors"
            >
                {isMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
            </button>

            {/* Side actions */}
            <div className="absolute right-4 bottom-32 flex flex-col items-center gap-5">
                <div className="flex flex-col items-center">
                    <button onClick={handleLike} className="p-2">
                        {liked ? (
                            <FaHeart className="w-7 h-7 text-red-500" />
                        ) : (
                            <FaRegHeart className="w-7 h-7 text-white" />
                        )}
                    </button>
                    <span className="text-white text-xs font-semibold">{likeCount}</span>
                </div>

                <div className="flex flex-col items-center">
                    <button onClick={handleCommentClick} className="p-2">
                        <MessageCircle className="w-7 h-7 text-white" />
                    </button>
                    <span className="text-white text-xs font-semibold">{commentCount}</span>
                </div>

                <button className="p-2">
                    <Send className="w-7 h-7 text-white" />
                </button>

                <button onClick={handleBookmark} className="p-2">
                    <Bookmark className={`w-7 h-7 ${saved ? 'text-white fill-white' : 'text-white'}`} />
                </button>

                <button className="p-2">
                    <MoreHorizontal className="w-7 h-7 text-white" />
                </button>
            </div>

            {/* Author info and caption */}
            <div className="absolute left-4 bottom-8 right-20 text-white">
                <div className="flex items-center gap-3 mb-2">
                    <Link to={`/profile/${reel.author?._id}`}>
                        <Avatar className="w-10 h-10 border-2 border-white cursor-pointer hover:opacity-80 transition-opacity">
                            <AvatarImage src={reel.author?.profilePicture || DEFAULT_AVATAR} />
                            <AvatarFallback><img src={DEFAULT_AVATAR} alt="def" /></AvatarFallback>
                        </Avatar>
                    </Link>
                    <Link
                        to={`/profile/${reel.author?._id}`}
                        className="font-semibold hover:underline cursor-pointer"
                    >
                        {reel.author?.username}
                    </Link>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-7 bg-blue-500 hover:bg-blue-600 text-white border-blue-500 hover:border-blue-600 font-semibold"
                    >
                        Follow
                    </Button>
                </div>
                {reel.caption && (
                    <p className="text-sm line-clamp-2">{reel.caption}</p>
                )}
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-300">
                    <span>{reel.views || 0} views</span>
                </div>
            </div>
        </div>
    );
};

const Reels = () => {
    const dispatch = useDispatch();
    const { reels, loading } = useSelector(store => store.reel);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [openCreate, setOpenCreate] = useState(false);
    const [commentReel, setCommentReel] = useState(null); // Reel for comment overlay
    const containerRef = useRef(null);
    const viewedReelsRef = useRef(new Set()); // Track which reels have been viewed in this session

    const fetchReels = useCallback(async () => {
        try {
            dispatch(setLoading(true));
            const res = await axios.get(`${API_URL}/api/v1/reel/all`, {
                withCredentials: true
            });
            if (res.data.success) {
                dispatch(setReels(res.data.reels));
                dispatch(setPagination(res.data.pagination));
                // Reset viewed reels when fetching new data
                viewedReelsRef.current.clear();
            }
        } catch (error) {
            console.log(error);
            toast.error('Failed to load reels');
        } finally {
            dispatch(setLoading(false));
        }
    }, [dispatch]);

    useEffect(() => {
        fetchReels();
    }, [fetchReels]);

    const handleView = useCallback(async (reelId) => {
        // Only register view if we haven't viewed this reel in this session
        if (viewedReelsRef.current.has(reelId)) {
            return;
        }

        viewedReelsRef.current.add(reelId);

        try {
            await axios.post(`${API_URL}/api/v1/reel/${reelId}/view`, {}, {
                withCredentials: true
            });
        } catch (error) {
            console.log(error);
        }
    }, []);

    const handleScroll = () => {
        if (containerRef.current) {
            const scrollTop = containerRef.current.scrollTop;
            const itemHeight = containerRef.current.clientHeight;
            const newIndex = Math.round(scrollTop / itemHeight);
            if (newIndex !== currentIndex) {
                setCurrentIndex(newIndex);
            }
        }
    };

    const handleOpenComments = (reel) => {
        setCommentReel(reel);
    };

    const handleCloseComments = () => {
        setCommentReel(null);
    };

    if (loading && reels.length === 0) {
        return (
            <div className="h-screen flex items-center justify-center bg-black">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
            </div>
        );
    }

    return (
        <>
            <div className="reels-container h-screen bg-black overflow-hidden">
                <div
                    ref={containerRef}
                    className="h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
                    onScroll={handleScroll}
                >
                    {reels.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-white">
                            <p className="text-xl mb-4">No reels yet</p>
                            <Button
                                onClick={() => setOpenCreate(true)}
                                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                            >
                                Create First Reel
                            </Button>
                        </div>
                    ) : (
                        reels.map((reel, index) => (
                            <div key={reel._id} className="h-full">
                                <ReelCard
                                    reel={reel}
                                    isActive={index === currentIndex}
                                    onView={() => handleView(reel._id)}
                                    onOpenComments={handleOpenComments}
                                />
                            </div>
                        ))
                    )}
                </div>

                {/* Create Reel FAB */}
                <button
                    onClick={() => setOpenCreate(true)}
                    className="fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 z-10 flex items-center justify-center"
                >
                    <Plus className="w-7 h-7" strokeWidth={2.5} />
                </button>
            </div>

            {/* Comment Overlay */}
            <ReelCommentOverlay
                isOpen={!!commentReel}
                onClose={handleCloseComments}
                reel={commentReel}
                onCommentAdded={() => {
                    // Update comment count in reels list if needed
                }}
            />

            <CreateReel open={openCreate} setOpen={setOpenCreate} onSuccess={fetchReels} />

            <style>{`
                @keyframes slide-up {
                    from {
                        transform: translateY(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
                .animate-slide-up {
                    animation: slide-up 0.3s ease-out;
                }
            `}</style>
        </>
    );
};

export default Reels;

import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent } from './ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { toast } from 'sonner';
import { setPosts } from '@/redux/postSlice';
import { setAuthUser } from '@/redux/authSlice';
import {
    Heart,
    MessageCircle,
    Send,
    Bookmark,
    MoreHorizontal,
    Play,
    Volume2,
    VolumeX,
    Smile,
    Copy,
    Repeat
} from 'lucide-react';
import { FaHeart, FaRegHeart, FaBookmark, FaRegBookmark } from 'react-icons/fa';
import { DialogTrigger } from './ui/dialog';

const API_URL = import.meta.env.VITE_API_URL;
const DEFAULT_AVATAR = 'https://res.cloudinary.com/dva00tzke/image/upload/v1768276886/user_curjop.png?v=2';

const PostDetailModal = ({ post, isOpen, onClose }) => {
    const [text, setText] = useState('');
    const [comments, setComments] = useState([]);
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    const [bookmarked, setBookmarked] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [replyingTo, setReplyingTo] = useState(null); // { id: commentId, username: string }
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const videoRef = useRef(null);
    const inputRef = useRef(null);
    const { user } = useSelector((store) => store.auth);
    const dispatch = useDispatch();

    // Determine if the content is a video (reel or video post)
    const isVideo = post?.video || post?.mediaType === 'video';
    const mediaSource = post?.video || post?.image;

    useEffect(() => {
        if (post) {
            setLiked(post.likes?.includes(user?._id) || false);
            setLikeCount(post.likes?.length || 0);
            setBookmarked(user?.bookmarks?.some(bookmark => (bookmark._id || bookmark).toString() === post?._id.toString()) || false);
            fetchComments();
        }
    }, [post, user]);

    const fetchComments = async () => {
        if (!post) return;
        try {
            const endpoint = post.video
                ? `${API_URL}/api/v1/reel/${post._id}/comment/all` // Assuming reel has similar structure or needs update
                : `${API_URL}/api/v1/post/${post._id}/comment/all`;

            const res = await axios.get(endpoint, { withCredentials: true });
            if (res.data.success) {
                setComments(res.data.comments || []);
            }
        } catch (error) {
            console.error(error);
        }
    };

    // Reset video when modal closes
    useEffect(() => {
        if (!isOpen && videoRef.current) {
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
            setIsPlaying(false);
        }
        if (!isOpen) {
            setReplyingTo(null);
            setText('');
        }
    }, [isOpen]);

    // Auto-play video when modal opens
    useEffect(() => {
        if (isOpen && isVideo && videoRef.current) {
            videoRef.current.play().catch(() => { });
            setIsPlaying(true);
        }
    }, [isOpen, isVideo]);

    const handleLike = async () => {
        if (!post) return;
        try {
            const endpoint = post.video
                ? `${API_URL}/api/v1/reel/${post._id}/${liked ? 'dislike' : 'like'}`
                : `${API_URL}/api/v1/post/${post._id}/${liked ? 'dislike' : 'like'}`;

            const res = await axios.get(endpoint, { withCredentials: true });
            if (res.data.success) {
                const newLikeCount = liked ? likeCount - 1 : likeCount + 1;
                setLikeCount(newLikeCount);
                setLiked(!liked);
                toast.success(res.data.message);
            }
        } catch (error) {
            console.error(error);
            toast.error('Action failed');
        }
    };

    const handleBookmark = async () => {
        if (!post) return;
        try {
            const endpoint = post.video
                ? `${API_URL}/api/v1/reel/${post._id}/bookmark`
                : `${API_URL}/api/v1/post/${post._id}/bookmark`;

            const res = await axios.get(endpoint, { withCredentials: true });
            if (res.data.success) {
                setBookmarked(res.data.type === 'saved');
                toast.success(res.data.message);
            }
        } catch (error) {
            console.error(error);
            toast.error('Bookmark failed');
        }
    };

    const handleRepost = async () => {
        try {
            const res = await axios.post(`${API_URL}/api/v1/post/${post?._id}/repost`, {}, { withCredentials: true });
            if (res.data.success) {
                toast.success(res.data.message);
                // Optionally update redux state if needed (though modal might not reflect main feed instantly unless we force refetch)
            }
        } catch (error) {
            console.log(error);
            toast.error('Failed to repost');
        }
    }

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied');
    }

    const handleArchivePost = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/v1/post/archive/${post?._id}`, { withCredentials: true });
            if (res.data.success) {
                toast.success(res.data.message);
                onClose();
                // We might want to remove it from the list if we were on the feed, but since this is a modal, closing it is fine.
                // However, the main list won't update unless we dispatch something or refetch.
                // Ideally, we should update the redux state.
                dispatch(setPosts(prev => prev.filter(p => p._id !== post._id))); // Assuming we have access to prev state or just dispatch the filtered list from store
                // Actually setPosts expects an array. We can't access store state here easily inside dispatch for setPosts without selector.
                // We can assume the component re-renders or we trigger a refetch.
                // Let's try to reload the window or just let the user see it gone if they refresh.
                // Better:
                window.location.reload();
            }
        } catch (error) {
            console.log(error);
            toast.error(error.response?.data?.message || 'Failed to archive');
        }
    }

    const handleDeletePost = async () => {
        try {
            const res = await axios.delete(`${API_URL}/api/v1/post/delete/${post?._id}`, { withCredentials: true })
            if (res.data.success) {
                toast.success(res.data.message);
                onClose();
                window.location.reload();
            }
        } catch (error) {
            console.log(error);
            toast.error(error.response.data.messsage);
        }
    }

    const handleHidePost = async () => {
        try {
            const res = await axios.post(`${API_URL}/api/v1/user/hide/${post?._id}`, {}, { withCredentials: true });
            if (res.data.success) {
                toast.success(res.data.message);
                onClose();
                window.location.reload();
            }
        } catch (error) {
            console.log(error);
            toast.error(error.response?.data?.message || 'Failed to hide post');
        }
    }

    const handleFollow = async () => {
        try {
            const targetId = post.author?._id;
            const res = await axios.post(`${API_URL}/api/v1/user/followorunfollow/${targetId}`, {}, { withCredentials: true });
            if (res.data.success) {
                toast.success(res.data.message);
                // Update local state by dispatching new user data
                const isCurrentlyFollowing = user?.following?.some(id => (id?._id || id) === targetId);

                const updatedFollowing = isCurrentlyFollowing
                    ? user.following.filter(id => (id?._id || id) !== targetId)
                    : [...user.following, targetId];

                dispatch(setAuthUser({ ...user, following: updatedFollowing }));
            }
        } catch (error) {
            console.log(error);
            toast.error('Failed to follow/unfollow');
        }
    }

    const handleComment = async (e) => {
        e.preventDefault();
        if (!text.trim() || !post) return;

        try {
            setSubmitting(true);

            if (replyingTo) {
                // Handle reply
                const res = await axios.post(
                    `${API_URL}/api/v1/comment/${replyingTo.id}/reply`,
                    { text },
                    {
                        headers: { 'Content-Type': 'application/json' },
                        withCredentials: true,
                    }
                );

                if (res.data.success) {
                    const newReply = res.data.reply;
                    const updatedComments = comments.map(c => {
                        // Use newReply.parentComment to find the top-level parent, 
                        // ensuring it works for both 1st-level and 2nd-level replies.
                        if (c._id === newReply.parentComment) {
                            return { ...c, replies: [...(c.replies || []), newReply] };
                        }
                        return c;
                    });
                    setComments(updatedComments);
                    setText('');
                    setReplyingTo(null);
                    toast.success('Reply posted');
                }
            } else {
                // Handle regular comment
                const endpoint = post.video
                    ? `${API_URL}/api/v1/reel/${post._id}/comment`
                    : `${API_URL}/api/v1/post/${post._id}/comment`;

                const res = await axios.post(
                    endpoint,
                    { text },
                    {
                        headers: { 'Content-Type': 'application/json' },
                        withCredentials: true,
                    }
                );

                if (res.data.success) {
                    const newComment = res.data.comment;
                    setComments([newComment, ...comments]);
                    setText('');
                    toast.success('Comment posted');
                }
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to post comment');
        } finally {
            setSubmitting(false);
        }
    };

    const handleLikeComment = async (commentId, isLiked) => {
        try {
            const action = isLiked ? 'dislike' : 'like';
            const res = await axios.get(`${API_URL}/api/v1/comment/${commentId}/${action}`, { withCredentials: true });
            if (res.data.success) {
                // Update local state without fetching
                const updateCommentsRecursively = (list) => {
                    return list.map(c => {
                        if (c._id === commentId) {
                            const updatedLikes = isLiked
                                ? c.likes.filter(id => id !== user._id)
                                : [...(c.likes || []), user._id];
                            return { ...c, likes: updatedLikes };
                        }
                        if (c.replies?.length > 0) {
                            return { ...c, replies: updateCommentsRecursively(c.replies) };
                        }
                        return c;
                    });
                };
                setComments(updateCommentsRecursively(comments));
            }
        } catch (error) {
            console.error(error);
        }
    };

    const initiateReply = (commentId, username) => {
        setReplyingTo({ id: commentId, username });
        setText(`@${username} `);
        inputRef.current?.focus();
    };

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

    const focusInput = () => {
        inputRef.current?.focus();
    };

    const formatTimeAgo = (date) => {
        if (!date) return '';
        const now = new Date();
        const past = new Date(date);
        const diffInSeconds = Math.floor((now - past) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
        return past.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' });
    };

    const CommentItem = ({ comment, isReply = false }) => {
        const isLiked = comment.likes?.includes(user?._id);

        return (
            <div className={`flex gap-3 group ${isReply ? 'ml-12 mt-2' : ''}`}>
                <Link to={`/profile/${comment.author?._id}`} onClick={onClose} className="flex-shrink-0">
                    <Avatar className={`cursor-pointer hover:opacity-80 transition-opacity ${isReply ? 'w-6 h-6' : 'w-8 h-8'}`}>
                        <AvatarImage src={comment.author?.profilePicture || DEFAULT_AVATAR} />
                        <AvatarFallback className="bg-gray-700 text-white text-xs">
                            <img src={DEFAULT_AVATAR} alt="def" className="w-full h-full object-cover" />
                        </AvatarFallback>
                    </Avatar>
                </Link>
                <div className="flex-1 min-w-0">
                    <p className="text-white text-sm leading-relaxed">
                        <Link
                            to={`/profile/${comment.author?._id}`}
                            className="font-semibold mr-1.5 hover:opacity-80"
                            onClick={onClose}
                        >
                            {comment.author?.username}
                        </Link>
                        {/* Mention rendering logic */}
                        {comment.replyToUser && comment.text.startsWith(`@${comment.replyToUser.username}`) ? (
                            <span className="text-gray-100">
                                <Link
                                    to={`/profile/${comment.replyToUser._id}`}
                                    className="text-blue-500 hover:underline mr-1"
                                    onClick={onClose}
                                >
                                    @{comment.replyToUser.username}
                                </Link>
                                {comment.text.slice(comment.replyToUser.username.length + 1)}
                            </span>
                        ) : (
                            <span className="text-gray-100">{comment.text}</span>
                        )}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-gray-500 text-xs">{formatTimeAgo(comment.createdAt)}</span>

                        {/* Like count if > 0 */}
                        {(comment.likes?.length || 0) > 0 && (
                            <span className="text-gray-500 text-xs font-semibold">
                                {comment.likes.length} like{comment.likes.length > 1 ? 's' : ''}
                            </span>
                        )}

                        <button
                            onClick={() => handleLikeComment(comment._id, isLiked)}
                            className={`text-xs font-semibold hover:text-gray-300 ${isLiked ? 'text-red-500' : 'text-gray-500'}`}
                        >
                            {isLiked ? 'Liked' : 'Like'}
                        </button>
                        <button
                            onClick={() => initiateReply(comment._id, comment.author?.username)}
                            className="text-gray-500 text-xs font-semibold hover:text-gray-300"
                        >
                            Reply
                        </button>
                    </div>
                </div>
                <button
                    onClick={() => handleLikeComment(comment._id, isLiked)}
                    className={`opacity-0 group-hover:opacity-100 transition-opacity hover:text-gray-300 ${isLiked ? 'text-red-500 opacity-100' : 'text-gray-500'}`}
                >
                    {isLiked ? <FaHeart className="w-3 h-3" /> : <Heart className="w-3 h-3" />}
                </button>
            </div>
        );
    };

    if (!post) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[1100px] max-h-[90vh] p-0 bg-[#000] border-gray-800 overflow-hidden rounded-lg fixed z-[100]">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute -top-2 -right-12 z-[110] w-8 h-8 flex items-center justify-center text-white hover:opacity-70 transition-opacity"
                    aria-label="Close"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
                <div className="flex h-[85vh]">
                    {/* Left side - Media */}
                    <div className="flex-1 bg-black flex items-center justify-center relative min-w-0">
                        {isVideo ? (
                            <div className="relative w-full h-full cursor-pointer" onClick={togglePlay}>
                                <video
                                    ref={videoRef}
                                    src={mediaSource}
                                    className="w-full h-full object-contain"
                                    loop
                                    muted={isMuted}
                                    playsInline
                                />
                                {!isPlaying && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className="bg-black/50 rounded-full p-5 backdrop-blur-sm">
                                            <Play className="w-14 h-14 text-white" fill="white" />
                                        </div>
                                    </div>
                                )}
                                <button
                                    onClick={toggleMute}
                                    className="absolute bottom-4 right-4 bg-black/60 rounded-full p-2.5 hover:bg-black/80 transition-colors backdrop-blur-sm"
                                >
                                    {isMuted ? (
                                        <VolumeX className="w-5 h-5 text-white" />
                                    ) : (
                                        <Volume2 className="w-5 h-5 text-white" />
                                    )}
                                </button>
                            </div>
                        ) : (
                            <img
                                src={mediaSource}
                                alt={post.caption || 'Post'}
                                className="w-full h-full object-contain"
                            />
                        )}
                    </div>

                    {/* Right side - Details */}
                    <div className="w-[400px] flex flex-col bg-[#000] border-l border-gray-800">
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                            <div className="flex items-center gap-3">
                                <Link to={`/profile/${post.author?._id}`} onClick={onClose}>
                                    <Avatar className="w-8 h-8 ring-2 ring-pink-500 ring-offset-2 ring-offset-black cursor-pointer">
                                        <AvatarImage src={post.author?.profilePicture || DEFAULT_AVATAR} />
                                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xs font-semibold">
                                            <img src={DEFAULT_AVATAR} alt="def" className="w-full h-full object-cover" />
                                        </AvatarFallback>
                                    </Avatar>
                                </Link>
                                <div className="flex items-center gap-2">
                                    <Link
                                        to={`/profile/${post.author?._id}`}
                                        className="font-semibold text-white text-sm hover:opacity-80 transition-opacity"
                                        onClick={onClose}
                                    >
                                        {post.author?.username}
                                    </Link>
                                    <span className="text-gray-500">•</span>
                                    <span className="text-gray-400 text-sm">{formatTimeAgo(post.createdAt)}</span>
                                </div>
                            </div>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <button className="text-gray-400 hover:text-white transition-colors p-1">
                                        <MoreHorizontal className="w-5 h-5" />
                                    </button>
                                </DialogTrigger>
                                <DialogContent className="flex flex-col items-center text-sm text-center z-[110] bg-[#262626] border-none rounded-xl p-0 overflow-hidden w-64">
                                    {
                                        post?.author?._id === user?._id ? (
                                            <>
                                                <Button onClick={handleDeletePost} variant='ghost' className="cursor-pointer w-full text-[#ED4956] font-bold hover:bg-[#3C3C3C] py-3 h-auto rounded-none border-b border-[#3C3C3C]">Xóa</Button>
                                                <Button onClick={handleArchivePost} variant='ghost' className="cursor-pointer w-full hover:bg-[#3C3C3C] py-3 h-auto rounded-none border-b border-[#3C3C3C] text-white">
                                                    {post?.isArchived ? 'Bỏ lưu trữ' : 'Lưu trữ'}
                                                </Button>
                                            </>
                                        ) : (
                                            <>
                                                <Button onClick={handleHidePost} variant='ghost' className="cursor-pointer w-full text-[#ED4956] font-bold hover:bg-[#3C3C3C] py-3 h-auto rounded-none border-b border-[#3C3C3C]">Ẩn bài viết</Button>
                                                <Button onClick={handleFollow} variant='ghost' className="cursor-pointer w-full text-[#ED4956] font-bold hover:bg-[#3C3C3C] py-3 h-auto rounded-none border-b border-[#3C3C3C]">
                                                    {user?.following?.some(id => (id?._id || id) === post.author?._id) ? 'Bỏ theo dõi' : 'Theo dõi'}
                                                </Button>
                                            </>
                                        )
                                    }
                                    <Button variant='ghost' className="cursor-pointer w-full hover:bg-[#3C3C3C] py-3 h-auto rounded-none border-b border-[#3C3C3C] text-white">Thêm vào mục yêu thích</Button>
                                    <Button variant='ghost' className="cursor-pointer w-full hover:bg-[#3C3C3C] py-3 h-auto rounded-none text-white">Hủy</Button>
                                </DialogContent>
                            </Dialog>
                        </div>

                        {/* Caption */}
                        {post.caption && (
                            <div className="px-4 py-3 border-b border-gray-800">
                                <p className="text-white text-sm leading-relaxed">
                                    <Link
                                        to={`/profile/${post.author?._id}`}
                                        className="font-semibold mr-1.5 hover:opacity-80"
                                        onClick={onClose}
                                    >
                                        {post.author?.username}
                                    </Link>
                                    <span className="text-gray-100 font-normal">{post.caption}</span>
                                </p>
                            </div>
                        )}

                        {/* Comments */}
                        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 scrollbar-hide">
                            {comments.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <h3 className="text-white text-xl font-bold mb-1">No comments yet.</h3>
                                    <p className="text-gray-500 text-sm">Start the conversation.</p>
                                </div>
                            ) : (
                                comments.map((comment, idx) => (
                                    <div key={comment._id || idx}>
                                        <CommentItem comment={comment} />
                                        {/* Replies */}
                                        {comment.replies && comment.replies.length > 0 && (
                                            <div className="flex flex-col gap-2">
                                                {comment.replies.map((reply, rIdx) => (
                                                    <CommentItem key={reply._id || rIdx} comment={reply} isReply={true} />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Actions */}
                        <div className="border-t border-gray-800 px-4 py-3">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={handleLike}
                                        className="hover:opacity-70 transition-all active:scale-90"
                                    >
                                        {liked ? (
                                            <FaHeart className="w-6 h-6 text-red-500 animate-[heartBeat_0.3s_ease-in-out]" />
                                        ) : (
                                            <FaRegHeart className="w-6 h-6 text-white hover:text-gray-300" />
                                        )}
                                    </button>

                                    <button
                                        onClick={focusInput}
                                        className="hover:opacity-70 transition-opacity"
                                    >
                                        <MessageCircle className="w-6 h-6 text-white hover:text-gray-300" />
                                    </button>

                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <button className="hover:opacity-70 transition-opacity">
                                                <Send className="w-6 h-6 text-white hover:text-gray-300" />
                                            </button>
                                        </DialogTrigger>
                                        <DialogContent className="flex flex-col gap-4 text-center items-center py-4 bg-gray-900 border-gray-800 text-white z-[999]">
                                            <div onClick={handleCopyLink} className='cursor-pointer flex items-center gap-2 w-full p-2 hover:bg-gray-800 rounded-md'>
                                                <Copy className="w-5 h-5" />
                                                <span>Share to someone else (Copy Link)</span>
                                            </div>
                                            <div onClick={handleRepost} className='cursor-pointer flex items-center gap-2 w-full p-2 hover:bg-gray-800 rounded-md'>
                                                <Repeat className="w-5 h-5" />
                                                <span>Repost in your profile</span>
                                            </div>
                                        </DialogContent>
                                    </Dialog>

                                </div>
                                <button
                                    onClick={handleBookmark}
                                    className="hover:opacity-70 transition-all active:scale-90"
                                >
                                    {bookmarked ? (
                                        <FaBookmark className="w-6 h-6 text-white" />
                                    ) : (
                                        <FaRegBookmark className="w-6 h-6 text-white hover:text-gray-300" />
                                    )}
                                </button>
                            </div>

                            <p className="text-white font-semibold text-sm">{likeCount.toLocaleString()} likes</p>
                            <p className="text-gray-500 text-[10px] uppercase mt-1 tracking-wide">
                                {new Date(post.createdAt).toLocaleDateString('en-US', {
                                    month: 'long',
                                    day: 'numeric',
                                    year: 'numeric'
                                })}
                            </p>
                        </div>

                        {/* Comment Input */}
                        <form onSubmit={handleComment} className="border-t border-gray-800 px-4 py-3">
                            {replyingTo && (
                                <div className="flex items-center justify-between bg-gray-900 rounded px-2 py-1 mb-2 text-xs text-gray-400">
                                    <span>Replying to {replyingTo.username}</span>
                                    <button type="button" onClick={() => setReplyingTo(null)} className="hover:text-white">✕</button>
                                </div>
                            )}
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    className="text-gray-400 hover:text-white transition-colors"
                                    onClick={() => {/* Emoji picker */ }}
                                >
                                    <Smile className="w-6 h-6" />
                                </button>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    placeholder={replyingTo ? `Reply to ${replyingTo.username}...` : "Add a comment..."}
                                    className="flex-1 bg-transparent text-white placeholder:text-gray-500 outline-none text-sm py-1"
                                />
                                <button
                                    type="submit"
                                    disabled={!text.trim() || submitting}
                                    className={`text-sm font-semibold transition-all ${text.trim() && !submitting
                                        ? 'text-blue-500 hover:text-white cursor-pointer'
                                        : 'text-blue-500/40 cursor-default'
                                        }`}
                                >
                                    {submitting ? '...' : 'Post'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                <style>{`
          @keyframes heartBeat {
            0% { transform: scale(1); }
            25% { transform: scale(1.2); }
            50% { transform: scale(0.95); }
            100% { transform: scale(1); }
          }
          
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `}</style>
            </DialogContent>
        </Dialog >
    );
};

export default PostDetailModal;

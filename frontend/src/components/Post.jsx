import React, { useState, useRef } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Link } from 'react-router-dom'
import { Dialog, DialogContent, DialogTrigger } from './ui/dialog'
import { Bookmark, MessageCircle, MoreHorizontal, Send, Play, Volume2, VolumeX } from 'lucide-react'
import { Button } from './ui/button'
import { FaHeart, FaRegHeart } from "react-icons/fa";
import PostDetailModal from './PostDetailModal'
import { useDispatch, useSelector } from 'react-redux'
import axios from 'axios'
import { toast } from 'sonner'
import { setPosts } from '@/redux/postSlice'
import { Badge } from './ui/badge'
import { setAuthUser } from '@/redux/authSlice'
import { FaBookmark, FaRegBookmark } from "react-icons/fa";
import { Copy, Repeat } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL;
const DEFAULT_AVATAR = 'https://res.cloudinary.com/dva00tzke/image/upload/v1768276886/user_curjop.png?v=2';

const Post = ({ post }) => {
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const { user } = useSelector(store => store.auth);
    const { posts } = useSelector(store => store.post);
    const [liked, setLiked] = useState(post.likes.includes(user?._id) || false);
    const [postLike, setPostLike] = useState(post.likes.length);
    const [isBookmarked, setIsBookmarked] = useState(user?.bookmarks?.some(bookmark => (bookmark._id || bookmark) === post?._id) || false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const videoRef = useRef(null);
    const dispatch = useDispatch();



    const likeOrDislikeHandler = async () => {
        try {
            const action = liked ? 'dislike' : 'like';
            const res = await axios.get(`${API_URL}/api/v1/post/${post._id}/${action}`, { withCredentials: true });
            console.log(res.data);
            if (res.data.success) {
                const updatedLikes = liked ? postLike - 1 : postLike + 1;
                setPostLike(updatedLikes);
                setLiked(!liked);

                const updatedPostData = posts.map(p =>
                    p._id === post._id ? {
                        ...p,
                        likes: liked ? p.likes.filter(id => id !== user._id) : [...p.likes, user._id]
                    } : p
                );
                dispatch(setPosts(updatedPostData));
                toast.success(res.data.message);
            }
        } catch (error) {
            console.log(error);
        }
    }



    const deletePostHandler = async () => {
        try {
            const res = await axios.delete(`${API_URL}/api/v1/post/delete/${post?._id}`, { withCredentials: true })
            if (res.data.success) {
                const updatedPostData = posts.filter((postItem) => postItem?._id !== post?._id);
                dispatch(setPosts(updatedPostData));
                toast.success(res.data.message);
            }
        } catch (error) {
            console.log(error);
            toast.error(error.response.data.messsage);
        }
    }

    const bookmarkHandler = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/v1/post/${post?._id}/bookmark`, { withCredentials: true });
            if (res.data.success) {
                setIsBookmarked(res.data.type === 'saved');
                toast.success(res.data.message);
            }
        } catch (error) {
            console.log(error);
        }
    }

    const repostHandler = async () => {
        try {
            const res = await axios.post(`${API_URL}/api/v1/post/${post?._id}/repost`, {}, { withCredentials: true });
            if (res.data.success) {
                toast.success(res.data.message);
                dispatch(setPosts([res.data.post, ...posts]));
            }
        } catch (error) {
            console.log(error);
            toast.error(error.response?.data?.message || 'Failed to repost');
        }
    }

    const copyLinkHandler = () => {
        const link = `${window.location.origin}/post/${post?._id}`; // Assuming a post route exists or just copying modal link
        // Since we don't have a standalone post page, maybe just copy the text content or a deep link if it existed.
        // For now, let's copy the post ID or a dummy link.
        navigator.clipboard.writeText(window.location.href);

        toast.success('Link copied to clipboard');
    }

    const archivePostHandler = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/v1/post/archive/${post?._id}`, { withCredentials: true });
            if (res.data.success) {
                toast.success(res.data.message);
                // Remove post from feed
                const updatedPostData = posts.filter((postItem) => postItem?._id !== post?._id);
                dispatch(setPosts(updatedPostData));
            }
        } catch (error) {
            console.log(error);
            toast.error(error.response?.data?.message || 'Failed to archive');
        }
    }

    const hidePostHandler = async () => {
        try {
            const res = await axios.post(`${API_URL}/api/v1/user/hide/${post?._id}`, {}, { withCredentials: true });
            if (res.data.success) {
                toast.success(res.data.message);
                // Remove post from feed
                const updatedPostData = posts.filter((postItem) => postItem?._id !== post?._id);
                dispatch(setPosts(updatedPostData));
            }
        } catch (error) {
            console.log(error);
            toast.error(error.response?.data?.message || 'Failed to hide post');
        }
    }

    const followHandler = async () => {
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

    return (
        <div className='my-8 w-full max-w-sm mx-auto'>
            <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                    <Link to={`/profile/${post.author?._id}`}>
                        <Avatar className="cursor-pointer hover:opacity-80 transition-opacity">
                            <AvatarImage src={post.author?.profilePicture || DEFAULT_AVATAR} alt="post_image" />
                            <AvatarFallback><img src={DEFAULT_AVATAR} alt="def" /></AvatarFallback>
                        </Avatar>
                    </Link>
                    <div className='flex items-center gap-3'>
                        <Link to={`/profile/${post.author?._id}`} className="font-semibold hover:opacity-70 transition-opacity">
                            {post.author?.username}
                        </Link>
                        {user?._id === post.author._id && <Badge variant="secondary">Author</Badge>}
                    </div>
                </div>
                <Dialog>
                    <DialogTrigger asChild>
                        <MoreHorizontal className='cursor-pointer' />
                    </DialogTrigger>
                    <DialogContent className="flex flex-col items-center text-sm text-center z-[100] bg-[#262626] border-none rounded-xl p-0 overflow-hidden w-64">
                        {
                            post?.author?._id === user?._id ? (
                                <>
                                    <Button onClick={deletePostHandler} variant='ghost' className="cursor-pointer w-full text-[#ED4956] font-bold hover:bg-[#3C3C3C] py-3 h-auto rounded-none border-b border-[#3C3C3C]">Xóa</Button>
                                    <Button onClick={archivePostHandler} variant='ghost' className="cursor-pointer w-full hover:bg-[#3C3C3C] py-3 h-auto rounded-none border-b border-[#3C3C3C] text-white">
                                        {post?.isArchived ? 'Bỏ lưu trữ' : 'Lưu trữ'}
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button onClick={hidePostHandler} variant='ghost' className="cursor-pointer w-full text-[#ED4956] font-bold hover:bg-[#3C3C3C] py-3 h-auto rounded-none border-b border-[#3C3C3C]">Ẩn bài viết</Button>
                                    <Button onClick={followHandler} variant='ghost' className="cursor-pointer w-full text-[#ED4956] font-bold hover:bg-[#3C3C3C] py-3 h-auto rounded-none border-b border-[#3C3C3C]">
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

            {/* Media - Image or Video */}
            {post.mediaType === 'video' ? (
                <div
                    className='relative my-2 w-full aspect-square bg-black rounded-sm cursor-pointer'
                    onClick={() => {
                        if (videoRef.current) {
                            if (isPlaying) {
                                videoRef.current.pause();
                            } else {
                                videoRef.current.play();
                            }
                            setIsPlaying(!isPlaying);
                        }
                    }}
                >
                    <video
                        ref={videoRef}
                        src={post.image}
                        className='w-full h-full object-cover rounded-sm'
                        loop
                        muted={isMuted}
                        playsInline
                    />
                    {!isPlaying && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="bg-black/40 rounded-full p-3">
                                <Play className="w-8 h-8 text-white" fill="white" />
                            </div>
                        </div>
                    )}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (videoRef.current) {
                                videoRef.current.muted = !isMuted;
                                setIsMuted(!isMuted);
                            }
                        }}
                        className="absolute bottom-3 right-3 bg-black/50 rounded-full p-2 hover:bg-black/70 transition-colors"
                    >
                        {isMuted ? <VolumeX className="w-4 h-4 text-white" /> : <Volume2 className="w-4 h-4 text-white" />}
                    </button>
                </div>
            ) : (
                <img
                    className='rounded-sm my-2 w-full aspect-square object-cover'
                    src={post.image}
                    alt="post_img"
                />
            )}

            <div className='flex items-center justify-between my-2'>
                <div className='flex items-center gap-3'>
                    {
                        liked ? <FaHeart onClick={likeOrDislikeHandler} size={'24'} className='cursor-pointer text-red-600' /> : <FaRegHeart onClick={likeOrDislikeHandler} size={'22px'} className='cursor-pointer hover:text-gray-600' />
                    }

                    <MessageCircle onClick={() => setIsDetailOpen(true)} className='cursor-pointer hover:text-gray-600' />

                    <Dialog>
                        <DialogTrigger asChild>
                            <Send className='cursor-pointer hover:text-gray-600' />
                        </DialogTrigger>
                        <DialogContent className='flex flex-col gap-4 text-center items-center z-[999] bg-gray-900 border-gray-800 text-white'>
                            <div onClick={copyLinkHandler} className='cursor-pointer flex items-center gap-2 w-full p-2 hover:bg-gray-800 rounded-md'>
                                <Copy />
                                <span>Share to someone else (Copy Link)</span>
                            </div>
                            <div onClick={repostHandler} className='cursor-pointer flex items-center gap-2 w-full p-2 hover:bg-gray-800 rounded-md'>
                                <Repeat />
                                <span>Repost in your profile</span>
                            </div>
                        </DialogContent>
                    </Dialog>

                </div>
                {
                    isBookmarked ? (
                        <FaBookmark onClick={bookmarkHandler} size={'24'} className='cursor-pointer text-white' />
                    ) : (
                        <FaRegBookmark onClick={bookmarkHandler} size={'24'} className='cursor-pointer hover:text-gray-600' />
                    )
                }
            </div>
            <span className='font-medium block mb-2'>{postLike} likes</span>
            <p>
                <Link to={`/profile/${post.author?._id}`} className='font-medium mr-2 hover:opacity-70 transition-opacity'>
                    {post.author?.username}
                </Link>
                {post.caption}
            </p>
            {
                post.comments?.length > 0 && (
                    <span onClick={() => setIsDetailOpen(true)} className='cursor-pointer text-sm text-gray-400'>View all {post.comments.length} comments</span>
                )
            }
            <PostDetailModal post={post} isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} />
        </div>
    )
}

export default Post
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { formatDistanceToNow } from 'date-fns';

import { toast } from 'sonner';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { setAuthUser } from '@/redux/authSlice';

const API_URL = import.meta.env.VITE_API_URL;

import { setSelectedPost } from '@/redux/postDetailSlice';

const Notifications = ({ isOpen, onClose }) => {
    const { notifications } = useSelector(store => store.realTimeNotification);
    const { user } = useSelector(store => store.auth);
    const dispatch = useDispatch();

    const handleFollow = async (userId) => {
        try {
            const res = await axios.post(`${API_URL}/api/v1/user/followorunfollow/${userId}`, {}, {
                withCredentials: true
            });
            if (res.data.success) {
                toast.success(res.data.message);
                // Update local user state to reflect following change (optional but good for UI consistency)
                const updatedFollowing = user.following.includes(userId)
                    ? user.following.filter(id => id !== userId)
                    : [...user.following, userId];

                dispatch(setAuthUser({
                    ...user,
                    following: updatedFollowing
                }));
            }
        } catch (error) {
            console.log(error);
            toast.error(error.response?.data?.message || 'Đã có lỗi xảy ra');
        }
    };

    const handlePostClick = async (postId) => {
        try {
            // Fetch validation or full details if needed, but for now we fetch full post to ensure modal has data
            // Since we implemented /get/:id on backend
            const res = await axios.get(`${API_URL}/api/v1/post/get/${postId}`, { withCredentials: true });

            if (res.data.success) {
                dispatch(setSelectedPost(res.data.post));
                onClose(); // Close notification panel
            }
        } catch (error) {
            console.log(error);
            toast.error('Không thể tải bài viết');
        }
    };

    return (
        <div className={`notification-panel ${isOpen ? 'notification-panel-open' : ''}`}>
            <div className="notification-panel-header">
                <h2 className="notification-panel-title">Thông báo</h2>
            </div>

            <div className="notification-list">
                {notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-400 text-sm">Không có thông báo mới.</div>
                ) : (
                    notifications.map((notification) => {
                        const isFollowing = user?.following?.includes(notification.sender._id);

                        return (
                            <div key={notification._id} className="notification-item" onClick={onClose}>
                                {/* Wrap Avatar in Link and stopPropagation if you want clicking avatar to close too, or just let bubble up */}
                                <Link to={`/profile/${notification.sender._id}`} onClick={onClose}>
                                    <Avatar className="notification-avatar">
                                        <AvatarImage src={notification.sender.profilePicture} />
                                        <AvatarFallback>CN</AvatarFallback>
                                    </Avatar>
                                </Link>

                                <div className="notification-info">
                                    <div className="notification-text">
                                        <Link to={`/profile/${notification.sender._id}`} className="font-semibold hover:underline mr-1 text-white" onClick={onClose}>
                                            {notification.sender.username}
                                        </Link>
                                        <span className="text-gray-300">
                                            {notification.type === 'follow' && 'bắt đầu theo dõi bạn.'}
                                            {notification.type === 'like' && 'đã thích bài viết của bạn.'}
                                            {notification.type === 'comment' && 'đã bình luận về bài viết của bạn.'}
                                            {notification.type === 'reply' && 'đã trả lời bình luận của bạn.'}
                                        </span>
                                    </div>
                                    <p className="notification-time">
                                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                    </p>
                                </div>

                                {(notification.type === 'like' || notification.type === 'comment' || notification.type === 'reply') && notification.post && (
                                    <div
                                        className="cursor-pointer"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handlePostClick(notification.post._id || notification.post);
                                        }}
                                    >
                                        <div className="notification-post-preview">
                                            {notification.post.image ? (
                                                <img src={notification.post.image} alt="Post" className="w-full h-full object-cover rounded-md" />
                                            ) : (
                                                <div className="w-full h-full bg-gray-700 rounded-md"></div>
                                            )}
                                        </div>
                                    </div>
                                )}
                                {notification.type === 'follow' && (
                                    <button
                                        className={`text-xs px-4 py-1.5 rounded-md font-semibold transition-colors ${isFollowing
                                            ? "bg-[#363636] text-white hover:bg-[#262626]"
                                            : "bg-[#0095F6] hover:bg-[#1877F2] text-white"
                                            }`}
                                        onClick={(e) => {
                                            e.stopPropagation(); // Prevent closing panel when clicking follow
                                            handleFollow(notification.sender._id);
                                        }}
                                    >
                                        {isFollowing ? "Đang theo dõi" : "Theo dõi lại"}
                                    </button>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default Notifications;

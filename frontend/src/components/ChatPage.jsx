import React, { useEffect, useState, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { setSelectedUser } from '@/redux/authSlice';
import { Info, Search, Image as ImageIcon, Smile, Send, ChevronDown, Edit, X, Check } from 'lucide-react';
import Messages from './Messages';
import axios from 'axios';
import { setMessages, clearUnreadCount, acceptMessageRequest } from '@/redux/chatSlice';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL;

// Instagram-style default avatar (simple gray silhouette)
// Instagram-style default avatar
const DEFAULT_AVATAR = 'https://res.cloudinary.com/dva00tzke/image/upload/v1768276886/user_curjop.png?v=2';

const ChatPage = () => {
    const [textMessage, setTextMessage] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [showDetails, setShowDetails] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [activeTab, setActiveTab] = useState('messages'); // 'messages', 'requests', or 'blocked'
    const [conversations, setConversations] = useState([]);
    const [loadingConversations, setLoadingConversations] = useState(true);
    const [messageRequestsList, setMessageRequestsList] = useState([]);
    const [loadingRequests, setLoadingRequests] = useState(false);
    const [blockedUsersList, setBlockedUsersList] = useState([]);
    const [loadingBlocked, setLoadingBlocked] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const { user, selectedUser } = useSelector(store => store.auth);
    const { onlineUsers, messages, unreadCounts, conversationStatus } = useSelector(store => store.chat);
    const { socket } = useSelector(store => store.socketio);
    const dispatch = useDispatch();
    const inputRef = useRef(null);
    const imageInputRef = useRef(null);

    // Fetch existing conversations on mount
    useEffect(() => {
        fetchConversations();
        fetchMessageRequests();
        fetchBlockedUsers();
    }, []);

    // Listen for real-time new conversations
    useEffect(() => {
        if (!socket) return;

        const handleNewConversation = (newConv) => {
            if (newConv.isRequest) {
                // Add to requests list
                setMessageRequestsList(prev => {
                    const exists = prev.find(r => r.conversationId === newConv.conversationId);
                    if (exists) return prev;
                    return [newConv, ...prev];
                });
            } else {
                // Add to conversations list
                setConversations(prev => {
                    const exists = prev.find(c => c.conversationId === newConv.conversationId);
                    if (exists) return prev;
                    return [newConv, ...prev];
                });
            }
        };

        socket.on('newConversation', handleNewConversation);

        return () => {
            socket.off('newConversation', handleNewConversation);
        };
    }, [socket]);

    // If selectedUser is set (e.g. from Profile page) but not in conversations, add temporarily
    useEffect(() => {
        if (selectedUser && !loadingConversations) {
            // Use functional update to ensure we have the latest conversations state
            setConversations(prev => {
                const exists = prev.find(c => c.user?._id === selectedUser._id);
                if (!exists) {
                    // Add as a temporary conversation entry at the top
                    return [{
                        user: selectedUser,
                        lastMessage: '',
                        lastMessageTime: new Date().toISOString(),
                        conversationId: `temp-${selectedUser._id}`
                    }, ...prev];
                }
                return prev;
            });
        }
    }, [selectedUser, loadingConversations]);

    const fetchConversations = async () => {
        try {
            setLoadingConversations(true);
            const res = await axios.get(`${API_URL}/api/v1/message/conversations`, {
                withCredentials: true
            });
            if (res.data.success) {
                const fetchedConversations = res.data.conversations || [];
                // Preserve selectedUser's temp conversation if not in fetched list
                setConversations(prev => {
                    // Check if selectedUser exists in fetched conversations
                    const selectedUserInFetched = selectedUser &&
                        fetchedConversations.find(c => c.user?._id === selectedUser._id);

                    if (selectedUser && !selectedUserInFetched) {
                        // Keep the temp conversation for selectedUser at the top
                        const tempConv = prev.find(c => c.conversationId?.startsWith('temp-') && c.user?._id === selectedUser._id);
                        if (tempConv) {
                            return [tempConv, ...fetchedConversations];
                        }
                        // If no temp conv exists yet, create one
                        return [{
                            user: selectedUser,
                            lastMessage: '',
                            lastMessageTime: new Date().toISOString(),
                            conversationId: `temp-${selectedUser._id}`
                        }, ...fetchedConversations];
                    }
                    return fetchedConversations;
                });
            }
        } catch (error) {
            console.log('Failed to fetch conversations:', error);
        } finally {
            setLoadingConversations(false);
        }
    };

    const fetchMessageRequests = async () => {
        try {
            setLoadingRequests(true);
            const res = await axios.get(`${API_URL}/api/v1/message/requests`, {
                withCredentials: true
            });
            if (res.data.success) {
                setMessageRequestsList(res.data.requests || []);
            }
        } catch (error) {
            console.log('Failed to fetch message requests:', error);
        } finally {
            setLoadingRequests(false);
        }
    };

    const fetchBlockedUsers = async () => {
        try {
            setLoadingBlocked(true);
            const res = await axios.get(`${API_URL}/api/v1/message/blocked`, {
                withCredentials: true
            });
            if (res.data.success) {
                setBlockedUsersList(res.data.blocked || []);
            }
        } catch (error) {
            console.log('Failed to fetch blocked users:', error);
        } finally {
            setLoadingBlocked(false);
        }
    };

    const handleUnblock = async (blocked) => {
        try {
            await axios.post(`${API_URL}/api/v1/message/blocked/${blocked.conversationId}/unblock`, {}, {
                withCredentials: true
            });
            // Remove from blocked list
            setBlockedUsersList(prev => prev.filter(b => b.conversationId !== blocked.conversationId));
            // Add to conversations list
            setConversations(prev => [{
                user: blocked.user,
                lastMessage: blocked.lastMessage,
                lastMessageTime: blocked.lastMessageTime,
                conversationId: blocked.conversationId
            }, ...prev]);
            toast.success('Đã bỏ chặn người dùng');
        } catch (error) {
            console.log(error);
            toast.error('Không thể bỏ chặn người dùng');
        }
    };

    // Filter and sort conversations
    const filteredConversations = conversations
        .filter(conv => conv.user?.username?.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => {
            const unreadA = unreadCounts?.[a.user?._id] || 0;
            const unreadB = unreadCounts?.[b.user?._id] || 0;
            const onlineA = onlineUsers.includes(a.user?._id);
            const onlineB = onlineUsers.includes(b.user?._id);

            // First priority: users with unread messages
            if (unreadA > 0 && unreadB === 0) return -1;
            if (unreadB > 0 && unreadA === 0) return 1;

            // Second priority: most recent message
            const timeA = new Date(a.lastMessageTime).getTime();
            const timeB = new Date(b.lastMessageTime).getTime();
            if (timeA !== timeB) return timeB - timeA;

            // Third priority: online users
            if (onlineA && !onlineB) return -1;
            if (onlineB && !onlineA) return 1;

            return 0;
        });

    // Clear unread count when selecting a user
    useEffect(() => {
        if (selectedUser?._id) {
            dispatch(clearUnreadCount(selectedUser._id));
        }
    }, [selectedUser?._id, dispatch]);

    const sendMessageHandler = async (receiverId) => {
        if ((!textMessage.trim() && !selectedImage) || isSending) return;

        try {
            setIsSending(true);
            const formData = new FormData();
            formData.append('textMessage', textMessage);
            if (selectedImage) {
                formData.append('image', selectedImage);
            }

            const res = await axios.post(`${API_URL}/api/v1/message/send/${receiverId}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                withCredentials: true
            });
            if (res.data.success) {
                dispatch(setMessages([...messages, res.data.newMessage]));
                setTextMessage("");
                setSelectedImage(null);
                setImagePreview(null);
                // Refresh conversations after sending
                fetchConversations();
            }
        } catch (error) {
            console.log(error);
            // Handle declined conversation
            if (error.response?.data?.isDeclined) {
                toast.error(error.response.data.message || 'Người này đã từ chối tin nhắn của bạn');
            } else {
                toast.error('Failed to send message');
            }
        } finally {
            setIsSending(false);
        }
    }

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessageHandler(selectedUser?._id);
        }
    };

    const handleImageSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Image size must be less than 5MB');
                return;
            }
            setSelectedImage(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const removeImage = () => {
        setSelectedImage(null);
        setImagePreview(null);
        if (imageInputRef.current) {
            imageInputRef.current.value = '';
        }
    };

    const handleAcceptRequest = async (request) => {
        try {
            // Accept the message request on the server
            await axios.post(`${API_URL}/api/v1/message/requests/${request.conversationId}/accept`, {}, {
                withCredentials: true
            });
            // Move from requests to conversations
            setMessageRequestsList(prev => prev.filter(r => r.conversationId !== request.conversationId));
            setConversations(prev => [request, ...prev]);
            toast.success('Message request accepted');
        } catch (error) {
            console.log(error);
            toast.error('Failed to accept request');
        }
    };

    const handleDeclineRequest = async (request) => {
        try {
            // Call backend to persist the decline
            await axios.post(`${API_URL}/api/v1/message/requests/${request.conversationId}/decline`, {}, {
                withCredentials: true
            });
            // Remove from local state
            setMessageRequestsList(prev => prev.filter(r => r.conversationId !== request.conversationId));
            toast.success('Đã từ chối yêu cầu nhắn tin');
        } catch (error) {
            console.log(error);
            toast.error('Không thể từ chối yêu cầu');
        }
    };

    // Note: Removed cleanup effect that was clearing selectedUser on unmount
    // This was causing issues with React 18 StrictMode double-mounting
    // and preventing navigation from Profile to open the correct conversation

    const totalRequests = messageRequestsList?.length || 0;

    return (
        <div className='chat-page-container'>
            {/* Left Sidebar - Conversations List */}
            <section className='chat-sidebar'>
                {/* Header */}
                <div className='flex items-center justify-between px-5 py-4 border-b border-gray-800'>
                    <div className='flex items-center gap-2'>
                        <h1 className='font-bold text-xl text-white'>{user?.username}</h1>
                        <ChevronDown className='w-4 h-4 text-white' />
                    </div>
                    <button className='text-white hover:opacity-70 transition-opacity'>
                        <Edit className='w-6 h-6' />
                    </button>
                </div>

                {/* Search */}
                <div className='px-4 py-3'>
                    <div className='relative'>
                        <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500' />
                        <input
                            type='text'
                            placeholder='Search'
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className='w-full bg-gray-900 text-white placeholder:text-gray-500 rounded-lg pl-10 pr-4 py-2 text-sm outline-none focus:ring-1 focus:ring-gray-700'
                        />
                    </div>
                </div>

                {/* Messages, Requests & Blocked tabs */}
                <div className='flex px-2 sm:px-4 mb-2'>
                    <button
                        onClick={() => setActiveTab('messages')}
                        className={`flex-1 py-2 text-xs sm:text-sm font-semibold transition-colors ${activeTab === 'messages'
                            ? 'text-white border-b-2 border-white'
                            : 'text-gray-500 hover:text-gray-300 border-b-2 border-transparent'
                            }`}
                    >
                        Tin nhắn
                    </button>
                    <button
                        onClick={() => setActiveTab('requests')}
                        className={`flex-1 py-2 text-xs sm:text-sm font-semibold transition-colors relative ${activeTab === 'requests'
                            ? 'text-white border-b-2 border-white'
                            : 'text-gray-500 hover:text-gray-300 border-b-2 border-transparent'
                            }`}
                    >
                        Yêu cầu
                        {totalRequests > 0 && (
                            <span className='absolute -top-1 right-1 sm:right-4 bg-red-500 text-white text-[10px] sm:text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center'>
                                {totalRequests}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('blocked')}
                        className={`flex-1 py-2 text-xs sm:text-sm font-semibold transition-colors relative ${activeTab === 'blocked'
                            ? 'text-white border-b-2 border-white'
                            : 'text-gray-500 hover:text-gray-300 border-b-2 border-transparent'
                            }`}
                    >
                        Đã chặn
                        {blockedUsersList.length > 0 && (
                            <span className='absolute -top-1 right-1 sm:right-4 bg-gray-600 text-white text-[10px] sm:text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center'>
                                {blockedUsersList.length}
                            </span>
                        )}
                    </button>
                </div>

                {/* Content based on active tab */}
                <div className='flex-1 overflow-y-auto'>
                    {activeTab === 'messages' ? (
                        // Messages List
                        loadingConversations ? (
                            <div className='flex flex-col items-center justify-center py-12 text-gray-500'>
                                <p className='text-sm'>Loading conversations...</p>
                            </div>
                        ) : filteredConversations.length === 0 ? (
                            <div className='flex flex-col items-center justify-center py-12 text-gray-500'>
                                <p className='text-sm'>No conversations yet</p>
                                <p className='text-xs mt-1'>Search for users to start a conversation</p>
                            </div>
                        ) : (
                            filteredConversations.map((conv) => {
                                const chatUser = conv.user;
                                const isOnline = onlineUsers.includes(chatUser?._id);
                                const isSelected = selectedUser?._id === chatUser?._id;
                                const unreadCount = unreadCounts?.[chatUser?._id] || 0;
                                return (
                                    <div
                                        key={conv.conversationId}
                                        onClick={() => dispatch(setSelectedUser(chatUser))}
                                        className={`flex gap-3 items-center px-5 py-3 cursor-pointer transition-colors ${isSelected ? 'bg-gray-800/50' : 'hover:bg-gray-900'
                                            }`}
                                    >
                                        <div className='relative'>
                                            <Avatar className='w-14 h-14 ring-2 ring-offset-2 ring-offset-black ring-transparent'>
                                                <AvatarImage src={chatUser?.profilePicture || DEFAULT_AVATAR} />
                                                <AvatarFallback className='bg-gray-800'>
                                                    <img src={DEFAULT_AVATAR} alt='' className='w-full h-full' />
                                                </AvatarFallback>
                                            </Avatar>
                                            {isOnline && (
                                                <div className='absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-3 border-black' />
                                            )}
                                        </div>
                                        <div className='flex-1 min-w-0'>
                                            <span className={`font-medium block truncate ${unreadCount > 0 ? 'text-white font-bold' : 'text-white'}`}>
                                                {chatUser?.username}
                                            </span>
                                            <span className={`text-sm truncate block ${unreadCount > 0 ? 'text-gray-300 font-medium' : 'text-gray-500'}`}>
                                                {conv.lastMessage || (isOnline ? 'Active now' : 'Tap to message')}
                                            </span>
                                        </div>
                                        {unreadCount > 0 && (
                                            <div className='w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center'>
                                                <span className='text-xs text-white font-bold'>{unreadCount}</span>
                                            </div>
                                        )}
                                    </div>
                                )
                            })
                        )
                    ) : activeTab === 'requests' ? (
                        // Requests List
                        messageRequestsList.length === 0 ? (
                            <div className='flex flex-col items-center justify-center py-12 text-gray-500'>
                                <p className='text-xs sm:text-sm'>Không có yêu cầu nhắn tin</p>
                                <p className='text-[10px] sm:text-xs mt-1 text-center px-4'>Tin nhắn từ những người bạn không theo dõi sẽ xuất hiện ở đây</p>
                            </div>
                        ) : (
                            messageRequestsList.map((request) => (
                                <div
                                    key={request.conversationId}
                                    className='flex gap-2 sm:gap-3 items-center px-3 sm:px-5 py-3 hover:bg-gray-900 transition-colors'
                                >
                                    <Avatar className='w-10 h-10 sm:w-14 sm:h-14'>
                                        <AvatarImage src={request.user?.profilePicture || DEFAULT_AVATAR} />
                                        <AvatarFallback className='bg-gray-800'>
                                            <img src={DEFAULT_AVATAR} alt='' className='w-full h-full' />
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className='flex-1 min-w-0'>
                                        <span className='font-medium text-white block truncate text-sm'>
                                            {request.user?.username || 'Unknown User'}
                                        </span>
                                        <span className='text-xs sm:text-sm text-gray-500 truncate block'>
                                            {request.lastMessage || 'Muốn gửi tin nhắn cho bạn'}
                                        </span>
                                    </div>
                                    <div className='flex gap-1 sm:gap-2'>
                                        <button
                                            onClick={() => handleAcceptRequest(request)}
                                            className='w-7 h-7 sm:w-8 sm:h-8 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center transition-colors'
                                        >
                                            <Check className='w-3 h-3 sm:w-4 sm:h-4 text-white' />
                                        </button>
                                        <button
                                            onClick={() => handleDeclineRequest(request)}
                                            className='w-7 h-7 sm:w-8 sm:h-8 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center transition-colors'
                                        >
                                            <X className='w-3 h-3 sm:w-4 sm:h-4 text-white' />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )
                    ) : (
                        // Blocked List
                        loadingBlocked ? (
                            <div className='flex flex-col items-center justify-center py-12 text-gray-500'>
                                <p className='text-xs sm:text-sm'>Đang tải...</p>
                            </div>
                        ) : blockedUsersList.length === 0 ? (
                            <div className='flex flex-col items-center justify-center py-12 text-gray-500'>
                                <p className='text-xs sm:text-sm'>Không có người dùng bị chặn</p>
                                <p className='text-[10px] sm:text-xs mt-1 text-center px-4'>Khi bạn từ chối yêu cầu nhắn tin, họ sẽ xuất hiện ở đây</p>
                            </div>
                        ) : (
                            blockedUsersList.map((blocked) => (
                                <div
                                    key={blocked.conversationId}
                                    className='flex gap-2 sm:gap-3 items-center px-3 sm:px-5 py-3 hover:bg-gray-900 transition-colors'
                                >
                                    <Avatar className='w-10 h-10 sm:w-14 sm:h-14 opacity-60'>
                                        <AvatarImage src={blocked.user?.profilePicture || DEFAULT_AVATAR} />
                                        <AvatarFallback className='bg-gray-800'>
                                            <img src={DEFAULT_AVATAR} alt='' className='w-full h-full' />
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className='flex-1 min-w-0'>
                                        <span className='font-medium text-gray-400 block truncate text-sm'>
                                            {blocked.user?.username || 'Unknown User'}
                                        </span>
                                        <span className='text-xs sm:text-sm text-gray-600 truncate block'>
                                            Đã chặn
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => handleUnblock(blocked)}
                                        className='px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-700 hover:bg-gray-600 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors'
                                    >
                                        Bỏ chặn
                                    </button>
                                </div>
                            ))
                        )
                    )}
                </div>
            </section>

            {/* Right Panel - Chat View */}
            {selectedUser ? (
                <section className='chat-main'>
                    {/* Chat Header */}
                    <div className='flex items-center justify-between px-5 py-3 border-b border-gray-800'>
                        <Link to={`/profile/${selectedUser?._id}`} className='flex gap-3 items-center hover:opacity-80 transition-opacity'>
                            <div className='relative'>
                                <Avatar className='w-11 h-11'>
                                    <AvatarImage src={selectedUser?.profilePicture || DEFAULT_AVATAR} alt='profile' />
                                    <AvatarFallback className='bg-gray-800'>
                                        <img src={DEFAULT_AVATAR} alt='' className='w-full h-full' />
                                    </AvatarFallback>
                                </Avatar>
                                {onlineUsers.includes(selectedUser?._id) && (
                                    <div className='absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-black' />
                                )}
                            </div>
                            <div className='flex flex-col'>
                                <span className='font-semibold text-white'>{selectedUser?.username}</span>
                                <span className='text-xs text-gray-500'>
                                    {onlineUsers.includes(selectedUser?._id) ? 'Active now' : 'Instagram'}
                                </span>
                            </div>
                        </Link>
                        <button
                            onClick={() => setShowDetails(!showDetails)}
                            className={`text-white hover:opacity-70 transition-opacity ${showDetails ? 'text-blue-500' : ''}`}
                        >
                            <Info className='w-6 h-6' />
                        </button>
                    </div>

                    <div className='flex flex-1 overflow-hidden'>
                        {/* Messages */}
                        <div className='flex-1 flex flex-col'>
                            <Messages selectedUser={selectedUser} />

                            {/* Image Preview */}
                            {imagePreview && (
                                <div className='px-5 py-2 border-t border-gray-800'>
                                    <div className='relative inline-block'>
                                        <img
                                            src={imagePreview}
                                            alt='Preview'
                                            className='h-20 w-20 object-cover rounded-lg'
                                        />
                                        <button
                                            onClick={removeImage}
                                            className='absolute -top-2 -right-2 bg-gray-800 rounded-full p-1 hover:bg-gray-700'
                                        >
                                            <X className='w-4 h-4 text-white' />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Message Input */}
                            <div className='px-3 sm:px-5 py-3 sm:py-4 border-t border-gray-800'>
                                {conversationStatus?.isDeclined && conversationStatus?.declinedBy === selectedUser?._id ? (
                                    // Show disabled input when declined
                                    <div className='flex items-center justify-center gap-2 bg-gray-900/50 rounded-full px-4 py-3 border border-gray-700/50'>
                                        <p className='text-gray-500 text-xs sm:text-sm text-center'>
                                            Bạn không thể gửi tin nhắn cho người dùng này
                                        </p>
                                    </div>
                                ) : (
                                    // Normal input
                                    <div className='flex items-center gap-2 sm:gap-3 bg-gray-900 rounded-full px-3 sm:px-4 py-2 border border-gray-700'>
                                        <button className='text-white hover:opacity-70 transition-opacity hidden sm:block'>
                                            <Smile className='w-5 h-5 sm:w-6 sm:h-6' />
                                        </button>

                                        <input
                                            ref={imageInputRef}
                                            type='file'
                                            accept='image/*'
                                            onChange={handleImageSelect}
                                            className='hidden'
                                        />
                                        <button
                                            onClick={() => imageInputRef.current?.click()}
                                            className='text-white hover:opacity-70 transition-opacity'
                                        >
                                            <ImageIcon className='w-5 h-5 sm:w-6 sm:h-6' />
                                        </button>

                                        <input
                                            ref={inputRef}
                                            value={textMessage}
                                            onChange={(e) => setTextMessage(e.target.value)}
                                            onKeyPress={handleKeyPress}
                                            type='text'
                                            className='flex-1 bg-transparent text-white placeholder:text-gray-500 outline-none text-sm'
                                            placeholder='Nhắn tin...'
                                        />
                                        {textMessage.trim() || selectedImage ? (
                                            <button
                                                onClick={() => sendMessageHandler(selectedUser?._id)}
                                                className='text-blue-500 font-semibold text-xs sm:text-sm hover:text-white transition-colors'
                                            >
                                                Gửi
                                            </button>
                                        ) : null}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Details Panel */}
                        {showDetails && (
                            <div className='w-[300px] border-l border-gray-800 flex flex-col overflow-y-auto'>
                                <div className='p-5'>
                                    <h3 className='text-white font-semibold mb-4'>Details</h3>

                                    {/* User Info */}
                                    <div className='flex flex-col items-center py-6 border-b border-gray-800'>
                                        <Avatar className='w-20 h-20 mb-3'>
                                            <AvatarImage src={selectedUser?.profilePicture || DEFAULT_AVATAR} />
                                            <AvatarFallback className='bg-gray-800'>
                                                <img src={DEFAULT_AVATAR} alt='' className='w-full h-full' />
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className='text-white font-semibold'>{selectedUser?.username}</span>
                                        <span className='text-gray-500 text-sm'>{selectedUser?.bio || 'Instagram User'}</span>
                                        <Link
                                            to={`/profile/${selectedUser?._id}`}
                                            className='mt-3 text-blue-500 text-sm font-semibold hover:text-blue-400'
                                        >
                                            View profile
                                        </Link>
                                    </div>

                                    {/* Actions */}
                                    <div className='py-4 space-y-3'>
                                        <button className='w-full text-left text-white hover:bg-gray-800 py-2 px-3 rounded-lg transition-colors'>
                                            Mute messages
                                        </button>
                                        <button className='w-full text-left text-white hover:bg-gray-800 py-2 px-3 rounded-lg transition-colors'>
                                            Restrict
                                        </button>
                                        <button className='w-full text-left text-red-500 hover:bg-gray-800 py-2 px-3 rounded-lg transition-colors'>
                                            Block
                                        </button>
                                        <button className='w-full text-left text-red-500 hover:bg-gray-800 py-2 px-3 rounded-lg transition-colors'>
                                            Report
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            ) : (
                /* No Chat Selected */
                <div className='chat-main flex flex-col items-center justify-center'>
                    <div className='w-24 h-24 rounded-full border-2 border-white flex items-center justify-center mb-4'>
                        <Send className='w-12 h-12 text-white' />
                    </div>
                    <h2 className='text-xl font-medium text-white mb-1'>Your messages</h2>
                    <p className='text-gray-500 text-sm mb-4'>Send a message to start a chat.</p>
                    <button className='bg-blue-500 hover:bg-blue-600 text-white font-semibold text-sm px-4 py-2 rounded-lg transition-colors'>
                        Send message
                    </button>
                </div>
            )}

            <style>{`
                .chat-page-container {
                    display: flex;
                    height: 100vh;
                    width: 100%;
                    background-color: #000;
                }

                .chat-sidebar {
                    width: 350px;
                    min-width: 350px;
                    border-right: 1px solid rgb(38, 38, 38);
                    display: flex;
                    flex-direction: column;
                    background-color: #000;
                }

                .chat-main {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    background-color: #000;
                    min-width: 0;
                }

                @media (max-width: 900px) {
                    .chat-sidebar {
                        width: 280px;
                        min-width: 280px;
                    }
                }
            `}</style>
        </div>
    )
}

export default ChatPage
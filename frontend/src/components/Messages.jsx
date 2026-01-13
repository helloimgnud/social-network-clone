import React, { useRef, useEffect } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Button } from './ui/button'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import useGetAllMessage from '@/hooks/useGetAllMessage'
import useGetRTM from '@/hooks/useGetRTM'
import { Ban, X } from 'lucide-react'
import { useState } from 'react'

const Messages = ({ selectedUser }) => {
    useGetRTM();
    useGetAllMessage();
    const { messages, conversationStatus } = useSelector(store => store.chat);
    const { user } = useSelector(store => store.auth);
    const messagesEndRef = useRef(null);
    const [overlayImage, setOverlayImage] = useState(null);

    // Check if current user was declined (the other person declined us)
    const isDeclinedByOther = conversationStatus?.isDeclined &&
        conversationStatus?.declinedBy === selectedUser?._id;

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const formatTime = (date) => {
        if (!date) return '';
        return new Date(date).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    return (
        <div className='flex-1 overflow-y-auto px-3 sm:px-5 py-4 scrollbar-hide'>
            {/* Profile Header */}
            <div className='flex flex-col items-center justify-center py-6 sm:py-8 mb-4 sm:mb-6'>
                <Avatar className="h-20 w-20 sm:h-24 sm:w-24 ring-2 ring-offset-4 ring-offset-black ring-gray-700 mb-4">
                    <AvatarImage src={selectedUser?.profilePicture} alt='profile' />
                    <AvatarFallback className='bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xl sm:text-2xl'>
                        {selectedUser?.username?.[0]?.toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <h3 className='text-white font-semibold text-base sm:text-lg'>{selectedUser?.username}</h3>
                <p className='text-gray-500 text-xs sm:text-sm mb-3'>Instagram</p>
                <Link to={`/profile/${selectedUser?._id}`}>
                    <Button
                        variant="secondary"
                        className="h-8 sm:h-9 px-3 sm:px-4 bg-gray-800 hover:bg-gray-700 text-white text-xs sm:text-sm font-semibold border-0"
                    >
                        Xem trang cá nhân
                    </Button>
                </Link>
            </div>

            {/* Declined Banner */}
            {isDeclinedByOther && (
                <div className='flex items-center justify-center gap-2 sm:gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 mx-auto max-w-md'>
                    <Ban className='w-4 h-4 sm:w-5 sm:h-5 text-red-400 flex-shrink-0' />
                    <p className='text-red-400 text-xs sm:text-sm font-medium text-center'>
                        Người này đã từ chối tin nhắn của bạn
                    </p>
                </div>
            )}

            {/* Messages */}
            <div className='flex flex-col gap-1'>
                {messages && messages.map((msg, index) => {
                    const isSender = msg.senderId === user?._id;
                    const showAvatar = !isSender && (
                        index === 0 ||
                        messages[index - 1]?.senderId === user?._id
                    );
                    const isLastInGroup = (
                        index === messages.length - 1 ||
                        messages[index + 1]?.senderId !== msg.senderId
                    );

                    return (
                        <div
                            key={msg._id}
                            className={`flex items-end gap-1 sm:gap-2 ${isSender ? 'justify-end' : 'justify-start'}`}
                        >
                            {/* Avatar for received messages */}
                            {!isSender && (
                                <div className='w-6 sm:w-7 flex-shrink-0'>
                                    {showAvatar && (
                                        <Avatar className='w-6 h-6 sm:w-7 sm:h-7'>
                                            <AvatarImage src={selectedUser?.profilePicture} />
                                            <AvatarFallback className='bg-gray-700 text-white text-[10px] sm:text-xs'>
                                                {selectedUser?.username?.[0]?.toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                    )}
                                </div>
                            )}

                            {/* Message Bubble */}
                            <div className='group flex items-center gap-1 sm:gap-2 max-w-[75%] sm:max-w-[65%]'>
                                {isSender && (
                                    <span className='text-[9px] sm:text-[10px] text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block'>
                                        {formatTime(msg.createdAt)}
                                    </span>
                                )}
                                <div className="flex flex-col">
                                    {msg.image && (
                                        <div
                                            onClick={() => setOverlayImage(msg.image)}
                                            className="cursor-pointer hover:opacity-95 transition-opacity"
                                        >
                                            <img
                                                src={msg.image}
                                                alt='attachment'
                                                className={`max-w-[200px] sm:max-w-[300px] rounded-lg object-cover ${msg.message ? 'mb-2' : ''}`}
                                            />
                                        </div>
                                    )}
                                    {msg.message && (
                                        <div
                                            className={`px-3 sm:px-4 py-2 sm:py-2.5 break-words ${isSender
                                                ? 'bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-2xl rounded-br-md'
                                                : 'bg-gray-800 text-white rounded-2xl rounded-bl-md'
                                                } ${isLastInGroup && !msg.image ? '' : isSender ? 'rounded-br-2xl' : 'rounded-bl-2xl'}`}
                                        >
                                            <p className='text-xs sm:text-sm leading-relaxed'>{msg.message}</p>
                                        </div>
                                    )}
                                </div>
                                {!isSender && (
                                    <span className='text-[9px] sm:text-[10px] text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block'>
                                        {formatTime(msg.createdAt)}
                                    </span>
                                )}
                            </div>
                        </div>
                    )
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Image Overlay */}
            {overlayImage && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4 transition-opacity duration-300"
                    onClick={() => setOverlayImage(null)}
                >
                    <button
                        className="absolute top-5 right-5 text-white bg-gray-800/50 rounded-full p-2 hover:bg-gray-700 transition-colors"
                        onClick={() => setOverlayImage(null)}
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <img
                        src={overlayImage}
                        alt="Full view"
                        className="max-h-[90vh] max-w-[90vw] object-contain rounded-md shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}

            <style>{`
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
        </div>
    )
}

export default Messages
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { X, Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { markViewed as markViewedAction } from '@/redux/storySlice';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;
const DEFAULT_AVATAR = 'https://res.cloudinary.com/dva00tzke/image/upload/v1768276886/user_curjop.png?v=2';

const StoryViewer = ({ isOpen, onClose, initialUserIndex, storyGroups }) => {
    const [currentUserIndex, setCurrentUserIndex] = useState(initialUserIndex);
    const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [progress, setProgress] = useState(0);
    const videoRef = useRef(null);
    const timerRef = useRef(null);
    const dispatch = useDispatch();

    const navigate = useNavigate();

    // Safety check to ensure storyGroups is valid and not empty
    const safeStoryGroups = Array.isArray(storyGroups) ? storyGroups : [];
    const currentUserStories = safeStoryGroups[currentUserIndex];
    const currentStory = currentUserStories?.stories?.[currentStoryIndex];

    const storyDuration = currentStory?.mediaType === 'video'
        ? (currentStory?.duration || 15) * 1000
        : 5000; // 5 seconds for images

    useEffect(() => {
        if (isOpen) {
            setCurrentUserIndex(initialUserIndex);
            setCurrentStoryIndex(0);
            setProgress(0);
            setIsPaused(false);
        }
    }, [initialUserIndex, isOpen]);

    // Mark story as viewed
    const markViewed = useCallback(async (storyId) => {
        try {
            if (!storyId) return;
            await axios.post(`${API_URL}/api/v1/story/${storyId}/view`, {}, {
                withCredentials: true
            });
            dispatch(markViewedAction({
                userId: currentUserStories?.userId,
                storyId
            }));
        } catch (error) {
            console.log(error);
        }
    }, [currentUserStories?.userId, dispatch]);

    // Progress timer
    useEffect(() => {
        if (!isOpen || isPaused || !currentStory) return;

        // Mark as viewed
        if (!currentStory.seen) {
            markViewed(currentStory._id);
        }

        const interval = 50; // Update every 50ms
        const increment = (interval / storyDuration) * 100;

        timerRef.current = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    // Need to handle next story transition inside the interval or use effect
                    // We'll rely on the next render cycle effectively
                    return 100;
                }
                return prev + increment;
            });
        }, interval);

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [isOpen, isPaused, currentStory, storyDuration, markViewed]);

    // Handle auto-advance when progress hits 100
    useEffect(() => {
        if (progress >= 100) {
            goToNextStory();
        }
    }, [progress]);

    // Handle video playback
    useEffect(() => {
        if (currentStory?.mediaType === 'video' && videoRef.current) {
            if (isPaused) {
                videoRef.current.pause();
            } else {
                videoRef.current.play().catch(() => { });
            }
        }
    }, [isPaused, currentStory]);

    const goToNextStory = () => {
        if (currentStoryIndex < (currentUserStories?.stories?.length || 0) - 1) {
            setCurrentStoryIndex(prev => prev + 1);
            setProgress(0);
        } else if (currentUserIndex < safeStoryGroups.length - 1) {
            setCurrentUserIndex(prev => prev + 1);
            setCurrentStoryIndex(0);
            setProgress(0);
        } else {
            onClose();
        }
    };

    const goToPrevStory = () => {
        if (currentStoryIndex > 0) {
            setCurrentStoryIndex(prev => prev - 1);
            setProgress(0);
        } else if (currentUserIndex > 0) {
            setCurrentUserIndex(prev => prev - 1);
            const prevUserStories = safeStoryGroups[currentUserIndex - 1];
            setCurrentStoryIndex((prevUserStories?.stories?.length || 1) - 1);
            setProgress(0);
        }
    };

    const handleProfileClick = (e) => {
        e.stopPropagation();
        onClose();
        navigate(`/profile/${currentUserStories.userId}`);
    };

    if (!isOpen || !currentStory) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[450px] h-[90vh] p-0 bg-black border-none overflow-hidden fixed z-[100] top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]">
                {/* Progress bars */}
                <div className="absolute top-0 left-0 right-0 flex gap-1 p-2 z-20">
                    {currentUserStories.stories.map((_, index) => (
                        <div key={index} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-white transition-all duration-100"
                                style={{
                                    width: index < currentStoryIndex
                                        ? '100%'
                                        : index === currentStoryIndex
                                            ? `${progress}%`
                                            : '0%'
                                }}
                            />
                        </div>
                    ))}
                </div>

                {/* Header */}
                <div className="absolute top-4 left-0 right-0 flex items-center justify-between px-4 z-20">
                    <div
                        className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={handleProfileClick}
                    >
                        <Avatar className="w-10 h-10 border-2 border-white">
                            <AvatarImage src={currentUserStories.avatar || DEFAULT_AVATAR} />
                            <AvatarFallback><img src={DEFAULT_AVATAR} alt="def" /></AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="text-white font-semibold text-sm">{currentUserStories.username}</p>
                            <p className="text-white/60 text-xs">
                                {new Date(currentStory.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setIsPaused(!isPaused)} className="text-white p-2">
                            {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                        </button>
                        {currentStory.mediaType === 'video' && (
                            <button
                                onClick={() => {
                                    setIsMuted(!isMuted);
                                    if (videoRef.current) {
                                        videoRef.current.muted = !isMuted;
                                    }
                                }}
                                className="text-white p-2"
                            >
                                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                            </button>
                        )}
                        <button onClick={onClose} className="text-white p-2">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Story Content */}
                <div
                    className="h-full flex items-center justify-center bg-black"
                    onClick={() => setIsPaused(!isPaused)}
                >
                    {currentStory.mediaType === 'video' ? (
                        <video
                            ref={videoRef}
                            src={currentStory.mediaUrl}
                            className="w-full h-full object-contain"
                            muted={isMuted}
                            playsInline
                            autoPlay
                        />
                    ) : (
                        <img
                            src={currentStory.mediaUrl}
                            alt="story"
                            className="w-full h-full object-contain"
                        />
                    )}
                </div>

                {/* Navigation */}
                <button
                    onClick={(e) => { e.stopPropagation(); goToPrevStory(); }}
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1/3 h-2/3 z-10 hover:bg-white/5 transition-colors"
                />
                <button
                    onClick={(e) => { e.stopPropagation(); goToNextStory(); }}
                    className="absolute right-0 top-1/2 -translate-y-1/2 w-1/3 h-2/3 z-10 hover:bg-white/5 transition-colors"
                />
            </DialogContent>
        </Dialog>
    );
};

export default StoryViewer;

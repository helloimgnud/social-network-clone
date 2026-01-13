import React, { useRef, useState } from 'react';
import { Dialog, DialogContent } from './ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Loader2, Film, ArrowLeft, Play, Pause } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { addReel } from '@/redux/reelSlice';

const API_URL = import.meta.env.VITE_API_URL;
const DEFAULT_AVATAR = 'https://res.cloudinary.com/dva00tzke/image/upload/v1768276886/user_curjop.png?v=2';

// Max duration for reels: 60 seconds
const MAX_REEL_DURATION = 60;
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const CreateReel = ({ open, setOpen, onSuccess }) => {
    const videoRef = useRef();
    const inputRef = useRef();
    const [file, setFile] = useState(null);
    const [caption, setCaption] = useState('');
    const [videoPreview, setVideoPreview] = useState('');
    const [loading, setLoading] = useState(false);
    const [duration, setDuration] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [error, setError] = useState('');

    const { user } = useSelector(store => store.auth);
    const dispatch = useDispatch();

    const handleFileChange = async (e) => {
        const selectedFile = e.target.files?.[0];
        setError('');

        if (selectedFile) {
            // Validate file type
            if (!selectedFile.type.startsWith('video/')) {
                setError('Please select a video file');
                return;
            }

            // Validate file size
            if (selectedFile.size > MAX_FILE_SIZE) {
                setError('Video size must be less than 50MB');
                return;
            }

            // Create preview URL
            const previewUrl = URL.createObjectURL(selectedFile);

            // Create a video element to get duration
            const video = document.createElement('video');
            video.preload = 'metadata';
            video.onloadedmetadata = () => {
                URL.revokeObjectURL(video.src);
                const videoDuration = video.duration;

                if (videoDuration > MAX_REEL_DURATION) {
                    setError(`Video must be ${MAX_REEL_DURATION} seconds or less (current: ${Math.round(videoDuration)}s)`);
                    URL.revokeObjectURL(previewUrl);
                    return;
                }

                setDuration(videoDuration);
                setFile(selectedFile);
                setVideoPreview(previewUrl);
            };
            video.src = URL.createObjectURL(selectedFile);
        }
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

    const handleSubmit = async () => {
        if (!file) {
            toast.error('Please select a video');
            return;
        }

        const formData = new FormData();
        formData.append('video', file);
        formData.append('caption', caption);
        formData.append('duration', duration.toString());

        try {
            setLoading(true);
            const res = await axios.post(`${API_URL}/api/v1/reel/addreel`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                withCredentials: true
            });

            if (res.data.success) {
                dispatch(addReel(res.data.reel));
                toast.success('Reel created successfully!');
                handleClose();
                onSuccess?.();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create reel');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setOpen(false);
        setFile(null);
        setCaption('');
        setVideoPreview('');
        setDuration(0);
        setIsPlaying(false);
        setError('');
        if (videoPreview) {
            URL.revokeObjectURL(videoPreview);
        }
    };

    const clearVideo = () => {
        setFile(null);
        setVideoPreview('');
        setDuration(0);
        setIsPlaying(false);
        setError('');
        if (videoPreview) {
            URL.revokeObjectURL(videoPreview);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px] p-0 gap-0 overflow-hidden bg-white rounded-xl fixed z-[100] top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]">
                {/* Header */}
                <div className="flex items-center justify-between border-b px-4 py-3 bg-white z-10">
                    {videoPreview ? (
                        <Button variant="ghost" size="icon" onClick={clearVideo} className="h-8 w-8 -ml-2 text-gray-600">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    ) : (
                        <div className="w-8"></div>
                    )}

                    <h2 className="text-base font-semibold text-gray-900">Tạo Reel mới</h2>

                    {videoPreview ? (
                        loading ? (
                            <div className="flex items-center text-blue-500 text-sm font-semibold">
                                <Loader2 className='mr-1 h-4 w-4 animate-spin' />
                            </div>
                        ) : (
                            <Button
                                variant="ghost"
                                onClick={handleSubmit}
                                className="text-[#0095F6] font-bold hover:bg-transparent hover:text-[#00376b] px-0 h-auto text-sm"
                            >
                                Chia sẻ
                            </Button>
                        )
                    ) : (
                        <div className="w-8"></div>
                    )}
                </div>

                {/* Content */}
                <div className="flex flex-col">
                    {!videoPreview ? (
                        <div className="flex flex-col items-center justify-center h-[450px] gap-4 p-8">
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-xl opacity-30"></div>
                                <Film className="w-20 h-20 text-gray-300 relative z-10" strokeWidth={1} />
                            </div>
                            <p className="text-xl font-light text-gray-600">Tạo Reels của bạn</p>
                            <p className="text-sm text-gray-400">Video tối đa 60 giây, dung lượng 50MB</p>

                            {error && (
                                <p className="text-sm text-red-500 text-center">{error}</p>
                            )}

                            <input
                                ref={inputRef}
                                type="file"
                                accept="video/mp4,video/webm,video/quicktime"
                                className="hidden"
                                onChange={handleFileChange}
                            />

                            <Button
                                onClick={() => inputRef.current.click()}
                                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-sm font-semibold px-6 py-2 rounded-lg"
                            >
                                Chọn video từ máy tính
                            </Button>
                        </div>
                    ) : (
                        <div className="flex flex-col max-h-[70vh] overflow-y-auto">
                            {/* Video Preview */}
                            <div
                                className="relative w-full bg-black flex items-center justify-center min-h-[350px] cursor-pointer"
                                onClick={togglePlay}
                            >
                                <video
                                    ref={videoRef}
                                    src={videoPreview}
                                    className="w-full h-auto max-h-[350px] object-contain"
                                    loop
                                    muted
                                    playsInline
                                />
                                {!isPlaying && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className="bg-black/40 rounded-full p-3">
                                            <Play className="w-8 h-8 text-white" fill="white" />
                                        </div>
                                    </div>
                                )}

                                {/* Duration badge */}
                                <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                    {Math.floor(duration)}s
                                </div>
                            </div>

                            {/* User info and caption */}
                            <div className="p-4 space-y-3">
                                <div className="flex gap-3 items-center">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={user?.profilePicture || DEFAULT_AVATAR} alt="img" />
                                        <AvatarFallback><img src={DEFAULT_AVATAR} alt="def" /></AvatarFallback>
                                    </Avatar>
                                    <span className="font-semibold text-sm text-gray-900">{user?.username}</span>
                                </div>

                                <Textarea
                                    value={caption}
                                    onChange={(e) => setCaption(e.target.value)}
                                    className="min-h-[80px] focus-visible:ring-0 border-none resize-none p-0 text-base placeholder:text-gray-400"
                                    placeholder="Viết caption cho reel..."
                                    maxLength={2200}
                                />
                                <p className="text-xs text-gray-400 text-right">{caption.length}/2200</p>
                            </div>

                            {/* Change video button */}
                            <div className="px-4 pb-4 border-t pt-3 mt-auto">
                                <input
                                    ref={inputRef}
                                    type="file"
                                    accept="video/mp4,video/webm,video/quicktime"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                                <Button
                                    variant="outline"
                                    onClick={() => inputRef.current.click()}
                                    className="w-full text-xs text-gray-500 border-gray-200"
                                >
                                    Thay đổi video
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default CreateReel;

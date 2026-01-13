import React, { useRef, useState } from 'react';
import { Dialog, DialogContent } from './ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Loader2, ImagePlus, Film, ArrowLeft, Play } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { addStory } from '@/redux/storySlice';

const API_URL = import.meta.env.VITE_API_URL;
const DEFAULT_AVATAR = 'https://res.cloudinary.com/dva00tzke/image/upload/v1768276886/user_curjop.png?v=2';

// Max duration for stories: 15 seconds
const MAX_STORY_DURATION = 15;
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const CreateStory = ({ open, setOpen, onSuccess }) => {
    const inputRef = useRef();
    const videoRef = useRef();
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState('');
    const [mediaType, setMediaType] = useState(null); // 'image' or 'video'
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
            const isVideo = selectedFile.type.startsWith('video/');
            const isImage = selectedFile.type.startsWith('image/');

            if (!isVideo && !isImage) {
                setError('Please select an image or video file');
                return;
            }

            // Validate file size
            if (selectedFile.size > MAX_FILE_SIZE) {
                setError('File size must be less than 50MB');
                return;
            }

            const previewUrl = URL.createObjectURL(selectedFile);

            if (isVideo) {
                // Validate video duration
                const video = document.createElement('video');
                video.preload = 'metadata';
                video.onloadedmetadata = () => {
                    URL.revokeObjectURL(video.src);
                    const videoDuration = video.duration;

                    if (videoDuration > MAX_STORY_DURATION) {
                        setError(`Video must be ${MAX_STORY_DURATION} seconds or less (current: ${Math.round(videoDuration)}s)`);
                        URL.revokeObjectURL(previewUrl);
                        return;
                    }

                    setDuration(videoDuration);
                    setFile(selectedFile);
                    setPreview(previewUrl);
                    setMediaType('video');
                };
                video.src = URL.createObjectURL(selectedFile);
            } else {
                setFile(selectedFile);
                setPreview(previewUrl);
                setMediaType('image');
                setDuration(0);
            }
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
            toast.error('Please select an image or video');
            return;
        }

        const formData = new FormData();
        formData.append('media', file);
        if (mediaType === 'video') {
            formData.append('duration', duration.toString());
        }

        try {
            setLoading(true);
            const res = await axios.post(`${API_URL}/api/v1/story/create`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                withCredentials: true
            });

            if (res.data.success) {
                dispatch(addStory({
                    userId: user._id,
                    story: res.data.story
                }));
                toast.success('Story created successfully!');
                handleClose();
                onSuccess?.();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create story');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setOpen(false);
        setFile(null);
        setPreview('');
        setMediaType(null);
        setDuration(0);
        setIsPlaying(false);
        setError('');
        if (preview) {
            URL.revokeObjectURL(preview);
        }
    };

    const clearMedia = () => {
        setFile(null);
        setPreview('');
        setMediaType(null);
        setDuration(0);
        setIsPlaying(false);
        setError('');
        if (preview) {
            URL.revokeObjectURL(preview);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[400px] p-0 gap-0 overflow-hidden bg-white rounded-xl fixed z-[100] top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]">
                {/* Header */}
                <div className="flex items-center justify-between border-b px-4 py-3 bg-white z-10">
                    {preview ? (
                        <Button variant="ghost" size="icon" onClick={clearMedia} className="h-8 w-8 -ml-2 text-gray-600">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    ) : (
                        <div className="w-8"></div>
                    )}

                    <h2 className="text-base font-semibold text-gray-900">Tạo tin</h2>

                    {preview ? (
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
                    {!preview ? (
                        <div className="flex flex-col items-center justify-center h-[400px] gap-4 p-8">
                            <div className="relative flex gap-4">
                                <div className="flex flex-col items-center">
                                    <div className="bg-gradient-to-r from-yellow-400 via-red-500 to-purple-500 rounded-full p-3">
                                        <ImagePlus className="w-10 h-10 text-white" strokeWidth={1.5} />
                                    </div>
                                    <span className="text-xs text-gray-500 mt-1">Ảnh</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-full p-3">
                                        <Film className="w-10 h-10 text-white" strokeWidth={1.5} />
                                    </div>
                                    <span className="text-xs text-gray-500 mt-1">Video</span>
                                </div>
                            </div>

                            <p className="text-lg font-light text-gray-600 mt-4">Tạo tin của bạn</p>
                            <p className="text-sm text-gray-400 text-center">Video tối đa 15 giây<br />Tin sẽ tự động xóa sau 24 giờ</p>

                            {error && (
                                <p className="text-sm text-red-500 text-center">{error}</p>
                            )}

                            <input
                                ref={inputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
                                className="hidden"
                                onChange={handleFileChange}
                            />

                            <Button
                                onClick={() => inputRef.current.click()}
                                className="bg-gradient-to-r from-yellow-400 via-red-500 to-purple-500 hover:opacity-90 text-sm font-semibold px-6 py-2 rounded-lg"
                            >
                                Chọn ảnh hoặc video
                            </Button>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {/* Media Preview */}
                            <div
                                className="relative w-full bg-black flex items-center justify-center h-[450px] cursor-pointer"
                                onClick={mediaType === 'video' ? togglePlay : undefined}
                            >
                                {mediaType === 'video' ? (
                                    <>
                                        <video
                                            ref={videoRef}
                                            src={preview}
                                            className="w-full h-full object-contain"
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
                                        <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                            {Math.floor(duration)}s
                                        </div>
                                    </>
                                ) : (
                                    <img
                                        src={preview}
                                        alt="preview"
                                        className="w-full h-full object-contain"
                                    />
                                )}
                            </div>

                            {/* User info */}
                            <div className="p-4 flex items-center gap-3 border-t">
                                <Avatar className="h-10 w-10 ring-2 ring-gradient-to-r from-yellow-400 via-red-500 to-purple-500">
                                    <AvatarImage src={user?.profilePicture || DEFAULT_AVATAR} alt="img" />
                                    <AvatarFallback><img src={DEFAULT_AVATAR} alt="def" /></AvatarFallback>
                                </Avatar>
                                <div>
                                    <span className="font-semibold text-sm text-gray-900">{user?.username}</span>
                                    <p className="text-xs text-gray-400">Tin của bạn</p>
                                </div>
                            </div>

                            {/* Change media button */}
                            <div className="px-4 pb-4">
                                <input
                                    ref={inputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                                <Button
                                    variant="outline"
                                    onClick={() => inputRef.current.click()}
                                    className="w-full text-xs text-gray-500 border-gray-200"
                                >
                                    Thay đổi {mediaType === 'video' ? 'video' : 'ảnh'}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default CreateStory;

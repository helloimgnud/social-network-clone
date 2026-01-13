import React, { useRef, useState } from 'react'
import { Dialog, DialogContent } from './ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { readFileAsDataURL } from '@/lib/utils';
import { Loader2, ImagePlus, Film, ArrowLeft, Play } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { setPosts } from '@/redux/postSlice';

const API_URL = import.meta.env.VITE_API_URL;
const DEFAULT_AVATAR = 'https://res.cloudinary.com/dva00tzke/image/upload/v1768276886/user_curjop.png?v=2';
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const CreatePost = ({ open, setOpen }) => {
  const mediaRef = useRef();
  const videoRef = useRef();
  const [file, setFile] = useState("");
  const [caption, setCaption] = useState("");
  const [preview, setPreview] = useState("");
  const [mediaType, setMediaType] = useState(null); // 'image' or 'video'
  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const { user } = useSelector(store => store.auth);
  const { posts } = useSelector(store => store.post);
  const dispatch = useDispatch();

  const fileChangeHandler = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file size
      if (selectedFile.size > MAX_FILE_SIZE) {
        toast.error('File size must be less than 50MB');
        return;
      }

      const isVideo = selectedFile.type.startsWith('video/');
      const isImage = selectedFile.type.startsWith('image/');

      if (!isVideo && !isImage) {
        toast.error('Please select an image or video file');
        return;
      }

      setFile(selectedFile);
      setMediaType(isVideo ? 'video' : 'image');

      if (isVideo) {
        setPreview(URL.createObjectURL(selectedFile));
      } else {
        const dataUrl = await readFileAsDataURL(selectedFile);
        setPreview(dataUrl);
      }
    }
  }

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

  const createPostHandler = async (e) => {
    const formData = new FormData();
    formData.append("caption", caption);
    if (preview) formData.append("image", file);
    try {
      setLoading(true);
      const res = await axios.post(`${API_URL}/api/v1/post/addpost`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        withCredentials: true
      });
      if (res.data.success) {
        dispatch(setPosts([res.data.post, ...posts]));
        toast.success(res.data.message);
        handleClose();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const handleClose = () => {
    setOpen(false);
    setCaption("");
    setPreview("");
    setFile("");
    setMediaType(null);
    setIsPlaying(false);
  }

  const clearMediaHandler = () => {
    if (preview && mediaType === 'video') {
      URL.revokeObjectURL(preview);
    }
    setPreview("");
    setFile("");
    setMediaType(null);
    setIsPlaying(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent onInteractOutside={() => handleClose()} className="sm:max-w-[500px] p-0 gap-0 overflow-hidden bg-[#262626] border-gray-700 rounded-xl fixed z-[100] top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]">

        <div className="flex items-center justify-between border-b border-gray-700 px-4 py-3 bg-[#262626] z-10">
          {preview ? (
            <Button variant="ghost" size="icon" onClick={clearMediaHandler} className="h-8 w-8 -ml-2 text-gray-300 hover:text-white hover:bg-gray-700">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          ) : (
            <div className="w-8"></div>
          )}

          <h2 className="text-base font-semibold text-white">Tạo bài viết mới</h2>

          {preview ? (
            loading ? (
              <div className="flex items-center text-blue-500 text-sm font-semibold">
                <Loader2 className='mr-1 h-4 w-4 animate-spin' />
              </div>
            ) : (
              <Button
                variant="ghost"
                onClick={createPostHandler}
                className="text-[#0095F6] font-bold hover:bg-transparent hover:text-[#00376b] px-0 h-auto text-sm"
              >
                Chia sẻ
              </Button>
            )
          ) : (
            <div className="w-8"></div>
          )}
        </div>

        <div className="flex flex-col">
          {!preview ? (
            <div className="flex flex-col items-center justify-center h-[400px] gap-4 p-8">
              <div className="relative flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="bg-gray-700 rounded-full p-3">
                    <ImagePlus className="w-12 h-12 text-gray-400" strokeWidth={1} />
                  </div>
                  <span className="text-xs text-gray-400 mt-1">Ảnh</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="bg-gray-700 rounded-full p-3">
                    <Film className="w-12 h-12 text-gray-400" strokeWidth={1} />
                  </div>
                  <span className="text-xs text-gray-400 mt-1">Video</span>
                </div>
              </div>
              <p className="text-xl font-light text-gray-300">Kéo ảnh hoặc video vào đây</p>

              <input
                ref={mediaRef}
                type='file'
                accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime"
                className='hidden'
                onChange={fileChangeHandler}
              />

              <Button
                onClick={() => mediaRef.current.click()}
                className='bg-[#0095F6] hover:bg-[#1877F2] text-sm font-semibold px-6 py-2 rounded-lg'
              >
                Chọn từ máy tính
              </Button>
            </div>
          ) : (
            <div className="flex flex-col max-h-[70vh] overflow-y-auto">
              <div
                className="w-full bg-black flex items-center justify-center min-h-[300px] cursor-pointer"
                onClick={mediaType === 'video' ? togglePlay : undefined}
              >
                {mediaType === 'video' ? (
                  <div className="relative w-full">
                    <video
                      ref={videoRef}
                      src={preview}
                      className='w-full h-auto max-h-[400px] object-contain'
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
                  </div>
                ) : (
                  <img
                    src={preview}
                    alt="preview_img"
                    className='w-full h-auto max-h-[400px] object-contain'
                  />
                )}
              </div>

              <div className="p-4 space-y-3">
                <div className='flex gap-3 items-center'>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.profilePicture || DEFAULT_AVATAR} alt="img" />
                    <AvatarFallback><img src={DEFAULT_AVATAR} alt="def" /></AvatarFallback>
                  </Avatar>
                  <span className='font-semibold text-sm text-white'>{user?.username}</span>
                  {mediaType === 'video' && (
                    <span className="text-xs bg-purple-900/50 text-purple-300 px-2 py-0.5 rounded-full">Video</span>
                  )}
                </div>

                <Textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="min-h-[100px] focus-visible:ring-0 border-none resize-none p-0 text-base placeholder:text-gray-500 bg-transparent text-white"
                  placeholder="Viết caption..."
                />
              </div>

              <div className="px-4 pb-4 border-t border-gray-700 pt-3 mt-auto">
                <input
                  ref={mediaRef}
                  type='file'
                  accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime"
                  className='hidden'
                  onChange={fileChangeHandler}
                />
                <Button
                  variant="outline"
                  onClick={() => mediaRef.current.click()}
                  className='w-full text-xs text-gray-300 border-gray-600 bg-transparent hover:bg-gray-700 hover:text-white'
                >
                  Thay đổi {mediaType === 'video' ? 'video' : 'ảnh'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default CreatePost
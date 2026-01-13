import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { Heart, MessageCircle, Play, Repeat } from 'lucide-react';
import PostDetailModal from './PostDetailModal';

const API_URL = import.meta.env.VITE_API_URL;

const Archive = () => {
    const [archivedPosts, setArchivedPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPost, setSelectedPost] = useState(null);

    useEffect(() => {
        const fetchArchivedPosts = async () => {
            try {
                const res = await axios.get(`${API_URL}/api/v1/post/archived/all`, { withCredentials: true });
                if (res.data.success) {
                    setArchivedPosts(res.data.posts);
                }
            } catch (error) {
                console.log(error);
            } finally {
                setLoading(false);
            }
        }
        fetchArchivedPosts();
    }, []);

    if (loading) {
        return (
            <div className='flex justify-center items-center h-screen bg-[#0F1115]'>
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
            </div>
        );
    }

    return (
        <div className='flex-1 min-h-screen bg-[#0F1115]'>
            <div className='max-w-5xl mx-auto px-4 py-8'>
                <h1 className='text-2xl font-bold mb-8 text-center text-white'>Kho lưu trữ</h1>

                {archivedPosts.length === 0 ? (
                    <div className='flex flex-col items-center justify-center text-gray-500 py-20'>
                        <p className="text-lg">Chưa có bài viết nào được lưu trữ.</p>
                    </div>
                ) : (
                    <div className='grid grid-cols-3 gap-1'>
                        {archivedPosts.map((post) => (
                            <div
                                key={post._id}
                                className='relative group cursor-pointer aspect-square bg-gray-900'
                                onClick={() => setSelectedPost(post)}
                            >
                                {post.mediaType === 'video' || post.image?.includes('/video/') ? (
                                    <>
                                        <video
                                            src={post.image}
                                            className='w-full h-full object-cover'
                                        />
                                        <div className="absolute top-2 right-2">
                                            <Play className="w-5 h-5 text-white drop-shadow-lg" fill="white" />
                                        </div>
                                    </>
                                ) : (
                                    <img
                                        src={post.image}
                                        alt='post'
                                        className='w-full h-full object-cover'
                                    />
                                )}

                                {post.originalPost && (
                                    <div className="absolute top-2 left-2 bg-black/50 p-1 rounded-full">
                                        <Repeat className="w-4 h-4 text-white" />
                                    </div>
                                )}

                                <div className='absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity duration-300'>
                                    <div className='flex items-center text-white space-x-6'>
                                        <div className='flex items-center gap-2'>
                                            <Heart className="w-6 h-6" fill="white" />
                                            <span className="font-bold text-lg">{post.likes?.length || 0}</span>
                                        </div>
                                        <div className='flex items-center gap-2'>
                                            <MessageCircle className="w-6 h-6" fill="white" />
                                            <span className="font-bold text-lg">{post.comments?.length || 0}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <PostDetailModal
                post={selectedPost}
                isOpen={!!selectedPost}
                onClose={() => setSelectedPost(null)}
            />
        </div>
    );
}

export default Archive;

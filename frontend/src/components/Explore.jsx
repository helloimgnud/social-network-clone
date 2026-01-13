import React, { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { toast } from 'sonner';
import { Heart, MessageCircle, Play } from 'lucide-react';
import PostDetailModal from './PostDetailModal';

const API_URL = import.meta.env.VITE_API_URL;

// Grid item component for both posts and reels
const ExploreItem = ({ item, type, onClick }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            className="explore-item relative cursor-pointer overflow-hidden bg-gray-900"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => onClick(item, type)}
        >
            {type === 'reel' ? (
                <>
                    <video
                        src={item.video}
                        className="w-full h-full object-cover"
                        muted
                        loop
                        playsInline
                        onMouseEnter={(e) => e.target.play()}
                        onMouseLeave={(e) => {
                            e.target.pause();
                            e.target.currentTime = 0;
                        }}
                    />
                    <div className="absolute top-3 right-3">
                        <Play className="w-5 h-5 text-white drop-shadow-lg" fill="white" />
                    </div>
                </>
            ) : (
                <img
                    src={item.image}
                    alt={item.caption || 'Post'}
                    className="w-full h-full object-cover"
                />
            )}

            {/* Hover overlay with stats */}
            <div
                className={`absolute inset-0 bg-black/40 flex items-center justify-center gap-6 transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'
                    }`}
            >
                <div className="flex items-center gap-2 text-white font-semibold">
                    <Heart className="w-6 h-6" fill="white" />
                    <span>{item.likes?.length || 0}</span>
                </div>
                <div className="flex items-center gap-2 text-white font-semibold">
                    <MessageCircle className="w-6 h-6" fill="white" />
                    <span>{item.comments?.length || 0}</span>
                </div>
            </div>
        </div>
    );
};

const Explore = () => {
    const [posts, setPosts] = useState([]);
    const [reels, setReels] = useState([]);
    const [mixedContent, setMixedContent] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState(null);
    const { user } = useSelector((store) => store.auth);

    const fetchContent = useCallback(async () => {
        try {
            setLoading(true);

            // Fetch posts and reels in parallel
            const [postsRes, reelsRes] = await Promise.all([
                axios.get(`${API_URL}/api/v1/post/all`, { withCredentials: true }),
                axios.get(`${API_URL}/api/v1/reel/all`, { withCredentials: true })
            ]);

            const fetchedPosts = postsRes.data.posts || [];
            const fetchedReels = reelsRes.data.reels || [];

            setPosts(fetchedPosts);
            setReels(fetchedReels);

            // Create mixed content array with type identifier
            const postsWithType = fetchedPosts.map(p => ({ ...p, _type: 'post' }));
            const reelsWithType = fetchedReels.map(r => ({ ...r, _type: 'reel' }));

            // Shuffle and mix content for explore feed
            const mixed = [...postsWithType, ...reelsWithType].sort(() => Math.random() - 0.5);
            setMixedContent(mixed);
        } catch (error) {
            console.error('Error fetching explore content:', error);
            toast.error('Failed to load explore content');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchContent();
    }, [fetchContent]);

    const handleItemClick = (item, type) => {
        setSelectedItem(item);
    };

    if (loading) {
        return (
            <div className="explore-container flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
            </div>
        );
    }

    return (
        <div className="explore-container max-w-5xl mx-auto py-6 px-4">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-white mb-2">Khám phá</h1>
                <p className="text-gray-400 text-sm">
                    Discover posts and reels from the community
                </p>
            </div>

            {mixedContent.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <p className="text-gray-400 text-lg mb-2">No content to explore yet</p>
                    <p className="text-gray-500 text-sm">Be the first to create a post or reel!</p>
                </div>
            ) : (
                <div className="explore-grid">
                    {mixedContent.map((item, index) => {
                        // Create varied grid layout similar to Instagram explore
                        const isLarge = index % 10 === 0 || index % 10 === 6;

                        return (
                            <div
                                key={item._id}
                                className={`explore-grid-item ${isLarge ? 'explore-grid-large' : ''}`}
                            >
                                <ExploreItem
                                    item={item}
                                    type={item._type}
                                    onClick={handleItemClick}
                                />
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Post/Reel Detail Modal */}
            <PostDetailModal
                post={selectedItem}
                isOpen={!!selectedItem}
                onClose={() => setSelectedItem(null)}
            />

            <style>{`
        .explore-container {
          min-height: calc(100vh - 40px);
        }

        .explore-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 4px;
        }

        @media (max-width: 768px) {
          .explore-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 480px) {
          .explore-grid {
            grid-template-columns: repeat(1, 1fr);
          }
        }

        .explore-grid-item {
          aspect-ratio: 1;
        }

        .explore-grid-large {
          grid-column: span 2;
          grid-row: span 2;
        }

        @media (max-width: 768px) {
          .explore-grid-large {
            grid-column: span 1;
            grid-row: span 1;
          }
        }

        .explore-item {
          width: 100%;
          height: 100%;
        }

        .explore-item img,
        .explore-item video {
          transition: transform 0.3s ease;
        }

        .explore-item:hover img,
        .explore-item:hover video {
          transform: scale(1.05);
        }
      `}</style>
        </div>
    );
};

export default Explore;

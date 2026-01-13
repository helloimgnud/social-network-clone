import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { X, ChevronLeft, ChevronRight, Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDispatch, useSelector } from 'react-redux';
import { setStories, markViewed as markViewedAction } from '@/redux/storySlice';
import axios from 'axios';
import CreateStory from './CreateStory';

const API_URL = import.meta.env.VITE_API_URL;
const DEFAULT_AVATAR = 'https://res.cloudinary.com/dva00tzke/image/upload/v1768276886/user_curjop.png?v=2';
import StoryViewer from './StoryViewer';


// Story Avatar Component
const StoryAvatar = ({ user, onClick, isYourStory = false }) => {
  const hasUnseenStories = user.hasUnseenStories || user.stories?.some(s => !s.seen);

  return (
    <div
      onClick={onClick}
      className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer group"
      style={{ width: '80px' }}
    >
      <div className="relative w-[66px] h-[66px]">
        <div className={`absolute inset-0 rounded-full ${hasUnseenStories
          ? 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500'
          : 'bg-gray-600'
          } p-[2px]`}>
          <div className="w-full h-full rounded-full bg-gray-900 p-[2.5px]">
            <Avatar className="w-full h-full">
              <AvatarImage src={user.avatar || DEFAULT_AVATAR} />
              <AvatarFallback className="bg-gray-700 text-gray-300"><img src={DEFAULT_AVATAR} alt="def" /></AvatarFallback>
            </Avatar>
          </div>
        </div>

        {isYourStory && (
          <button className="absolute bottom-0 right-0 w-5 h-5 bg-blue-500 border-2 border-gray-900 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors">
            <span className="text-white text-sm font-bold leading-none">+</span>
          </button>
        )}
      </div>

      <span className={`text-xs text-gray-300 w-full truncate text-center group-hover:text-white transition-colors ${isYourStory ? 'font-medium' : ''
        }`}>
        {isYourStory ? 'Your story' : user.username}
      </span>
    </div>
  );
};

const Stories = () => {
  const dispatch = useDispatch();
  const { stories } = useSelector(store => store.story);
  const { user } = useSelector(store => store.auth);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedUserIndex, setSelectedUserIndex] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [startIndex, setStartIndex] = useState(0);

  // Configuration
  const ITEM_WIDTH = 80;
  const GAP = 16;
  const ITEMS_VISIBLE = 6;
  const ITEMS_TO_SCROLL = 4;
  const UNIT_WIDTH = ITEM_WIDTH + GAP;

  // Fetch stories
  useEffect(() => {
    const fetchStories = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/v1/story/feed`, {
          withCredentials: true
        });
        if (res.data.success) {
          dispatch(setStories(res.data.stories));
        }
      } catch (error) {
        console.log(error);
      }
    };
    fetchStories();
  }, [dispatch]);

  // Add current user placeholder if they have no stories
  const displayStories = [...stories];
  const currentUserHasStories = stories.some(s => s.userId === user?._id);
  if (!currentUserHasStories && user) {
    displayStories.unshift({
      userId: user._id,
      username: user.username,
      avatar: user.profilePicture || DEFAULT_AVATAR,
      stories: [],
      hasUnseenStories: false,
      isPlaceholder: true
    });
  }

  const handleNext = () => {
    const maxIndex = displayStories.length - ITEMS_VISIBLE;
    if (startIndex < maxIndex) {
      setStartIndex(Math.min(startIndex + ITEMS_TO_SCROLL, maxIndex));
    }
  };

  const handlePrev = () => {
    if (startIndex > 0) {
      setStartIndex(Math.max(startIndex - ITEMS_TO_SCROLL, 0));
    }
  };

  // Filter only valid stories for the viewer
  const validStoryGroups = displayStories.filter(s => s.stories?.length > 0);

  const handleStoryClick = (index) => {
    const storyGroup = displayStories[index];
    if (storyGroup.isPlaceholder || storyGroup.stories.length === 0) {
      setCreateOpen(true);
    } else {
      // Find the correct index in the filtered validStoryGroups list
      const validIndex = validStoryGroups.findIndex(s => s.userId === storyGroup.userId);
      if (validIndex !== -1) {
        setSelectedUserIndex(validIndex);
        setViewerOpen(true);
      }
    }
  };

  const handleAddStory = () => {
    setCreateOpen(true);
  };

  return (
    <>
      <div className="relative mb-8 py-4 w-full max-w-[560px] mx-auto group">
        <div className="overflow-hidden w-full">
          <div
            className="flex gap-4 transition-transform duration-500 ease-in-out will-change-transform"
            style={{ transform: `translateX(-${startIndex * UNIT_WIDTH}px)` }}
          >
            {displayStories.map((storyUser, index) => (
              <StoryAvatar
                key={storyUser.userId}
                user={storyUser}
                isYourStory={storyUser.userId === user?._id}
                onClick={() => storyUser.userId === user?._id
                  ? (storyUser.stories?.length > 0 ? handleStoryClick(index) : handleAddStory())
                  : handleStoryClick(index)
                }
              />
            ))}
          </div>
        </div>

        {/* Left Arrow */}
        {startIndex > 0 && (
          <button
            onClick={handlePrev}
            className="absolute left-[-20px] top-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-md hover:bg-gray-50 transition-all z-10 border border-gray-200 opacity-0 group-hover:opacity-100"
            aria-label="Previous stories"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>
        )}

        {/* Right Arrow */}
        {startIndex < (displayStories.length - ITEMS_VISIBLE) && (
          <button
            onClick={handleNext}
            className="absolute right-[-20px] top-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-md hover:bg-gray-50 transition-all z-10 border border-gray-200 opacity-0 group-hover:opacity-100"
            aria-label="Next stories"
          >
            <ChevronRight className="w-5 h-5 text-gray-700" />
          </button>
        )}
      </div>

      {/* Story Viewer */}
      <StoryViewer
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        initialUserIndex={selectedUserIndex}
        storyGroups={validStoryGroups}
      />

      {/* Create Story Dialog */}
      <CreateStory
        open={createOpen}
        setOpen={setCreateOpen}
        onSuccess={() => {
          // Refetch stories
          axios.get(`${API_URL}/api/v1/story/feed`, { withCredentials: true })
            .then(res => {
              if (res.data.success) {
                dispatch(setStories(res.data.stories));
              }
            });
        }}
      />
    </>
  );
};

export default Stories;
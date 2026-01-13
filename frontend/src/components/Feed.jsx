import React from 'react';
import Stories from './Stories'; 
import Posts from './Posts';
import { useSelector } from 'react-redux';
import { Button } from '@/components/ui/button';

const Feed = () => {
  const { posts } = useSelector(store => store.post);

  return (
    <div className="w-full bg-[#0F1115] min-h-screen">
      {/* Stories */}
      <Stories />

      {/* Posts Feed - Using real data from Redux */}
      <div className="max-w-[470px] mx-auto px-0 sm:px-4">
        {!posts || posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No posts yet</p>
            <p className="text-gray-400 text-sm mt-2">Start following people to see their posts</p>
          </div>
        ) : (
          <>
            <Posts />
            <div className="text-center py-8">
              <Button variant="ghost" className="text-gray-500 hover:text-white">
                You're all caught up
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Feed;
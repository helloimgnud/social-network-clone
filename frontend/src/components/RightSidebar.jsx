import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { setAuthUser } from '@/redux/authSlice';
import axios from 'axios';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL;
const DEFAULT_AVATAR = 'https://res.cloudinary.com/dva00tzke/image/upload/v1768276886/user_curjop.png?v=2';

const RightSidebar = () => {
  const { user, suggestedUsers } = useSelector(store => store.auth);
  const [followingUsers, setFollowingUsers] = useState([]);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/v1/user/logout`, { withCredentials: true });
      if (res.data.success) {
        dispatch(setAuthUser(null));
        navigate('/login');
        toast.success(res.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || 'Logout failed');
    }
  };

  const handleFollow = async (userId) => {
    try {
      const res = await axios.post(`${API_URL}/api/v1/user/followorunfollow/${userId}`, {}, {
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });

      if (res.data.success) {
        // Update local state
        if (followingUsers.includes(userId)) {
          setFollowingUsers(followingUsers.filter(id => id !== userId));
        } else {
          setFollowingUsers([...followingUsers, userId]);
        }
        toast.success(res.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || 'Action failed');
    }
  };

  // If no user logged in, don't show sidebar
  if (!user) return null;

  return (
    <div className='w-[350px] my-10 pr-8 hidden lg:block'>
      {/* Current User Profile */}
      <div className='flex items-center gap-3 mb-8'>
        <Link to={`/profile/${user._id}`}>
          <Avatar className='w-14 h-14 cursor-pointer hover:opacity-90 transition-opacity'>
            <AvatarImage src={user.profilePicture || DEFAULT_AVATAR} />
            <AvatarFallback><img src={DEFAULT_AVATAR} alt="def" /></AvatarFallback>
          </Avatar>
        </Link>
        <div className='flex-1 min-w-0'>
          <Link to={`/profile/${user._id}`}>
            <p className='font-semibold text-sm cursor-pointer hover:text-gray-600 transition-colors truncate'>
              {user.username}
            </p>
          </Link>
          <p className='text-gray-500 text-sm truncate'>{user.bio || 'No bio yet'}</p>
        </div>
        <Button
          variant="ghost"
          onClick={handleLogout}
          className='text-blue-500 font-semibold text-sm hover:text-blue-600 hover:bg-transparent'
        >
          Đăng xuất
        </Button>
      </div>

      {/* Suggestions Section */}
      {suggestedUsers && suggestedUsers.length > 0 && (
        <div>
          <div className='flex items-center justify-between mb-4'>
            <p className='font-semibold text-gray-500 text-sm'>Suggestions For You</p>
            <Button variant="ghost" className='text-xs font-semibold hover:text-gray-600 p-0 h-auto hover:bg-transparent'>
              See All
            </Button>
          </div>

          {/* Suggested Users List */}
          <div className='space-y-4'>
            {suggestedUsers.slice(0, 5).map((suggestedUser) => (
              <div key={suggestedUser._id} className='flex items-center gap-3'>
                <Link to={`/profile/${suggestedUser._id}`}>
                  <Avatar className='w-11 h-11 cursor-pointer hover:opacity-90 transition-opacity'>
                    <AvatarImage src={suggestedUser.profilePicture || DEFAULT_AVATAR} />
                    <AvatarFallback><img src={DEFAULT_AVATAR} alt="def" /></AvatarFallback>
                  </Avatar>
                </Link>
                <div className='flex-1 min-w-0'>
                  <Link to={`/profile/${suggestedUser._id}`}>
                    <p className='font-semibold text-sm cursor-pointer hover:text-gray-600 transition-colors truncate'>
                      {suggestedUser.username}
                    </p>
                  </Link>
                  <p className='text-gray-500 text-xs truncate'>
                    {suggestedUser.bio || 'No bio'}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => handleFollow(suggestedUser._id)}
                  className={`font-semibold text-xs p-0 h-auto hover:bg-transparent transition-colors ${followingUsers.includes(suggestedUser._id)
                    ? 'text-gray-700 hover:text-gray-900'
                    : 'text-blue-500 hover:text-blue-600'
                    }`}
                >
                  {followingUsers.includes(suggestedUser._id) ? 'Following' : 'Follow'}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer Links */}
      <div className='mt-8 text-xs text-gray-400 space-y-2'>

        <p> IT4490 INSTAGRAM CLONE</p>
      </div>
    </div>
  );
};

export default RightSidebar;